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

io.on("connection", async(socket) => {

  socket.on("save-board", async (gameId, board) => {
    console.log("Saving board..");
    updateGameBoard(gameId, board);
  });
  socket.on("get-player", async(user) => {
    const player = await findOrCreatePlayer(user); 
    socket.join(player.id);
    io.to(player.id).emit('load-player', player);
  });
  socket.on("get-puzzle-dates", async () => {
    const puzzleDates = await getPuzzleDates();
    socket.emit('load-puzzle-dates', puzzleDates); 
  });
  socket.on("get-game-by-dow", async(dow, playerId) => {
    console.log(`${dow} ${playerId}`);
    const game = await findOrCreateGame(dow, playerId);
    const gameId = game.gameId;
    socket.join(gameId);
    console.log(`Sending load-game event to client`);
    socket.emit("load-game", game);
    socket.on('send-changes', squareState => {
      io.to(gameId).emit("receive-changes", squareState);
    });
  });
  socket.on("get-default-game", async(playerId) => {
    const game = await getDefaultGame(playerId);
    const gameId = game.gameId;
    socket.join(gameId);
    console.log('Sending load-game to client after fetching default game');
    socket.emit("load-game", game);
    socket.on('send-changes', squareState => {
      io.to(gameId).emit("receive-changes", squareState);
    });
  });

  socket.on("get-friend-request-name", async(gameId) => {
    console.log(`Received get-friend-request-name with ${gameId}`);
    const game = await getGameById(gameId);
    if (game) {
      if (game.players) {
        let ownerId = game.players[0];
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

  socket.on('get-game-by-id', async (gameId, playerId) => {
    console.log(`Received get-game-by-id request with ${gameId} and ${playerId}`);
    const game = await getGameById(gameId);
    if (game) {
      if (game.players) {
        if (playerId) {
          socket.join(gameId);
          console.log("Sending game to " + gameId);
          socket.emit("load-game", game);
          socket.on('send-changes', squareState => {
            io.to(gameId).emit("receive-changes", squareState);
          });
        } else {
          let ownerId = game.players[0];
          if (ownerId) {
            let ownerInfo = await getPlayer(ownerId);
            if (ownerInfo) {
              console.log(`Sending display-friend-request event back to client`);
              socket.emit("display-friend-request", ownerInfo.displayName);
            }
          }
        }
      } else {
        socket.emit("game-not-found");
      }
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

  const idToken = req.body.credential;
  const JWKS = createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'));

  const { payload } = await jwtVerify(idToken, JWKS, {
    issuer: 'https://accounts.google.com',
    audience: firebaseAppConfig.googleClientId,
  })

  const nonce = payload.nonce;
  const decodedNonce = Buffer.from(nonce, 'base64').toString('ascii');
  console.log(decodedNonce);

  const redirectUrlRegex = /(http.+)---(.+)/;
  const [ original, redirectUrl, hash ] = redirectUrlRegex.exec(decodedNonce);
  const url = `${redirectUrl}&token=${idToken}`
  console.log(`Got auth token, redirecting back to front-end`);
  res.redirect(url);
})

server.listen(port, () => {
  console.log(`Express server listening on port ${port}`)
}) 



async function createNewPlayer(user) {
  let playerId = user.uid;
  await set(ref(db, 'players/' + playerId), {
    id: playerId,
    displayName: user.displayName,
    email: user.email,
    photoURL: user.photoURL
  });
  return (await get(ref(db, 'players/' + playerId))).val();
}

async function createWeekOfGames(playerId) {
  let gameIds = [];
  for(const day of weekdays) {
    let newGame = await createNewGame(playerId, day);
    gameIds.push(newGame.gameId);
  }
  return gameIds;
}


async function createNewGame(dow, playerId) {
  let gameId = uuidv4();
  let puzzle = await getPuzzle(dow);
  console.log(`Creating game ${gameId} for ${playerId} with ${dow} puzzle...`)
  let numSquares = puzzle.size.rows * puzzle.size.cols;
  await set(ref(db, 'games/' + gameId), {
    gameId: gameId,
    savedToDB: true,
    autocheck: false,
    advanceCursor: 0,
    players: playerId ? [playerId] : [],
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
  console.log("Looking for player " + playerId); 
  const snapshot = await get(ref(db, 'players/' + playerId));
  if (snapshot.exists()) {
    return snapshot.val();
  } else {
    return null;
  }
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
      if (playerGames && playerGames[dow]) {
        let gameId = playerGames[dow];
        return await getGameById(gameId); 
      } else {
        // create new player game 
        let newGame = await createNewGame(dow, playerId);
        if (!playerGames) {
          playerGames = {};
        }
        playerGames[dow] = newGame.gameId;
  
        // update player object
        await update(ref(db, 'players/' + playerId), {
          games: playerGames
        });
        return newGame;
      }
    } else {
      console.log("Cannot find player in database");
      return null;
    }

  } else {
    // create new anonymous game
    return await createNewGame(dow);
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



