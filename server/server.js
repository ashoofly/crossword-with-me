import { getFirebaseConfig } from './firebase-config.js';
import { Server } from "socket.io";
import { weekdays, isCurrentPuzzleSaved, getCurrentDOW, getPreviousDOW, resetGameboard, cleanupOldGames } from "./functions/puzzleUtils.js";
import { v4 as uuidv4 } from 'uuid';
import express from 'express'; 
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import {jwtVerify, createRemoteJWKSet} from 'jose';
import admin from "firebase-admin";


const firebaseAppConfig = getFirebaseConfig();
const app = admin.initializeApp(firebaseAppConfig);
console.log("Initialized Firebase app");
const auth = admin.auth(app);
console.log("Initialized Firebase authentication");
const db = admin.database(app); 
console.log("Initialized Firebase realtime database");

const server = express();
const port = 3002;
server.use(bodyParser.urlencoded({ extended: true }));
server.use(cookieParser());

server.get('/', (req, res) => {
  res.send('Yes?') 
}) 

server.post('/auth', async(req, res) => {
  console.log(req.body);

  checkCSRFToken(req, res); 

  const idToken = req.body.credential;
  const payload = await verifyJWT(idToken);

  // Get redirect url
  const nonce = payload.nonce;
  const decodedNonce = Buffer.from(nonce, 'base64').toString('ascii');
  console.log(decodedNonce);
  const redirectUrlRegex = /(http.+)---(.+)/;
  const [ original, redirectUrl, hash ] = redirectUrlRegex.exec(decodedNonce);

  let returnedUrl = null;
  if (redirectUrl.includes("?gameId=")) {
    returnedUrl = `${redirectUrl}&token=${idToken}`;

  } else {
    returnedUrl = `${redirectUrl}?token=${idToken}`;
  }
  console.log(`Redirecting Google auth token back to front-end`);
  res.redirect(returnedUrl);
})

server.listen(port, () => {
  console.log(`Express server listening on port ${port}`)
}) 


//resetGameboard(db, "Tuesday");
//cleanupOldGames(db);
let dbCollections = {
  players: {},
  games: {},
  puzzles: {}
}

function getDbObjectPromise(collectionType, id, forcePull) {
  let force = forcePull ? true : false;
  return new Promise((resolve, reject) => {
    getDbObjectById(collectionType, id, force, successResponse => {
      resolve(successResponse);
    }, errorResponse => {
      reject(errorResponse);
    });
  });
}

function getDbObjectById(collectionType, id, forcePull, successCallback, errorCallback) {
  let objectCollection = dbCollections[collectionType];
  if (!forcePull) {
    if (objectCollection[id]) {
      successCallback(objectCollection[id]);
    } else {
      addDbListener(collectionType, id, successCallback, errorCallback);
    }
  } else {
    console.log(`Force pulling from db: ${collectionType}/${id}.`);
    const objectRef = db.ref(`${collectionType}/${id}`);

    objectRef.once('value', (snapshot) => {
      if (snapshot.exists()) {
        successCallback(snapshot.val());
      } else {
        successCallback(null);
      }
    }, (error) => {
      console.log(error);
      errorCallback(error);
    }); 
  }
}

function addDbListener(collectionType, id, successCallback, errorCallback) {
  const objectCollection = dbCollections[collectionType];
  const objectRef = db.ref(`${collectionType}/${id}`);
  objectRef.on('value', (snapshot) => {
    if (snapshot.exists()) {
      successCallback(snapshot.val());
      objectCollection[id] = snapshot.val();
    } else {
      successCallback(null);
    }

  }, (error) => {
    console.log(error);
    errorCallback(error);
  }); 
}

function getDbCollectionPromise(collectionType) {
  return new Promise((resolve, reject) => {
    getDbCollection(collectionType, successResponse => {
      resolve(successResponse);
    }, errorResponse => {
      reject(errorResponse);
    });
  });
}

function getDbCollection(collectionType, successCallback, errorCallback) {
  const collectionRef = db.ref(`${collectionType}`);

  collectionRef.on('value', (snapshot) => {
    if (snapshot.exists()) {
      successCallback(snapshot.val());
      dbCollections[collectionType] = snapshot.val();
    } else {
      successCallback(null);
    }
  }, (error) => {
    console.log(error);
    errorCallback(error);
  }); 
}

async function updateGameOnlineStatusForPlayer(gameId, playerId, online) {
  let players = await getGamePlayers(gameId);
  if (players) {
    let index = players.findIndex(player => player.playerId === playerId);
    if (index !== -1) {
      console.log(`Updating ${playerId} status for ${gameId} to ${online ? "online" : "offline"}`)
      const playerRef = db.ref(`games/${gameId}/players/${index}`);
      playerRef.update({
        online: online
      });

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
                color => color !== player.color
              )
            }
            if (board[index].activeLetterColors) {
              board[index].activeLetterColors = board[index].activeLetterColors.filter(
                color => color !== player.color
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

const io = new Server(3001, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

io.of('/').adapter.on("join-room", (room, id) => {
  console.log(`Socket ${id} has joined room ${room}`);
});

io.of("/").adapter.on("leave-room", (room, id) => {
  console.log(`Socket ${id} has left room ${room}`);
});

io.on("connection", async(socket) => {
  socket.on("save-game", async (gameId, board, players) => {
    console.log(`Received save-game event for ${gameId}...`);
    updateGame(gameId, board, players);
  });
  socket.on("get-puzzle-dates", async () => {
    console.log("Received get-puzzle-dates event...")
    const puzzleDates = await getPuzzleDates(); 
    console.log("Sending load-puzzle-dates event");
    socket.emit('load-puzzle-dates', puzzleDates); 
  });
  socket.on("get-game-by-dow", async(dow, playerId) => {
    console.log(`Received get-game-by-dow event from ${playerId} for ${dow} game`);
    const game = await findOrCreateGame(dow, playerId);
    sendGame(game, playerId);
  });
  socket.on("get-default-game", async(playerId) => {
    console.log(`Received get-default-game event from ${playerId}`);
    const game = await getDefaultGame(playerId);
    sendGame(game, playerId);
  });
  socket.on("get-friend-request-name", async(gameId) => {
    console.log(`Received get-friend-request-name with ${gameId}`);
    const game = await getDbObjectPromise("games", gameId);
    if (game) {
      if (game.players) {
        let ownerId = game.players[0].playerId;
        if (ownerId) {
          let ownerInfo = await getDbObjectPromise("players", ownerId);
          if (ownerInfo) { 
            console.log(`Sending display-friend-request event back to client`);
            socket.emit("display-friend-request", ownerInfo.displayName);
          } 
        }
      } else {
        console.log("Sending game-not-found");
        socket.emit("game-not-found");
      }
    } else { 
      console.log("Sending game-not-found");
      socket.emit("game-not-found");
    }
  });
  socket.on('send-player-cursor-change', (playerId, gameId, currentFocus) => {
    console.log(`Sending load-player-cursor-change event to room ${gameId}`);
    io.to(gameId).emit("load-player-cursor-change", socket.id, playerId, gameId, currentFocus);
  });
  socket.on('leave-game', async(playerId, gameId) => {
    console.log(`Received leave-game event from ${playerId} for game ${gameId}`);
    socket.leave(gameId);
    console.log(`Sending player-offline event to room ${gameId}`);
    io.to(gameId).emit('player-offline', playerId, gameId);
    updateGameOnlineStatusForPlayer(gameId, playerId, false); 
  });
  socket.on('send-changes', action => {
    console.log(`Received send-changes event from client ${socket.id} for game ${action.gameId}`);
    console.log(action);
    io.to(action.gameId).emit("receive-changes", action);
  });
  socket.on('get-game-by-id', async (gameId, playerId) => {
    console.log(`Received get-game-by-id request for game ${gameId} from player ${playerId}`);
    const game = await getDbObjectPromise("games", gameId);
    if (game) {
      if (game.players) {
        let ownerId = game.players[0].playerId;
        if (playerId === ownerId) {
          sendGame(game, playerId);

        } else {
          let player = await getDbObjectPromise("players", playerId);
          let teamGames = await addPlayerToGame(player, game);
          console.log("Sending load-team-games event back to client");
          socket.emit("load-team-games", teamGames);
          sendGame(game, playerId);
        }
      } else {
        // anonymous game
        console.log("Sending game-not-found event")
        socket.emit("game-not-found");
      }
    }
  });
  socket.on('get-team-games', async(playerId) => {
    console.log("Received get-team-games event")
    let player = await getDbObjectPromise("players", playerId);
    if (player) {
      let playerGames = player.games;
      if (playerGames) {
        let teamGames = playerGames['team'];
        console.log("Sending load-team-games event")
        socket.emit('load-team-games', teamGames);
      } else {
        console.log(`No team games found for player ${playerId}`);
      }
    } else {
      console.log(`Could not find player ${playerId}`);
    }
  });
  socket.on('user-signed-in', (idToken, gameId) => {
    console.log(`Received user-signed-in event with gameId: ${gameId}`);
    if (gameId) {
      // add user to game if not already added
      addUserToGame(idToken, gameId, io);

    } else {
      // add player to db if not already added
      addPlayerToDB(idToken);
    }
  });

  async function sendGame(game, playerId) {
    let player = await getDbObjectPromise("players", playerId);
    let gameId = game.gameId;
    console.log("Sending game " + gameId);
    socket.emit("load-game", game, socket.id);

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
      console.log(`Send disconnect event to room ${gameId}`);
      io.to(gameId).emit("player-offline", playerId, gameId);
      updateGameOnlineStatusForPlayer(gameId, playerId, false);
    });
  }

  async function addPlayerToGame(player, game) {
    //update game object
    let players = game.players;
    let gameId = game.gameId;
    if (players.find(p => p.playerId === player.id)) {
      console.log(`Player ${player.id} already part of game ${gameId}.`);
  
    } else {
      let numCurrentPlayers = players.length;
      let addedPlayer = {
        playerId: player.id,
        photoURL: player.photoURL,
        displayName: player.displayName,
        owner: false,
        color: defaultPlayerColors[numCurrentPlayers]
      };
      players.push(addedPlayer);
      console.log('Sending player-added-to-game to game room');
      io.to(game.gameId).emit('player-added-to-game', addedPlayer, game.gameId);
      const gameRef = db.ref(`games/${gameId}`);
      gameRef.update({
        players: players
      }); 
    }
  
    // update player object
    let gameOwner = players[0].playerId;
    if (gameOwner !== player.id) {
      let playerGames = player.games;
      if (!playerGames) {
        playerGames = {owner: {}, team: {}};
      } 
      let teamGames = playerGames['team'];
      if (!teamGames) { 
        teamGames = {};
      }
      if (!teamGames[gameId]) {
        // get game owner for front-end to display
        let ownerId = game.players[0].playerId;
        let owner = await getDbObjectPromise("players", ownerId);
    
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
    
        console.log(`Adding game ${gameId} to team game list for ${player.id}.`);
        const playerRef = db.ref(`players/${player.id}`);
        playerRef.update({
          games: playerGames
        });
      }
    }
    return await getPlayerTeamGames(player.id);
  }

  console.log(`Connected to ${socket.id}`);
  const sockets = await io.fetchSockets();
  console.log(`Connected sockets: ${sockets.map(socket => socket.id).join(', ')}`);

  socket.on("disconnect", async(reason) => {
    console.log(`Disconnected from ${socket.id}: ${reason}`)
    const sockets = await io.fetchSockets();
    console.log(`Connected sockets: ${sockets.map(socket => socket.id).join(', ')}`);
  });
});

function checkCSRFToken(req, res) {
  let csrfCookie = req.cookies['g_csrf_token'];
  if (!csrfCookie) {
    res.status(400).send('No CSRF token in Cookie.');
  }
  let csrfBody = req.body['g_csrf_token'];
  if (!csrfBody) {
    res.status(400).send('No CSRF token in post body.'); 
  }
  if (csrfCookie !== csrfBody) {
    res.status(400).send('Failed to verify double submit cookie.');
  }
}

async function verifyJWT(idToken) {
  const JWKS = createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'));

  const { payload } = await jwtVerify(idToken, JWKS, {
    issuer: 'https://accounts.google.com',
    audience: firebaseAppConfig.googleClientId,
  });
  
  return payload;
}


async function verifyFirebaseClientToken(idToken) {
  console.log('Verifying Firebase client token...');
  try {
    let decodedToken = await auth.verifyIdToken(idToken);
    console.log(decodedToken);
    const uid = decodedToken.uid;

    let user = await auth.getUser(uid);
    console.log(user);
    return user;
    
  } catch(error) {
    console.log(error);
  };
}

const defaultPlayerColors = [
  "blue",
  "magenta",
  "violet",
  "green",
  "red",
  "cyan", 
  "orange",
  "yellow"
];


async function addUserToGame(firebaseClientToken, gameId) {
  let user = await verifyFirebaseClientToken(firebaseClientToken);
  let player = await findOrCreatePlayer(user);
  let game = await getDbObjectPromise("games", gameId);
  addPlayerToGame(player, game);
}


async function addPlayerToDB(firebaseClientToken) {
  let user = await verifyFirebaseClientToken(firebaseClientToken);
  findOrCreatePlayer(user);
}


async function createNewPlayer(user) {
  console.log(user);
  if (!user) return;
  let playerId = user.uid;
  const playerRef = db.ref(`players/${playerId}`);
  playerRef.set({
    id: playerId,
    displayName: user.displayName,
    email: user.email,
    photoURL: user.photoURL
  });
  return await getDbObjectPromise("players", playerId, true);
}

async function createNewGame(dow, playerId) {
  let gameId = uuidv4();
  let puzzle = await getDbObjectPromise("puzzles", dow);
  let player = await getDbObjectPromise("players", playerId);
  console.log(`Creating game ${gameId} for ${playerId} with ${dow} puzzle...`)
  let numSquares = puzzle.size.rows * puzzle.size.cols;
  const gameRef = db.ref(`games/${gameId}`);
  gameRef.set({
    gameId: gameId,
    savedToDB: true,
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
  return await getDbObjectPromise("games", gameId, true);
}


async function getDefaultGame(playerId) {
  console.log("Getting default game...");
  try {
    let player = await getDbObjectPromise("players", playerId);
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
    console.log(error);
  }

}

async function getPuzzleDates() {
  let puzzles = await getDbCollectionPromise("puzzles");
  if (puzzles) {
    let dates = {};
    for (const dow in puzzles) {
      dates[dow] = puzzles[dow].date;
    }
    return dates;

  } else {
    console.log("Nothing at path puzzles/");
    return null;
  }
}

async function getGamePlayers(gameId) {
  let game = await getDbObjectPromise("games", gameId);
  if (game.players) {
    return game.players;
  } else {
    return null;
  }
} 

async function getPlayerTeamGames(playerId) {
  let player = await getDbObjectPromise("players", playerId);
  if (player.games && player.games.team) {
    return player.games.team;
  } else {
    return null;
  }
} 

async function getGameById(gameId) {
  return await getDbObjectPromise("games", gameId);
}

async function getGameIfCurrent(gameId, dow) {
  let currentPuzzle = await getDbObjectPromise("puzzles", dow);
  let game = await getDbObjectPromise("games", gameId);
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

  console.log(`Adding game ${newGame.gameId} to owner game list for ${playerId}.`);
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
    let player = await getDbObjectPromise("players", playerId);
    if (player) {
      let playerGames = player.games;
      if (playerGames && playerGames['owner'] && playerGames['owner'][dow]) {
        let gameId = playerGames['owner'][dow];
        let currentGame = await getGameIfCurrent(gameId, dow);
        if (currentGame) {
          return currentGame; 
        } else {
          console.log(`Game ${gameId} is not current. Creating new game for player ${playerId}.`)
          return await createGameAndUpdatePlayer(player, dow);
        }
      } else {
        return await createGameAndUpdatePlayer(player, dow);
      }
    } else {
      console.log("Cannot find player in database");
      return null;
    }

  } else {
    console.log("No playerId given. Will not create game.");
  }
} 

async function findOrCreatePlayer(user) {
  if (user === null) return;
  const player = await getDbObjectPromise("players", user.uid);
  if (player) {
    console.log("Found player!");
    // await updatePhotoIfNeeded(user, player);
    return player;
  } else {
    console.log("Could not find player, creating new one");
    return await createNewPlayer(user);
  }
}

async function updateGame(gameId, board, players) {
  const gameRef = db.ref(`games/${gameId}`);
  gameRef.update({
    board: board,
    players: players
  });
}


