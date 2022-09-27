const { createServer } = require('http');
const Client = require('socket.io-client');
const DbWorker = require('../components/DbWorker');
const WebSocketServer = require('../components/WebSocketServer');
const mockPuzzleDates = require('./mocks/mockPuzzleDates');
const mockGame = require('./mocks/mockGame');
const {
  newPlayer: mockPlayer,
  addedPlayer,
  onlyTeamPlayer: playerWithTeamGames,
} = require('./mocks/mockPlayer');

jest.mock('../components/DbWorker');

function expectAssertions(max, done) {
  let counter = 0;
  function increment() {
    counter += 1;
    if (counter >= max) {
      done();
    }
  }
  return increment;
}

describe('socket.io server functionality', () => {
  let serverSocket, clientSocket, dbWorker, webSocketServer;

  beforeEach((done) => {
    const httpServer = createServer();
    dbWorker = new DbWorker(jest.fn(), jest.fn(), jest.fn());
    webSocketServer = new WebSocketServer(httpServer, dbWorker);
    webSocketServer.initialize();
    httpServer.listen(() => {
      const { port } = httpServer.address();
      clientSocket = new Client(`http://localhost:${port}`);
      webSocketServer.io.on('connection', (socket) => {
        serverSocket = socket;
      });
      clientSocket.on('connect', done);
    });
  });

  afterEach(() => {
    webSocketServer.io.close();
    clientSocket.close();
    DbWorker.mockClear();
    jest.clearAllMocks().resetAllMocks().restoreAllMocks();
  });

  test('save-board event triggers dbWorker.saveBoard()', (done) => {
    serverSocket.on('save-board', () => {
      try {
        expect(dbWorker.saveBoard).toHaveBeenCalledWith('abc123', { board: 'example' });
        done();
      } catch (error) {
        done(error);
      }
    });
    clientSocket.emit('save-board', 'abc123', { board: 'example' });
  });

  test('client event "get-puzzle-dates" eventually triggers dbWorker.getPuzzleDates(),'
     + 'and eventually server event "load-puzzle-dates" on success', (done) => {
    const count = expectAssertions(2, done);
    jest.spyOn(DbWorker.prototype, 'getPuzzleDates').mockImplementation(() => mockPuzzleDates);

    serverSocket.on('get-puzzle-dates', () => {
      try {
        expect(dbWorker.getPuzzleDates).toHaveBeenCalled();
        count();
      } catch (error) {
        done(error);
      }
    });
    clientSocket.on('load-puzzle-dates', (arg) => {
      try {
        expect(arg).toStrictEqual(mockPuzzleDates);
        count();
      } catch (error) {
        done(error);
      }
    });
    clientSocket.emit('get-puzzle-dates');
  });

  test('"get-game-by-dow" client event triggers dbWorker.getGameByDow(),'
      + 'and eventually sends "load-game" server event on success', (done) => {
    const count = expectAssertions(2, done);
    jest.spyOn(DbWorker.prototype, 'getGameByDow').mockImplementation(() => mockGame);
    jest.spyOn(DbWorker.prototype, 'getPlayerById').mockImplementation(() => mockPlayer);
    const mockSendGame = jest.spyOn(webSocketServer, '__sendGameToClient');
    serverSocket.on('get-game-by-dow', () => {
      try {
        expect(dbWorker.getGameByDow).toHaveBeenCalledWith('Tuesday', mockPlayer.id);
        count();
      } catch (error) {
        done(error);
      }
    });
    clientSocket.on('load-game', (game, socketId) => {
      try {
        expect(mockSendGame).toHaveBeenCalledWith(serverSocket, mockGame, mockPlayer.id);
        expect(game).toStrictEqual(mockGame);
        expect(socketId).toStrictEqual(serverSocket.id);
        count();
      } catch (error) {
        done(error);
      }
    });
    clientSocket.emit('get-game-by-dow', 'Tuesday', mockPlayer.id);
  });

  test('"get-default-game" client event triggers dbWorker.getDefaultGame(),'
     + 'and eventually sends "load-game" server event on success', (done) => {
    const count = expectAssertions(2, done);
    jest.spyOn(DbWorker.prototype, 'getDefaultGame').mockImplementation(() => mockGame);
    jest.spyOn(DbWorker.prototype, 'getPlayerById').mockImplementation(() => mockPlayer);
    const mockSendGame = jest.spyOn(webSocketServer, '__sendGameToClient');
    serverSocket.on('get-default-game', () => {
      try {
        expect(dbWorker.getDefaultGame).toHaveBeenCalledWith(mockPlayer.id);
        count();
      } catch (error) {
        done(error);
      }
    });
    clientSocket.on('load-game', (game, socketId) => {
      try {
        expect(mockSendGame).toHaveBeenCalledWith(serverSocket, mockGame, mockPlayer.id);
        expect(game).toStrictEqual(mockGame);
        expect(socketId).toStrictEqual(serverSocket.id);
        count();
      } catch (error) {
        done(error);
      }
    });
    clientSocket.emit('get-default-game', mockPlayer.id);
  });

  test('__leavePreviousGameRooms removes player from socket room, sends player-offline event'
     + ' to all clients currently in game room, and updates player online status in db', () => {
    const mockIO = {
      emit: jest.fn().mockReturnThis(),
    };
    const ioToRoomSpy = jest.spyOn(webSocketServer.io, 'to').mockImplementation(() => mockIO);

    // simulate old game room
    serverSocket.join('gobbledygook');
    expect(serverSocket.rooms.has('gobbledygook')).toBeTruthy();
    expect(Array.from(serverSocket.rooms).length).toEqual(2);

    // leave old room
    webSocketServer.__leavePreviousGameRooms(serverSocket, mockPlayer.id);
    expect(serverSocket.rooms.has('gobbledygook')).toBeFalsy();
    expect(Array.from(serverSocket.rooms).length).toEqual(1);

    // send player-offline event to all client sockets
    expect(ioToRoomSpy).toHaveBeenCalledWith('gobbledygook');
    expect(mockIO.emit).toBeCalledWith('player-offline', mockPlayer.id, 'gobbledygook');

    // update player online status in db
    expect(dbWorker.updateGameOnlineStatusForPlayer)
      .toHaveBeenCalledWith('gobbledygook', mockPlayer.id, false);
  });

  test('__joinCurrentGameRoom joins socket room, emits "player-online" event to connected clients,'
     + 'and updates player online status in db', async () => {
    jest.spyOn(DbWorker.prototype, 'getPlayerById').mockImplementation(() => mockPlayer);
    const mockIO = {
      emit: jest.fn().mockReturnThis(),
    };
    const ioToRoomSpy = jest.spyOn(webSocketServer.io, 'to').mockImplementation(() => mockIO);

    // confirm new socket room was joined
    expect(Array.from(serverSocket.rooms).length).toEqual(1);
    await webSocketServer.__joinCurrentGameRoom(serverSocket, 'newGame', mockPlayer.id);
    expect(serverSocket.rooms.has('newGame')).toBeTruthy();
    expect(Array.from(serverSocket.rooms).length).toEqual(2);

    // confirm player-online event was sent to all client sockets
    expect(ioToRoomSpy).toHaveBeenCalledWith('newGame');
    expect(mockIO.emit).toBeCalledWith('player-online', mockPlayer.id, 'Best Bud', 'newGame');

    // update player online status in db
    expect(dbWorker.updateGameOnlineStatusForPlayer)
      .toHaveBeenCalledWith('newGame', mockPlayer.id, true);

    // confirm added listeners correctly
    serverSocket.on('disconnect', () => {
      expect(mockIO.emit).toBeCalledWith('player-offline', mockPlayer.id, 'newGame');
      expect(dbWorker.updateGameOnlineStatusForPlayer)
        .toHaveBeenCalledWith('newGame', mockPlayer.id, false);
    });
  });

  test('"get-friend-request-name" event to server will return "game-not-found" event'
      + ' back to client if no game found in db', (done) => {
    jest.spyOn(DbWorker.prototype, 'getGameById').mockImplementation(() => null);
    clientSocket.on('game-not-found', () => {
      done();
    });
    clientSocket.emit('get-friend-request-name', mockGame.gameId);
  });

  test('"get-friend-request-name" event to server will return "display-friend-request" event'
      + ' back to client if game found in db', (done) => {
    jest.spyOn(DbWorker.prototype, 'getGameById').mockImplementation(() => mockGame);
    jest.spyOn(DbWorker.prototype, 'getPlayerById').mockImplementation(() => mockPlayer);
    clientSocket.on('display-friend-request', (arg) => {
      try {
        expect(arg).toBe(mockPlayer.displayName);
        done();
      } catch (e) {
        done(e);
      }
    });
    clientSocket.emit('get-friend-request-name', mockGame.gameId);
  });

  test('"update-player-focus" client event sends "update-player-focus" server event to'
     + ' all clients in game room', (done) => {
    const mockIO = {
      emit: jest.fn().mockReturnThis(),
    };
    const ioToRoomSpy = jest.spyOn(webSocketServer.io, 'to').mockImplementation(() => mockIO);
    const currentFocus = { focus: 0 };
    serverSocket.on('update-player-focus', () => {
      try {
        expect(ioToRoomSpy).toHaveBeenCalledWith(mockGame.gameId);
        expect(mockIO.emit).toBeCalledWith(
          'update-player-focus', serverSocket.id, mockPlayer.id, mockGame.gameId, currentFocus);
        done();
      } catch (e) {
        done(e);
      }
    });
    clientSocket.emit('update-player-focus', mockPlayer.id, mockGame.gameId, currentFocus);
  });

  test('"leave-game" client event removes player from game room', (done) => {
    jest.spyOn(serverSocket, 'leave');
    const mockIO = {
      emit: jest.fn().mockReturnThis(),
    };
    const ioToRoomSpy = jest.spyOn(webSocketServer.io, 'to').mockImplementation(() => mockIO);
    serverSocket.on('leave-game', () => {
      try {
        expect(serverSocket.leave).toHaveBeenCalledWith(mockGame.gameId);
        expect(ioToRoomSpy).toHaveBeenCalledWith(mockGame.gameId);
        expect(mockIO.emit).toBeCalledWith('player-offline', mockPlayer.id, mockGame.gameId);
        expect(dbWorker.updateGameOnlineStatusForPlayer)
          .toHaveBeenCalledWith(mockGame.gameId, mockPlayer.id, false);
        done();
      } catch (e) {
        done(e);
      }
    });
    clientSocket.emit('leave-game', mockPlayer.id, mockGame.gameId);
  });

  test('Server socket sends "receive-changes" event to all clients in game room when receiving'
     + '"send-changes" event from any client', (done) => {
    const mockIO = {
      emit: jest.fn().mockReturnThis(),
    };
    const ioToRoomSpy = jest.spyOn(webSocketServer.io, 'to').mockImplementation(() => mockIO);
    const mockAction = { action: 'this is an action', gameId: mockGame.gameId };
    serverSocket.on('send-changes', () => {
      try {
        expect(ioToRoomSpy).toHaveBeenCalledWith(mockGame.gameId);
        expect(mockIO.emit).toBeCalledWith('receive-changes', mockAction);
        done();
      } catch (e) {
        done(e);
      }
    });
    clientSocket.emit('send-changes', mockAction);
  });

  test('"get-game-by-id" client event triggers __sendGameToClient() with correct args'
     + ' when ownerId === requesting playerId', (done) => {
    jest.spyOn(DbWorker.prototype, 'getGameById').mockImplementation(() => mockGame);
    jest.spyOn(DbWorker.prototype, 'getPlayerById').mockImplementation(() => mockPlayer);
    const sendGameToClientSpy = jest.spyOn(webSocketServer, '__sendGameToClient');
    clientSocket.on('load-game', () => {
      try {
        expect(sendGameToClientSpy).toHaveBeenCalledWith(serverSocket, mockGame, mockPlayer.id);
        done();
      } catch (e) {
        done(e);
      }
    });
    clientSocket.emit('get-game-by-id', mockGame.gameId, mockPlayer.id);
  });

  test('"get-game-by-id" client event triggers __updateTeamGame() and __sendGameToClient()'
     + ' when ownerId != requesting playerId', (done) => {
    jest.spyOn(DbWorker.prototype, 'getGameById').mockImplementation(() => mockGame);
    jest.spyOn(DbWorker.prototype, 'getPlayerById').mockImplementation(() => addedPlayer);
    const sendGameToClientSpy = jest.spyOn(webSocketServer, '__sendGameToClient');
    const updateTeamGameSpy = jest.spyOn(webSocketServer, '__updateTeamGame');
    clientSocket.on('load-game', () => {
      try {
        expect(sendGameToClientSpy).toHaveBeenCalledWith(serverSocket, mockGame, addedPlayer.id);
        expect(updateTeamGameSpy).toHaveBeenCalledWith(serverSocket, mockGame, addedPlayer.id);
        done();
      } catch (e) {
        done(e);
      }
    });
    clientSocket.emit('get-game-by-id', mockGame.gameId, addedPlayer.id);
  });

  test('__updateTeamGame() triggers "load-team-games" and "player-added-to-game" events', async () => {
    jest.spyOn(dbWorker, 'getPlayerById').mockImplementation(() => addedPlayer);
    const expectedGamePlayerObject = {
      playerId: 'xyz987',
      photoURL: 'https://examplephoto2.com',
      displayName: 'Second Pal',
      owner: false,
      color: 'cyan',
      online: true,
    };
    jest.spyOn(dbWorker, 'addPlayerToGame').mockImplementation(() => expectedGamePlayerObject);
    const mockTeamGames = {
      'e27dd721-a9fd-4f95-97ae-b4bfa939e7df': {
        gameId: 'e27dd721-a9fd-4f95-97ae-b4bfa939e7df',
        friend: {
          displayName: 'Best Bud',
          playerId: 'abc123',
        },
        dow: 'Friday',
        date: '9/9/2022',
      },
    };
    jest.spyOn(dbWorker, 'addGameToPlayer').mockImplementation(() => mockTeamGames);
    const serverSocketEmitSpy = jest.spyOn(serverSocket, 'emit').mockImplementation(() => {});
    const mockIO = {
      emit: jest.fn().mockReturnThis(),
    };
    const ioToRoomSpy = jest.spyOn(webSocketServer.io, 'to').mockImplementation(() => mockIO);
    await webSocketServer.__updateTeamGame(serverSocket, mockGame, addedPlayer.id);
    expect(ioToRoomSpy).toHaveBeenCalledWith(mockGame.gameId);
    expect(mockIO.emit).toBeCalledWith('player-added-to-game',
      expectedGamePlayerObject,
      mockGame.gameId);
    expect(serverSocketEmitSpy).toHaveBeenCalledWith('load-team-games', mockTeamGames);
  });

  test('"get-team-games client event triggers load-team-games server event', (done) => {
    jest.spyOn(DbWorker.prototype, 'getPlayerById').mockImplementation(() => playerWithTeamGames);
    clientSocket.on('load-team-games', (arg) => {
      try {
        expect(arg).toStrictEqual(playerWithTeamGames.games.team);
        done();
      } catch (e) {
        done(e);
      }
    });
    clientSocket.emit('get-team-games', playerWithTeamGames.id);
  });

  test('"user-signed-in" client event triggers "auth-error" server event'
     + ' if server cannot verify client token', (done) => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(DbWorker.prototype, 'verifyFirebaseClientToken').mockImplementation(
      () => Promise.reject(new Error('Mock auth error thrown')));
    clientSocket.on('server-auth-error', done);
    clientSocket.emit('user-signed-in', 'mockIDToken');
  });

  test('"user-signed-in" client event triggers "player-exists" server event'
     + ' if player successfully found or created', (done) => {
    jest.spyOn(DbWorker.prototype, 'verifyFirebaseClientToken').mockImplementation(
      () => Promise.resolve({ uid: mockPlayer.id }));
    jest.spyOn(DbWorker.prototype, 'findOrCreatePlayer').mockImplementation(() => mockPlayer);
    clientSocket.on('player-exists', (arg) => {
      try {
        expect(arg).toStrictEqual(mockPlayer.id);
        done();
      } catch (e) {
        done(e);
      }
    });
    clientSocket.emit('user-signed-in', 'mockIdToken');
  });

  test('"verify-player-exists" client events triggers "player-not-found" server event'
     + ' if no player found', (done) => {
    jest.spyOn(DbWorker.prototype, 'getPlayerById').mockImplementation(() => null);
    clientSocket.on('player-not-found', (arg) => {
      try {
        expect(arg).toStrictEqual('missingPlayer');
        done();
      } catch (e) {
        done(e);
      }
    });
    clientSocket.emit('verify-player-exists', 'missingPlayer');
  });

  test('"verify-player-exists" client events triggers "player-exists" server event'
  + ' if player found', (done) => {
    jest.spyOn(DbWorker.prototype, 'getPlayerById').mockImplementation(() => mockPlayer);
    clientSocket.on('player-exists', (arg) => {
      try {
        expect(arg).toStrictEqual(mockPlayer.id);
        done();
      } catch (e) {
        done(e);
      }
    });
    clientSocket.emit('verify-player-exists', mockPlayer.id);
  });

  test('If there are any unexpected errors when server socket is processing client event,'
     + ' console.error will output error', (done) => {
    const mockError = new Error('This is a mock error!');
    jest.spyOn(DbWorker.prototype, 'saveBoard').mockImplementation(() => {
      throw mockError;
    });
    const errorLog = jest.spyOn(console, 'error').mockImplementation(() => {});
    serverSocket.on('save-board', () => {
      try {
        expect(errorLog).toHaveBeenCalledWith(mockError);
        done();
      } catch (e) {
        done(e);
      }
    });
    clientSocket.emit('save-board', mockGame.gameId, { board: true });
  });
});
