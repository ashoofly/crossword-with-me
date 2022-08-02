import { getFirebaseConfig } from '../firebase-config.js';
import { getDatabase, ref, set, get, update } from "firebase/database";
import { initializeApp } from "firebase/app";
import { Server } from "socket.io";
import { isCurrentPuzzleSaved, getCurrentDOW, getPreviousDOW } from "./functions/puzzleUtils.js";


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
    socket.emit('load-game', game);
    socket.on('send-changes', squareState => {
      socket.to(gameId).emit("receive-changes", squareState);
    });
  });
  socket.on("save-board", async (gameId, board) => {
    console.log("Saving board..");
    updateGameBoard(gameId, board);
  });
  console.log("connected");
});

async function loadPuzzle(dow) {
  console.log(`Loading puzzle for ${dow}...`);
  const snapshot = await get(ref(db, 'puzzles/' + dow.toLowerCase()));
  if (snapshot.exists()) {
    return snapshot.val();
  } else {
    console.log("Error loading puzzle: no puzzle available");
    return null;
  }
}

async function createNewGame(gameId) {
  let puzzle, dow;
  if (isCurrentPuzzleSaved(db)) {
    dow = getCurrentDOW();
  } else {
    dow = getPreviousDOW();
  }
  puzzle = await loadPuzzle(dow);
  console.log(`Creating game with ${dow} puzzle...`)
  let numSquares = puzzle.size.rows * puzzle.size.cols;
  await set(ref(db, 'games/' + gameId), {
    gameId: gameId,
    savedToDB: true,
    autocheck: false,
    advanceCursor: 0,
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

async function loadGame(gameId) {
  console.log("Looking for game " + gameId);
  const snapshot = await get(ref(db, 'games/' + gameId));
  if (snapshot.exists()) {
    return snapshot.val();
  } else {
    console.log("No data available");
    return null;
  }
}

async function updateGameBoard(gameId, board) {
  update(ref(db, 'games/' + gameId), {
    board: board
  });
}

function addPlayer(gameId, playerId) {
  const playersListRef = ref(db, 'games/' + gameId, 'players')
  const newPlayerRef = push(playersListRef);
  set(newPlayerRef, playerId);
}

function addGame(gameId, playerId) {
  const gamesListRef = ref(db, 'players/' + playerId, 'games')
  const newGameRef = push(gamesListRef);
  set(newGameRef, gameId);
}

function getAllGames(playerId) {
  get(ref(db, 'players/' + playerId, 'games')).then(snapshot => {
    if (snapshot.exists()) {
      return snapshot.val();
    } else {
      console.log("No data available");
    }
  }).catch(error => {
    console.log(error);
  });
}

async function findOrCreateGame(id) {
  if (id === null) return;
  const game = await loadGame(id);
  if (game) {
    console.log("Found game!");
    return game;
  } else {
    console.log("Could not find game, creating new one");
    return await createNewGame(id);
  }
}

