import { getFirebaseConfig } from '../firebase-config.js';
import { getDatabase, ref, set, get, update } from "firebase/database";
import { initializeApp } from "firebase/app";
import { Server } from "socket.io";
import { weekdays, isCurrentPuzzleSaved, getCurrentDOW, getPreviousDOW } from "./functions/puzzleUtils.js";
import { v4 as uuidv4 } from 'uuid';


const firebaseAppConfig = getFirebaseConfig();
const app = initializeApp(firebaseAppConfig);
console.log("Initialized Firebase app");
const db = getDatabase(app);
console.log("Initialized Firebase realtime database");

const io = new Server(3001, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

io.on("connection", socket => {
  socket.on('get-game', async (gameId) => {
    const game = await findOrCreateGame(gameId);
    socket.join(gameId);
    console.log("Sending game to " + gameId);
    io.to(gameId).emit('load-game', game);
    socket.on('send-changes', squareState => {
      io.to(gameId).emit("receive-changes", squareState);
    });
  });
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
  socket.on("get-game-by-dow", async(socketId, dow, playerId) => {
    console.log(`${socketId} ${dow} ${playerId}`);
    const game = await findOrCreateGame(dow, playerId);
    console.log(`Sending load-game event to ${socketId} client`);
    socket.emit("load-game", game);
  });


  console.log("connected");
  console.log(socket.id);
});

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
  console.log(`Creating game with ${dow} puzzle...`)
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


// async function createNewGame(gameId) {
//   let puzzle, dow;
//   if (isCurrentPuzzleSaved(db)) {
//     dow = getCurrentDOW();
//   } else {
//     dow = getPreviousDOW();
//   }
//   puzzle = await getPuzzle(dow);
//   console.log(`Creating game with ${dow} puzzle...`)
//   let numSquares = puzzle.size.rows * puzzle.size.cols;
//   await set(ref(db, 'games/' + gameId), {
//     gameId: gameId,
//     savedToDB: true,
//     autocheck: false,
//     advanceCursor: 0,
//     board: [...Array(numSquares).keys()].map( (num) => ({
//       initial: true,
//       index: num,
//       input: '',
//       reveal: false,
//       check: false,
//       verified: false,
//       incorrect: false,
//       partial: false,
//       penciled: false
//     })),
//     clueDictionary: puzzle.clueDictionary,
//     gameGrid: puzzle.gameGrid,
//     copyright: puzzle.copyright,
//     date: puzzle.date,
//     dow: puzzle.dow,
//     editor: puzzle.editor,
//     author: puzzle.author,
//     hasTitle: puzzle.hastitle,
//     title: puzzle.title,
//     numRows: puzzle.size.rows,
//     numCols: puzzle.size.cols
//   });
//   return (await get(ref(db, 'games/' + gameId))).val();
// }

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



