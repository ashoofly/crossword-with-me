/* eslint-disable no-underscore-dangle */
import { Server } from 'socket.io';
import PuzzleUtils from './functions/utils/PuzzleUtils';
import { v4 as uuidv4 } from 'uuid';
import admin from 'firebase-admin';
import dotenv from 'dotenv';
import Debug from 'debug';
import HttpServer from './httpServer';

const debug = Debug('Server');

if (process.env.NODE_ENV === 'development') {
  dotenv.config({ path: '../.env.local' });
} else if (process.env.NODE_ENV === 'heroku-local') {
  dotenv.config({ path: '../.env.heroku-local' });
}
const firebaseServerConfig = JSON.parse(process.env.FIREBASE_SERVER_CONFIG);
const serviceAccount = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS);

const firebaseAppConfig = {
  ...firebaseServerConfig,
  credential: admin.credential.cert(serviceAccount),
};

const firebaseApp = admin.initializeApp(firebaseAppConfig);
debug('Initialized Firebase app');
const auth = admin.auth(firebaseApp);
debug('Initialized Firebase authentication');
const db = admin.database(firebaseApp);
debug('Initialized Firebase realtime database');

const httpServer = new HttpServer();

const io = new Server(
  httpServer,
  process.env.NODE_ENV === 'development'
    ? {
      cors: {
        origin: process.env.REACT_APP_DEV_CLIENT_SERVER,
        methods: ['GET', 'POST'],
      },
    } : {},
);

const port = process.env.NODE_ENV === 'development'
  ? process.env.REACT_APP_DEV_SERVER_PORT : process.env.PORT;

httpServer.listen(port);
debug(`Http server created on port ${port}`);

const cache = {
  players: {},
  games: {},
  puzzles: {},
};

function getDbObjectPromise(collectionType, id, forcePull) {
  return new Promise((resolve, reject) => {
    getDbObjectById(collectionType, id, forcePull, (successResponse) => {
      resolve(successResponse);
    }, (errorResponse) => {
      reject(errorResponse);
    });
  });
}

function getDbObjectById(collectionType, id, forcePull, successCallback, errorCallback) {
  if (!forcePull) {
    if (cache[collectionType][id]) {
      successCallback(cache[collectionType][id]);
    } else {
      addDbListener(collectionType, id, successCallback, errorCallback);
    }
  } else {
    debug(`Force pulling from db: ${collectionType}/${id}.`);
    const objectRef = db.ref(`${collectionType}/${id}`);

    objectRef.once('value', (snapshot) => {
      if (snapshot.exists()) {
        successCallback(snapshot.val());
      } else {
        successCallback(null);
      }
    }, (error) => {
      debug(error);
      errorCallback(error);
    }); 
  }
}

function addDbListener(collectionType, id, successCallback, errorCallback) {
  const objectCollection = cache[collectionType];
  const objectRef = db.ref(`${collectionType}/${id}`);
  objectRef.on('value', (snapshot) => {
    if (snapshot.exists()) {
      successCallback(snapshot.val());
      objectCollection[id] = snapshot.val();
    } else {
      successCallback(null);
    }
  }, (error) => {
    debug(error);
    errorCallback(error);
  });
}

function getDbCollectionPromise(collectionType) {
  return new Promise((resolve, reject) => {
    getDbCollection(collectionType, (successResponse) => {
      resolve(successResponse);
    }, (errorResponse) => {
      reject(errorResponse);
    });
  });
}

function getDbCollection(collectionType, successCallback, errorCallback) {
  const collectionRef = db.ref(`${collectionType}`);

  collectionRef.once('value', (snapshot) => {
    if (snapshot.exists()) {
      successCallback(snapshot.val());
      cache[collectionType] = snapshot.val();
    } else {
      successCallback(null);
    }
  }, (error) => {
    debug(error);
    errorCallback(error);
  }); 
}

async function updatePlayerFocus(playerId, gameId, currentFocus) {
  const players = await getGamePlayers(gameId);
  if (players) {
    const index = players.findIndex((player) => player.playerId === playerId);
    const playerRef = db.ref(`games/${gameId}/players/${index}`);
    playerRef.update({
      currentFocus: currentFocus
    });
  }

}

async function updateGameOnlineStatusForPlayer(gameId, playerId, online) {
  let players = await getGamePlayers(gameId);
  if (players) {
    let index = players.findIndex((player) => player.playerId === playerId);
    if (index !== -1) {
      debug(`Updating ${playerId} status for ${gameId} to ${online ? 'online' : 'offline'}`)
      const playerRef = db.ref(`games/${gameId}/players/${index}`);
      playerRef.update({
        online: online
      }); 
      const game = await getDbObjectPromise('games', gameId, false);

      if (!online) {
        // remove cursor from board
        const player = players[index];
        const playerFocus = player.currentFocus;
        if (playerFocus) {
          const game = await getGameById(gameId);
          const board = game.board;
          for (const index of playerFocus.word) {
            if (board[index].activeWordColors) {
              board[index].activeWordColors = board[index].activeWordColors.filter(
                (color) => color !== player.color
              )
            }
            if (board[index].activeLetterColors) {
              board[index].activeLetterColors = board[index].activeLetterColors.filter(
                (color) => color !== player.color
              )
            }
          }
          const gameRef = db.ref(`games/${gameId}`);
          gameRef.update({
            board: board
          });
        }
      }

    }
  } 
}

  


io.of('/').adapter.on('join-room', (room, id) => {
  debug(`Socket ${id} has joined room ${room}`);
});

io.of('/').adapter.on('leave-room', (room, id) => {
  debug(`Socket ${id} has left room ${room}`);
});

io.on('connection', async(socket) => {
  socket.on('save-board', async (gameId, board, players) => {
    debug(`Received save-board event for ${gameId}...`);
    updateGame(gameId, board);
  });
  socket.on('get-puzzle-dates', async () => {
    debug('Received get-puzzle-dates event...')
    const puzzleDates = await getPuzzleDates(); 
    debug('Sending load-puzzle-dates event');
    socket.emit('load-puzzle-dates', puzzleDates); 
  });
  socket.on('get-game-by-dow', async(dow, playerId) => {
    debug(`Received get-game-by-dow event from ${playerId} for ${dow} game`);
    const game = await findOrCreateGame(dow, playerId);
    sendGame(game, playerId);
  });
  socket.on('get-default-game', async(playerId) => {
    debug(`Received get-default-game event from ${playerId}`);
    const game = await getDefaultGame(playerId);
    sendGame(game, playerId);
  });
  socket.on('get-friend-request-name', async(gameId) => {
    debug(`Received get-friend-request-name with ${gameId}`);
    const game = await getDbObjectPromise('games', gameId);
    if (game) {
      if (game.players) {
        let ownerId = game.players[0].playerId;
        if (ownerId) {
          let ownerInfo = await getDbObjectPromise('players', ownerId);
          if (ownerInfo) { 
            debug('Sending display-friend-request event back to client');
            socket.emit('display-friend-request', ownerInfo.displayName);
          } 
        }
      } else {
        debug('Sending game-not-found');
        socket.emit('game-not-found');
      }
    } else { 
      debug('Sending game-not-found');
      socket.emit('game-not-found');
    }
  });
  socket.on('send-player-cursor-change', (playerId, gameId, currentFocus) => {
    debug(`Sending load-player-cursor-change event to room ${gameId}`);
    io.to(gameId).emit('load-player-cursor-change', socket.id, playerId, gameId, currentFocus);
    updatePlayerFocus(playerId, gameId, currentFocus);
  });
  socket.on('leave-game', async(playerId, gameId) => {
    debug(`Received leave-game event from ${playerId} for game ${gameId}`);
    socket.leave(gameId);
    debug(`Sending player-offline event to room ${gameId}`);
    io.to(gameId).emit('player-offline', playerId, gameId);
    updateGameOnlineStatusForPlayer(gameId, playerId, false); 
  });
  socket.on('send-changes', (action) => {
    debug(`Received send-changes event from client ${socket.id} for game ${action.gameId}`);
    debug(action);
    io.to(action.gameId).emit('receive-changes', action);
  });
  socket.on('get-game-by-id', async (gameId, playerId) => {
    debug(`Received get-game-by-id request for game ${gameId} from player ${playerId}`);
    const game = await getDbObjectPromise('games', gameId);
    if (game) {
      if (game.players) {
        let ownerId = game.players[0].playerId;
        if (playerId === ownerId) {
          sendGame(game, playerId);

        } else {
          let player = await getDbObjectPromise('players', playerId);
          if (player) {
            let teamGames = await addPlayerToGame(player, game, io);
            debug('Sending load-team-games event back to client');
            socket.emit('load-team-games', teamGames);
            sendGame(game, playerId);
          } else {
            debug('Could not find player in player list.');
          }

        }
      } else {
        // anonymous game
        debug('Sending game-not-found event')
        socket.emit('game-not-found');
      }
    }
  });
  socket.on('get-team-games', async(playerId) => {
    debug('Received get-team-games event')
    let player = await getDbObjectPromise('players', playerId);
    if (player) {
      let playerGames = player.games;
      if (playerGames) {
        let teamGames = playerGames['team'];
        debug('Sending load-team-games event')
        socket.emit('load-team-games', teamGames);
      } else {
        debug(`No team games found for player ${playerId}`);
      }
    } else {
      debug(`Could not find player ${playerId}`);
    }
  });
  socket.on('user-signed-in', async(idToken, gameId) => {
    debug('Received user-signed-in event');
    let player = null;
    if (gameId) {
      // add user to game if not already added
      debug(`Adding user to ${gameId} if not already added`);
      player = await addUserToGame(idToken, gameId, io);

    } else {
      // add player to db if not already added
      debug('Adding player to db if not already added');
      player = await addPlayerToDB(idToken);
    }
    if (player) {
      debug(`Send player-exists event for ${player.id}`);
      socket.emit('player-exists', player.id);
    }
  }); 

  socket.on('verify-player-exists', async(playerId) => {
    debug(`Received verify-player-exists event for ${playerId}`);
    const player = await getDbObjectPromise('players', playerId);
    if (player) {
      debug(`Send player-exists event for ${playerId}`);
      socket.emit('player-exists', playerId);
    } else {
      debug(`Send player-not-found event for ${playerId}`);
      socket.emit('player-not-found', playerId);
    }
  });

  async function sendGame(game, playerId) {
    let player = await getDbObjectPromise('players', playerId);

    if (player) {
      let gameId = game.gameId;
      debug('Sending game ' + gameId);
      socket.emit('load-game', game, socket.id);
  
      // leave any previous game rooms
      let currentRooms = Array.from(socket.rooms);
      if (currentRooms.length > 1) {
        let prevGameId = currentRooms[1];
        socket.leave(prevGameId);
        io.to(prevGameId).emit('player-offline', playerId, prevGameId);
        updateGameOnlineStatusForPlayer(prevGameId, playerId, false);
      }
  
      // join current game room
      socket.join(gameId);
      io.to(gameId).emit('player-online', playerId, player.displayName, gameId);
      updateGameOnlineStatusForPlayer(gameId, playerId, true);
  
      // add listeners
      socket.on('disconnect', () => {
        debug(`Send disconnect event to room ${gameId}`);
        io.to(gameId).emit('player-offline', playerId, gameId);
        updateGameOnlineStatusForPlayer(gameId, playerId, false);
      });
    } else {
      debug(`Could not find player ${playerId} in the database`);
    }

  }

  debug(`Connected to ${socket.id}`);
  const sockets = await io.fetchSockets();
  debug(`Connected sockets: ${sockets.map((socket) => socket.id).join(', ')}`);

  socket.on('disconnect', async(reason) => {
    debug(`Disconnected from ${socket.id}: ${reason}`)
    const sockets = await io.fetchSockets();
    debug(`Connected sockets: ${sockets.map((socket) => socket.id).join(', ')}`);
  });
});

async function verifyFirebaseClientToken(idToken) {
  debug('Verifying Firebase client token...');
  try {
    let decodedToken = await auth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    let user = await auth.getUser(uid);
    return user;
    
  } catch(error) {
    debug(error);
    return null;
  };
}

const defaultPlayerColors = [
  'blue',
  'magenta',
  'violet',
  'green',
  'red',
  'cyan', 
  'orange',
  'yellow'
];


async function addPlayerToGame(player, game, io) {
  //update game object
  let players = game.players;
  let gameId = game.gameId;
  if (players.find((p) => p.playerId === player.id)) {
    debug(`Player ${player.id} already part of game ${gameId}.`);

  } else {
    let numCurrentPlayers = players.length;
    let addedPlayer = {
      playerId: player.id,
      photoURL: player.photoURL,
      displayName: player.displayName,
      owner: false,
      color: defaultPlayerColors[numCurrentPlayers],
      online: true
    };
    players.push(addedPlayer);
    const gameRef = db.ref(`games/${gameId}`);
    await gameRef.update({
      players: players
    }); 
    debug('Sending player-added-to-game to game room');
    io.to(game.gameId).emit('player-added-to-game', addedPlayer, game.gameId);
  }

  // update player object
  let gameOwner = players[0].playerId;
  if (gameOwner !== player.id) {
    let playerGames = player.games;
    if (!playerGames) {
      playerGames = { owner: {}, team: {} };
    } 
    let teamGames = playerGames['team'];
    if (!teamGames) { 
      teamGames = {};
    }
    if (!teamGames[gameId]) {
      // get game owner for front-end to display
      let ownerId = game.players[0].playerId;
      let owner = await getDbObjectPromise('players', ownerId);
  
      teamGames[gameId] = {
        gameId: gameId,
        friend: {
          displayName: owner.displayName,
          playerId: owner.id
        },
        dow: game.dow,
        date: game.date
      };
  
      playerGames.team = teamGames;
  
      debug(`Adding game ${gameId} to team game list for ${player.id}.`);
      const playerRef = db.ref(`players/${player.id}`);
      playerRef.update({
        games: playerGames
      });
    }
  }
  return await getPlayerTeamGames(player.id);
}

async function addUserToGame(firebaseClientToken, gameId, io) {
  try {
    let user = await verifyFirebaseClientToken(firebaseClientToken);
    let player = await findOrCreatePlayer(user);
    let game = await getDbObjectPromise('games', gameId);
    addPlayerToGame(player, game, io);
    return player;

  } catch (error) {
    debug(error);
    return null;
  }
}


async function addPlayerToDB(firebaseClientToken) {
  let user = await verifyFirebaseClientToken(firebaseClientToken);
  try {
    return await findOrCreatePlayer(user);
  } catch (error) {
    debug(error);
    return null;
  }
}


async function createNewPlayer(user) {
  if (!user) return;
  let playerId = user.uid;
  const playerRef = db.ref(`players/${playerId}`);
  playerRef.set({
    id: playerId,
    displayName: user.displayName,
    email: user.email,
    photoURL: user.photoURL
  });
  return await getDbObjectPromise('players', playerId, true);
}

async function createNewGame(dow, playerId) {
  let gameId = uuidv4();
  let puzzle = await getDbObjectPromise('puzzles', dow);
  let player = await getDbObjectPromise('players', playerId);
  debug(`Creating game ${gameId} for ${playerId} with ${dow} puzzle...`)
  let numSquares = puzzle.size.rows * puzzle.size.cols;
  const gameRef = db.ref(`games/${gameId}`);
  gameRef.set({
    gameId: gameId,
    savedBoardToDB: true,
    autocheck: false,
    advanceCursor: 0,
    players: [{
      playerId: player.id,
      photoURL: player.photoURL,
      displayName: player.displayName,
      owner: true,
      color: defaultPlayerColors[0]
    }],
    board: [...Array(numSquares).keys()].map( (num) => ({
      initial: true,
      index: num,
      input: '',
      reveal: false,
      check: false,
      verified: false,
      incorrect: false,
      partial: false,
      penciled: false,
      activeWordColors: [],
      activeLetterColors: [] 
    })),
    clueDictionary: puzzle.clueDictionary,
    gameGrid: puzzle.gameGrid,
    copyright: puzzle.copyright,
    date: puzzle.date,
    dow: puzzle.dow,
    editor: puzzle.editor,
    author: puzzle.author,
    hasTitle: puzzle.hastitle,
    title: puzzle.title,
    numRows: puzzle.size.rows,
    numCols: puzzle.size.cols
  });
  return await getDbObjectPromise('games', gameId, true);
}


async function getDefaultGame(playerId) {
  debug('Getting default game...');
  try {
    let player = await getDbObjectPromise('players', playerId);
    if (player) {
      let dow;
      if (await isCurrentPuzzleSaved(db)) {
        dow = getCurrentDOW();
      } else {
        dow = getPreviousDOW();
      }
      return await findOrCreateGame(dow, playerId);
    }
  } catch (error) {
    debug(error);
  }

}

async function getPuzzleDates() {
  let puzzles = await getDbCollectionPromise('puzzles');
  if (puzzles) {
    let dates = {};
    for (const dow in puzzles) {
      dates[dow] = puzzles[dow].date;
    }
    return dates;

  } else {
    debug('Nothing at path puzzles/');
    return null;
  }
}

async function getGamePlayers(gameId) {
  let game = await getDbObjectPromise('games', gameId);
  if (game.players) {
    return game.players;
  } else {
    return null;
  }
} 

async function getPlayerTeamGames(playerId) {
  let player = await getDbObjectPromise('players', playerId);
  if (player.games && player.games.team) {
    return player.games.team;
  } else {
    return null;
  }
} 

async function getGameById(gameId) {
  return await getDbObjectPromise('games', gameId);
}

async function getGameIfCurrent(gameId, dow) {
  let currentPuzzle = await getDbObjectPromise('puzzles', dow);
  let game = await getDbObjectPromise('games', gameId);
  if (game) {
    if (game.date === currentPuzzle.date) {
      return game;
    }
  }
  return null;
}

async function createGameAndUpdatePlayer(player, dow) {
  let playerId = player.id;

  // create new game 
  let newGame = await createNewGame(dow, playerId);

  // update player object
  let playerGames = player.games;
  if (!playerGames) {
    playerGames = {};
  }
  let ownerGames = playerGames.owner;
  if (!ownerGames) {
    ownerGames = {}
  }
  ownerGames[dow] = newGame.gameId;
  playerGames.owner = ownerGames;

  debug(`Adding game ${newGame.gameId} to owner game list for ${playerId}.`);
  const playerRef = db.ref(`players/${playerId}`);
  playerRef.update({
    games: playerGames
  });
  return newGame;
}

/**
 * Use case: loading game from dropdown menu with days of the week
 */
async function findOrCreateGame(dow, playerId) {
  if (playerId) {
    // find player game
    let player = await getDbObjectPromise('players', playerId);
    if (player) {
      let playerGames = player.games;
      if (playerGames && playerGames['owner'] && playerGames['owner'][dow]) {
        let gameId = playerGames['owner'][dow];
        let currentGame = await getGameIfCurrent(gameId, dow);
        if (currentGame) {
          return currentGame; 
        } else {
          debug(`Game ${gameId} is not current. Creating new game for player ${playerId}.`)
          return await createGameAndUpdatePlayer(player, dow);
        }
      } else {
        return await createGameAndUpdatePlayer(player, dow);
      }
    } else {
      debug('Cannot find player in database');
      return null;
    }

  } else {
    debug('No playerId given. Will not create game.');
  }
} 

async function findOrCreatePlayer(user) {
  if (user === null) return;
  const player = await getDbObjectPromise('players', user.uid);
  if (player) {
    debug('Found player!');
    // await updatePhotoIfNeeded(user, player);
    return player;
  } else {
    debug('Could not find player, creating new one');
    return await createNewPlayer(user);
  }
}

async function updateGame(gameId, board) {
  const gameRef = db.ref(`games/${gameId}`);
  gameRef.update({
    board: board
  });
}


