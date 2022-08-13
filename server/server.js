import { getFirebaseConfig } from '../firebase-config.js';
import { getDatabase, ref, set, get, update } from "firebase/database";
import { initializeApp } from "firebase/app";
import { Server } from "socket.io";
import { weekdays, isCurrentPuzzleSaved, getCurrentDOW, getPreviousDOW } from "./functions/puzzleUtils.js";
import { v4 as uuidv4 } from 'uuid';
import express from 'express'; 
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import {jwtVerify, createRemoteJWKSet} from 'jose';
import { getAuth, signInWithCredential } from "firebase/auth";
import { GoogleAuthProvider } from "firebase/auth";
import axios from "axios";
import url from "url";

const firebaseAppConfig = getFirebaseConfig();
const app = initializeApp(firebaseAppConfig);
console.log("Initialized Firebase app");
const db = getDatabase(app); 
console.log("Initialized Firebase realtime database");
const auth = getAuth(app);
console.log("Initialized Firebase authentication");

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

  socket.on("save-board", async (gameId, board) => {
    console.log("Received save-board event...");
    updateGameBoard(gameId, board);
  });
  // socket.on("get-player", async(user) => {

  //   const player = await findOrCreatePlayer(user); 
  //   socket.join(player.id);
  //   io.to(player.id).emit('load-player', player);
  // });
  socket.on("get-puzzle-dates", async () => {
    console.log("Received get-puzzle-dates event...")
    const puzzleDates = await getPuzzleDates(); 
    socket.emit('load-puzzle-dates', puzzleDates); 
  });
  socket.on("get-game-by-dow", async(dow, playerId) => {
    console.log("Received get-game-by-dow event")
    console.log(`Getting ${dow} game for player ${playerId}`);
    const game = await findOrCreateGame(dow, playerId);
    sendGame(game, playerId, "get-game-by-dow");
  });
  socket.on("get-default-game", async(playerId) => {
    console.log("Received get-default-game event");
    const game = await getDefaultGame(playerId);
    sendGame(game, playerId, "get-default-game");
  });

  socket.on("get-friend-request-name", async(gameId) => {
    console.log(`Received get-friend-request-name with ${gameId}`);
    const game = await getGameById(gameId);
    if (game) {
      if (game.players) {
        let ownerId = game.players[0].playerId;
        if (ownerId) {
          let ownerInfo = await getPlayer(ownerId);
          if (ownerInfo) { 
            console.log(`Sending display-friend-request event back to client`);
            socket.emit("display-friend-request", ownerInfo.displayName);
          } 
        }
      } else {
        socket.emit("game-not-found");
      }
    } else { 
      socket.emit("game-not-found");
    }
  });

  async function updateGameOnlineStatusForPlayer(socketId, gameId, playerId, online) {
    let index = 0;
    await update(ref(db, `games/${gameId}/players/${index}`), {
      online: online
    });
    if (online) {
    }
  }

  function sendGame(game, playerId, source) {
    
    game['source'] = source;
    let gameId = game.gameId;
    console.log("Sending game " + gameId);
    socket.emit("load-game", game, socket.id);
    console.log(`Socket ${socket.id} is currently in these rooms`);
    let currentRooms = Array.from(socket.rooms);
    console.log(currentRooms);
    if (currentRooms.length > 1) {
      let prevGameId = currentRooms[1];
      console.log(`Leaving room ${currentRooms[1]}`)
      socket.leave(prevGameId);
      io.to(prevGameId).emit('player-offline', playerId, prevGameId);
    }
    socket.join(gameId);
    io.to(gameId).emit('player-online', playerId, gameId);

    console.log(`Socket ${socket.id} is currently in these rooms`);
    console.log(socket.rooms);
    socket.on('send-changes', squareState => {
      io.to(gameId).emit("receive-changes", squareState);
    });
    socket.on('disconnect', () => {
      // markPlayerOffline(playerId);
      console.log(`Send disconnect event to room ${gameId}`);
      io.to(gameId).emit("player-offline", playerId);
    });
  }

  socket.on('get-game-by-id', async (gameId, playerId) => {
    console.log(`Received get-game-by-id request with ${gameId} and ${playerId}`);
    const game = await getGameById(gameId);
    if (game) {
      if (game.players) {
        let ownerId = game.players[0].playerId;
        if (playerId === ownerId) {
          sendGame(game, playerId, "get-game-by-id");

        } else {
          let player = await getPlayer(playerId);
          addPlayerToGame(player, game);
          sendGame(game, playerId, "get-game-by-id");
        }
      } else {
        // anonymous game
        socket.emit("game-not-found");
      }
    }
  });

  socket.on('get-team-games', async(playerId) => {
    console.log("Received get-team-games event")
    let player = await getPlayer(playerId);
    let playerGames = player.games;
    if (playerGames) {
      let teamGames = playerGames['team'];
      socket.emit('load-team-games', teamGames);
    } else {
      console.log(`No team games found for player ${playerId}`);
    }
  });

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


async function authenticateUser(token) {
  // Build Firebase credential with the Google ID token.
  const credential = GoogleAuthProvider.credential(token);

  // Sign in with credential from the Google user.
  try { 
    let result = await signInWithCredential(auth, credential);
    return result.user;

  } catch(error) {
    console.log(error);
  }
}

async function addPlayerToGame(player, game) {
  //update game object
  let players = game.players;
  let gameId = game.gameId;
  if (players.find(p => p.playerId === player.id)) {
    console.log(`Player ${player.id} already part of game ${gameId}.`);

  } else {
    players.push({
      playerId: player.id,
      photoURL: player.photoURL,
      displayName: player.displayName,
      owner: false
    });
    await update(ref(db, 'games/' + gameId), {
      players: players
    }); 
  }

  // update player object
  let playerGames = player.games;
  if (!playerGames) {
    playerGames = {}
  }
  let teamGames = player.games['team'];
  if (!teamGames) { 
    teamGames = [];
  }
  if (!teamGames.find(game => game.gameId === gameId)) {
    // get game owner for front-end to display
    let ownerId = game.players[0].playerId;
    let owner = await getPlayer(ownerId);

    teamGames.push({
      gameId: gameId,
      friend: {
        displayName: owner.displayName,
        playerId: owner.id
      },
      dow: game.dow,
      date: game.date
    });

    playerGames.team = teamGames;

    console.log(`Adding game ${gameId} to team game list for ${player.id}.`);
    await update(ref(db, 'players/' + player.id), {
      games: playerGames
    });
  }
}

async function addUserToGame(jwt, gameId) {
  let user = await authenticateUser(jwt);
  let player = await findOrCreatePlayer(user);
  let game = await getGameById(gameId);
  addPlayerToGame(player, game);
}

const provider = new GoogleAuthProvider();
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
  const redirectUrlRegex = /(http.+)---(.+)/;
  const [ original, redirectUrl, hash ] = redirectUrlRegex.exec(decodedNonce);

  let returnedUrl = null;
  if (redirectUrl.includes("?gameId=")) {
    returnedUrl = `${redirectUrl}&token=${idToken}`;

    // get gameId
    const queryObj = url.parse(redirectUrl, true).query;
    const gameId = queryObj['gameId'];

    // add user to game if not already added
    addUserToGame(idToken, gameId);

  } else {
    returnedUrl = `${redirectUrl}?token=${idToken}`;

    // add player to db if not already added
    addPlayerToDB(idToken);
  }

  console.log(`Got auth token, redirecting back to front-end`);
  res.redirect(returnedUrl);
})

server.listen(port, () => {
  console.log(`Express server listening on port ${port}`)
}) 

async function addPlayerToDB(jwt) {
  let user = await authenticateUser(jwt);
  findOrCreatePlayer(user);
}


async function createNewPlayer(user) {
  console.log(user);
  if (!user) return;
  let playerId = user.uid;
  await set(ref(db, 'players/' + playerId), {
    id: playerId,
    displayName: user.displayName,
    email: user.email,
    photoURL: user.photoURL
  });
  return (await get(ref(db, 'players/' + playerId))).val();
}

async function createNewGame(dow, playerId) {
  let gameId = uuidv4();
  let puzzle = await getPuzzle(dow);
  let player = await getPlayer(playerId);
  console.log(`Creating game ${gameId} for ${playerId} with ${dow} puzzle...`)
  let numSquares = puzzle.size.rows * puzzle.size.cols;
  await set(ref(db, 'games/' + gameId), {
    gameId: gameId,
    savedToDB: true,
    autocheck: false,
    advanceCursor: 0,
    players: [{
      playerId: player.id,
      photoURL: player.photoURL,
      displayName: player.displayName,
      owner: true
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
      penciled: false
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
  return (await get(ref(db, 'games/' + gameId))).val();
}


async function getDefaultGame(playerId) {
  let dow;
  if (isCurrentPuzzleSaved(db)) {
    dow = getCurrentDOW();
  } else {
    dow = getPreviousDOW();
  }
  return await findOrCreateGame(dow, playerId);
}

async function getPuzzle(dow) {
  console.log(`Loading puzzle for ${dow}...`);
  const snapshot = await get(ref(db, 'puzzles/' + dow));
  if (snapshot.exists()) {
    return snapshot.val();
  } else {
    console.log("Error loading puzzle: no puzzle available");
    return null;
  }
}

async function getPuzzleDates() {
  const snapshot = await get(ref(db, 'puzzles'));
  if (snapshot.exists()) {
    let puzzles = snapshot.val();
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

async function getGameById(gameId) {
  console.log("Looking for game " + gameId);
  const snapshot = await get(ref(db, 'games/' + gameId));
  if (snapshot.exists()) {
    return snapshot.val();
  } else {
    return null;
  }
} 

async function getPlayer(playerId) {  
  if (!playerId) return;
  console.log("Looking for player " + playerId); 
  const snapshot = await get(ref(db, 'players/' + playerId));
  if (snapshot.exists()) {
    return snapshot.val();
  } else {
    return null;
  }
}

async function getGameIfCurrent(gameId, dow) {
  let currentPuzzle = await getPuzzle(dow);
  let game = await getGameById(gameId);
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
  await update(ref(db, 'players/' + playerId), {
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
    let player = await getPlayer(playerId);
    if (player) {
      let playerGames = player.games;
      if (playerGames && playerGames['owner'] && playerGames['owner'][dow]) {
        let gameId = playerGames['owner'][dow];
        console.log(`Checking to make sure game ${gameId} is current...`)
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
  const player = await getPlayer(user.uid);
  if (player) {
    console.log("Found player!");
    return player;
  } else {
    console.log("Could not find player, creating new one");
    return await createNewPlayer(user);
  }
}

async function updateGameBoard(gameId, board) {
  update(ref(db, 'games/' + gameId), {
    board: board
  });
}

// function addPlayer(gameId, playerId) {
//   const playersListRef = ref(db, 'games/' + gameId, 'players')
//   const newPlayerRef = push(playersListRef);
//   set(newPlayerRef, playerId);
// }

// function addGame(gameId, playerId) {
//   const gamesListRef = ref(db, 'players/' + playerId, 'games')
//   const newGameRef = push(gamesListRef);
//   set(newGameRef, gameId);
// }

// function getAllGames(playerId) {
//   get(ref(db, 'players/' + playerId, 'games')).then(snapshot => {
//     if (snapshot.exists()) {
//       return snapshot.val();
//     } else {
//       console.log("No data available");
//     }
//   }).catch(error => {
//     console.log(error);
//   });
// }



