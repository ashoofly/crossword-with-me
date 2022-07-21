import { getFirebaseConfig } from '../firebase-config.js';
import { getDatabase, ref, set, get, update } from "firebase/database";
import { initializeApp } from "firebase/app";
import { Server } from "socket.io";


const firebaseAppConfig = getFirebaseConfig();
const app = initializeApp(firebaseAppConfig);
console.log("Initialized Firebase app");
const db = getDatabase(app);
console.log("Initialized Firebase realtime database");

function saveNewPuzzle(info, clueDictionary, grid) {
  set(ref(db, 'puzzles/' + info.dow), {
    dow: info.dow,
    date: info.date,
    title: info.title,
    author: info.author,
    editor: info.editor,
    copyright: info.copyright,
    publisher: info.publisher,
    clueDictionary: clueDictionary,
    grid: grid
  });
}


async function createNewGame(gameId, numSquares) {
  set(ref(db, 'games/' + gameId), {
    gameId: gameId,
    autocheck: false,
    board: [...Array(numSquares).keys()].map( num => ({
      initial: true,
      index: num,
      input: '',
      reveal: false,
      check: false,
      verified: false,
      incorrect: false,
      partial: false,
      penciled: false,
      squareRootClasses: ['square'],
      squareValueClasses: ['square-value']
    }))
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



const io = new Server(3001, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

io.on("connection", socket => {
  socket.on('get-game', async (gameId, numSquares) => {
    const game = await findOrCreateGame(gameId, numSquares);
    socket.join(gameId);
    socket.emit('load-game', game);
    socket.on('send-changes', squareState => {
      socket.to(gameId).emit("receive-changes", squareState);
    });
  });
  socket.on("save-board", async (gameId, board) => {
    console.log("Saving board..");
    await updateGameBoard(gameId, board);
  });
  console.log("connected");
});

async function findOrCreateGame(id, numSquares) {
  if (id === null) return;

  const game = await loadGame(id);
  if (game) {
    console.log("Found game!");
    return game;
  } else {
    console.log("Could not find game, creating new one");
    return await createNewGame(id, numSquares);
  }
}

