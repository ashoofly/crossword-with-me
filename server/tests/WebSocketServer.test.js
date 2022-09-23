/* eslint-disable no-underscore-dangle */
/* eslint-disable no-undef */
/* eslint-disable one-var-declaration-per-line */
/* eslint-disable one-var */
const { createServer } = require('http');
const Client = require('socket.io-client');
const DbWorker = require('../components/DbWorker');
const WebSocketServer = require('../components/WebSocketServer');
const mockPuzzleDates = require('./mocks/mockPuzzleDates');
const mockGame = require('./mocks/mockGame');
const { newPlayer: mockPlayer } = require('./mocks/mockPlayer');

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
      + ' back to client if no game found in db', () => {

  });

  test('"get-friend-request-name" event to server will return "display-friend-request" event'
      + ' back to client if game found in db', () => {

  });


  


  test('If any errors, debug will run', () => {

  });
});
