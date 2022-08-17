import { getFirebaseConfig } from './firebase-config.js';
import { Server } from "socket.io";
import { weekdays, isCurrentPuzzleSaved, getCurrentDOW, getPreviousDOW } from "./functions/puzzleUtils.js";
import { v4 as uuidv4 } from 'uuid';
import express from 'express'; 
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import {jwtVerify, createRemoteJWKSet} from 'jose';
import url from "url";
import admin from "firebase-admin";

//These need to be replaced with admin SDK
import { getDatabase, ref, set, get, update } from "firebase/database";


const firebaseAppConfig = getFirebaseConfig();
const app = admin.initializeApp(firebaseAppConfig);
console.log("Initialized Firebase app");
const auth = admin.auth(app);
console.log("Initialized Firebase authentication");
const db = admin.database(app); 
console.log("Initialized Firebase realtime database");

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

  socket.on('send-player-cursor-change', (playerId, gameId, currentFocus) => {
    console.log(`Sending load-player-cursor-change event to room ${gameId}`);
    io.to(gameId).emit("load-player-cursor-change", playerId, gameId, currentFocus);
  });

  async function updateGameOnlineStatusForPlayer(gameId, playerId, online) {
    let players = await getGamePlayers(gameId);
    if (players) {
      let index = players.findIndex(player => player.playerId === playerId);
      if (index !== -1) {
        console.log(`Updating ${playerId} status for ${gameId} to ${online ? "online" : "offline"}`)
        update(ref(db, `games/${gameId}/players/${index}`), {
          online: online
        });
      } else {
        console.log(`Could not find player ${playerId} in game ${gameId} so could not update the online status.`);
      }

    } else {
      console.log(`Could not find players for game ${gameId}`);
    }
  }

  socket.on('leave-game', async(playerId, gameId) => {
    console.log(`Received leave-game event from ${playerId} for game ${gameId}`);
    socket.leave(gameId);
    console.log(`Sending player-offline event to room ${gameId}`);
    io.to(gameId).emit('player-offline', playerId, gameId);
    updateGameOnlineStatusForPlayer(gameId, playerId, false); 
  });

  async function sendGame(game, playerId, source) {
    let player = await getPlayer(playerId);
    game['source'] = source;
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
    io.to(gameId).emit('player-online', playerId, gameId, player.displayName);
    updateGameOnlineStatusForPlayer(gameId, playerId, true);

    // attach game listeners
    socket.on('send-changes', squareState => {
      io.to(gameId).emit("receive-changes", squareState);
    });



    socket.on('disconnect', () => {
      console.log(`Send disconnect event to room ${gameId}`);
      io.to(gameId).emit("player-offline", playerId, gameId);
      updateGameOnlineStatusForPlayer(gameId, playerId, false);
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
          let teamGames = await addPlayerToGame(player, game);
          socket.emit("load-team-games", teamGames);
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
    if (player) {
      let playerGames = player.games;
      if (playerGames) {
        let teamGames = playerGames['team'];
        socket.emit('load-team-games', teamGames);
      } else {
        console.log(`No team games found for player ${playerId}`);
      }
    } else {
      console.log(`Could not find player ${playerId}`);
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

  socket.on('user-signed-in', (idToken, gameId) => {
    console.log(`Received user-signed-in event with gameId: ${gameId}`);
    if (gameId) {
      // add user to game if not already added
      addUserToGame(idToken, gameId);

    } else {
      // add player to db if not already added
      addPlayerToDB(idToken);
    }
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

// const playerColors = [
//   "#278BD2", // "blue",
//   "#D33782", // "magenta",
//   "#6C71C4", // "violet",
//   "#859900", // "green",
//   "#DC3130", // "red",
//   "#2BA198", // "cyan",
//   "#CB4B16", // "orange",
//   "#B58900"  // "yellow
// ];

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
async function addPlayerToGame(player, game) {
  //update game object
  let players = game.players;
  let gameId = game.gameId;
  if (players.find(p => p.playerId === player.id)) {
    console.log(`Player ${player.id} already part of game ${gameId}.`);

  } else {
    let numCurrentPlayers = players.length;
    players.push({
      playerId: player.id,
      photoURL: player.photoURL,
      displayName: player.displayName,
      owner: false,
      color: defaultPlayerColors[numCurrentPlayers]
    });
    await update(ref(db, 'games/' + gameId), {
      players: players
    }); 
  }

  // update player object
  let playerGames = player.games;
  if (!playerGames) {
    playerGames = {owner: {}, team: []};
  } 
  let teamGames = playerGames['team'];
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
  return await getPlayerTeamGames(player.playerId);
}

async function addUserToGame(firebaseClientToken, gameId) {
  let user = await verifyFirebaseClientToken(firebaseClientToken);
  let player = await findOrCreatePlayer(user);
  let game = await getGameById(gameId);
  addPlayerToGame(player, game);
}

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

  } else {
    returnedUrl = `${redirectUrl}?token=${idToken}`;
  }
  console.log(`Redirecting Google auth token back to front-end`);
  res.redirect(returnedUrl);
})

server.listen(port, () => {
  console.log(`Express server listening on port ${port}`)
}) 

async function addPlayerToDB(firebaseClientToken) {
  let user = await verifyFirebaseClientToken(firebaseClientToken);
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
  return (await get(ref(db, 'games/' + gameId))).val();
}


async function getDefaultGame(playerId) {
  console.log("Getting default game...");
  let player = await getPlayer(playerId);
  if (player) {
    let dow;
    if (isCurrentPuzzleSaved(db)) {
      dow = getCurrentDOW();
    } else {
      dow = getPreviousDOW();
    }
    return await findOrCreateGame(dow, playerId);
  }
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

async function getGamePlayers(gameId) {
  console.log("Looking for players for game " + gameId);
  const snapshot = await get(ref(db, `games/${gameId}/players`));
  if (snapshot.exists()) {
    return snapshot.val();
  } else {
    return null;
  }
} 

async function getPlayerTeamGames(playerId) {
  console.log(`Looking for player ${playerId} team games`);
  const snapshot = await get(ref(db, `players/${playerId}/games/team`));
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

// async function updatePhotoIfNeeded(user, player) {
//   if (user.photoURL !== player.photoURL) {
//     console.log("Updating photoURL for " + player.displayName);
//     await update(ref(db, `players/${player.playerId}`), {
//       photoURL: user.photoURL
//     });
//   }
// }

async function findOrCreatePlayer(user) {
  if (user === null) return;
  const player = await getPlayer(user.uid);
  if (player) {
    console.log("Found player!");
    // await updatePhotoIfNeeded(user, player);
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

async function updatePlayerTeamGames(playerId) {
  const snapshot = await get(ref(db,`players/${playerId}/games/team`));
  if (snapshot.exists()) {
    let teamGames = snapshot.val();
    let updatedTeamGames = teamGames.filter(game => game !== null);
    update(ref(db, `players/${playerId}/games`), {
      team: updatedTeamGames
    });
  } 
}

//updatePlayerTeamGames("RJuKVBvMmeOipdaxDXYKQA9mHZY2");
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



