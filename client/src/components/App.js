import React from "react";
import Navbar from './Navbar';
import Board from './Board';
import Clue from './Clue';
import Keyboard from './Keyboard';
import '../styles/common.css';
import '../styles/App.css';
import { getFirebaseConfig } from '../firebase-config';
import { initializeApp } from "firebase/app";
import { initializeAuth } from '../auth';
import { io } from 'socket.io-client';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  changeInput,
  loadGame,
  removeCheck,
  boardSaved
} from '../redux/slices/gameSlice';
import {
  initializePlayerView,
  toggleRebus,
  toggleOrientation
} from '../redux/slices/povSlice';
import useAuthenticatedUser from '../hooks/useAuthenticatedUser';


function App() {
  console.log("Render App component");

  const { id: gameId } = useParams();
  const dispatch = useDispatch();

  /**
   * Redux game state
   */
  const loaded = useSelector(state => state.game.loaded);
  const savedToDB = useSelector(state => state.game.savedToDB);
  const numCols = useSelector(state => state.game.numCols);
  const numRows = useSelector(state => state.game.numRows);
  const board = useSelector(state => state.game.board);
  const gameGrid = useSelector(state => state.game.gameGrid);
  const clueDictionary = useSelector(state => state.game.clueDictionary);
  const advanceCursor = useSelector(state => state.game.advanceCursor);

  /**
   * Redux player p.o.v. state
   */
  const zoomActive = useSelector(state => state.pov.zoomActive);
  const rebusActive = useSelector(state => state.pov.rebusActive);
  const pencilActive = useSelector(state => state.pov.pencilActive);
  const orientation = useSelector(state => state.pov.orientation);
  const focusedSquare = useSelector(state => state.pov.focused.square);
  const focusedWord = useSelector(state => state.pov.focused.word);

  /**
   * React component states
   */
  const [auth, setAuth] = React.useState(null);
  const [socket, setSocket] = React.useState(null);
  const [squareRefs] = React.useState(Array(numRows * numCols).fill(0).map(() => {
    return React.createRef();
  }));
  const [deleteMode, setDeleteMode] = React.useState(false);
  const [overwriteMode, setOverwriteMode] = React.useState(false);
  const user = useAuthenticatedUser(auth);

  /**
   * Initialize Firebase
   */
  React.useEffect(() => {
    const firebaseAppConfig = getFirebaseConfig();
    const app = initializeApp(firebaseAppConfig);
    console.log("Initialized Firebase app");
    setAuth(initializeAuth(app));
    console.log("Initialized Firebase authentication");
  }, []);

  /**
   * Initialize Socket.io
   */
  React.useEffect(() => {
    const s = io("http://localhost:3001");
    setSocket(s);

    return () => {
      s.disconnect();
    }
  }, []);

  /**
   * Load existing or create new game
   */
  React.useEffect(() => {
    if (socket === null) return;
    socket.once('load-game', game => {
      console.log(`[Client] Loaded game ${gameId}`);
      console.log(game);
      dispatch(loadGame({ ...game, loaded: true }));
      dispatch(initializePlayerView({
        numRows: game.numRows,
        numCols: game.numCols,
        gameGrid: game.gameGrid
      }));
    });
    socket.emit('get-game', gameId);
  }, [socket, gameId]);

  /**
   * Receive updates on game from other sources
   */
  React.useEffect(() => {
    if (socket === null) return;
    const handler = (state) => {
      console.log("Received external change, updating Redux state.");
      dispatch(changeInput({ id: state.index, value: state.input, source: 'external' }));
    }
    socket.on("receive-changes", handler);

    return () => {
      socket.off("receive-changes", handler)
    }

  }, [socket]);

  /**
   * Saves board to DB on changes from current player
   */
  React.useEffect(() => {
    if (socket === null) return;
    if (!savedToDB) {
      socket.emit("save-board", gameId, board);
      dispatch(boardSaved());
    }
  }, [savedToDB]);

  /**
   * Advances cursor after user input
   */
  React.useEffect(() => {
    goToNextSquareAfterInput();
  }, [advanceCursor])

  /**
   * Board navigation logic
   */
  function handleKeyDown(e) {
    e.preventDefault();

    if (e.key === " ") {
      dispatch(toggleOrientation());

    } else if (e.key === "Tab" || (e.shiftKey && e.key === "ArrowRight")) {
      jumpToNextWord();

    } else if (e.shiftKey && e.key === "ArrowLeft") {
      jumpToPreviousWord();

    } else if (board[focusedSquare].verified) {
      goToNextSquareAfterInput();

    } else if (rebusActive && e.key === "Enter") {
      dispatch(toggleRebus());

    } else if (e.key === "Backspace") {
      setDeleteMode(true);
      let currentIndex = focusedSquare;
      if (board[focusedSquare].input === '') {
        // if user input already empty, backspace to previous letter
        currentIndex = backspace();
      }
      dispatch(removeCheck({ id: currentIndex }));
      if (!board[currentIndex].verified) {
        dispatch(changeInput({ id: currentIndex, value: '', source: socket.id }));
      }
    } else {
      setDeleteMode(false);

      if (e.key.length === 1 && e.key.match(/[A-Za-z]/)) {
        if (rebusActive) {
          dispatch(removeCheck({ id: focusedSquare }));
          let currentInput = board[focusedSquare].input;
          let newValue = currentInput + e.key.toUpperCase();
          dispatch(changeInput({ id: focusedSquare, value: newValue, source: socket.id, penciled: pencilActive, advanceCursor: true }));
        } else {
          // if letter already in square, go into 'overwrite' mode
          if (board[focusedSquare].input !== "") {
            dispatch(removeCheck({ id: focusedSquare }));
            setOverwriteMode(true);
          } else {
            if (overwriteMode) setOverwriteMode(false);
          }
          dispatch(changeInput({ id: focusedSquare, value: e.key.toUpperCase(), source: socket.id, penciled: pencilActive, advanceCursor: true }));
        }
      }
    }
  }

  function goToNextSquareAfterInput() {
    if (!deleteMode && !rebusActive) {
      let index = getNextEmptySquare(focusedSquare);
      jumpToSquare(index);
    }
  }

  function jumpToPreviousWord() {
    let prevWordStart = getPrevWord(focusedSquare, clueDictionary, orientation);
    jumpToSquare(getNextEmptySquare(prevWordStart, true));
  }

  function jumpToNextWord(focus) {
    let nextWordStart = getNextWord(focus, clueDictionary, orientation);
    jumpToSquare(getNextEmptySquare(nextWordStart));
  }

  function jumpToSquare(index) {
    squareRefs[index].current.focus();
    if (zoomActive) {
      scrollToWord(index);
    }
  }

  function getNextEmptySquare(index, previous) {
    // If last square in orientation, start search at beginning
    // TODO: edge case where(0,0) square is not valid
    if (isLastClueSquare(index)) return 0;

    let incrementInterval = orientation === "across" ? 1 : numCols;

    if (overwriteMode) {
      let next = index + incrementInterval;
      // in overwrite mode, just go to the next playable square in the word regardless of whether it is occupied       
      if (next < (numCols * numRows) && gameGrid[next].isPlayable && !board[next].verified) {
        return next;
      } else {
        return getNextWord(index);
      }

    } else {
      let currentWordStart = findWordStart(index);
      let currentWordEnd = findWordEnd(index);

      // Start at current square and go to next empty letter in word
      for (let i = index; i <= currentWordEnd; i = (i + incrementInterval)) {
        if (board[i].verified) continue;
        if (board[i].input === "") return i;
      }
      // If all filled, go back to any empty letters at the beginning of the word
      for (let i = currentWordStart; i < index; i = (i + incrementInterval)) {
        if (board[i].verified) continue;
        if (board[i].input === "") return i;
      }

      // If word is all filled out, find next word 
      if (previous) {
        return getNextEmptySquare(getPrevWord(index), true);
      } else {
        return getNextEmptySquare(getNextWord(index));
      }
    }
  }


  function getPrevWord(index) {
    let currentWordClueDictionaryEntry = mapGridIndexToClueDictionaryEntry(index);
    let prevGridNum = currentWordClueDictionaryEntry.prevGridNum;
    if (prevGridNum !== -1) {
      let prevWordStartIndex = clueDictionary[orientation][prevGridNum].index;
      return prevWordStartIndex;
    } else {
      let currentWordStart = findWordStart(index);
      return currentWordStart;
    }
  }

  function getNextWord(index) {
    let currentWordClueDictionaryEntry = mapGridIndexToClueDictionaryEntry(index);
    let nextGridNum = currentWordClueDictionaryEntry.nextGridNum;
    if (nextGridNum !== -1) {
      let nextWordStartIndex = clueDictionary[orientation][nextGridNum].index;
      return nextWordStartIndex;
    } else {
      let currentWordEnd = findWordEnd(index);
      return currentWordEnd;
    }
  }

  function backspace() {
    let index = getPreviousSquare();
    jumpToSquare(index);
    return index;
  }

  function getPreviousSquare() {
    if (focusedSquare === 0) return 0;

    if (orientation === "across") {
      let current = focusedSquare - 1;
      while (!gameGrid[current].isPlayable) {
        current--;
      }
      return current;
    } else {
      // orientation: down
      if (focusedSquare > focusedWord[0]) {
        return focusedSquare - numCols;
      } else {
        let prevWordEndIndex = findWordEnd(getPrevWord(focusedSquare));
        return prevWordEndIndex;
      }
    }
  }

  function isLastClueSquare(index) {
    let currentWordClueDictionaryEntry = mapGridIndexToClueDictionaryEntry(index);
    return currentWordClueDictionaryEntry.isLastClue && findWordEnd(index) === index;
  }

  function mapGridIndexToClueDictionaryEntry(index) {
    let currentWordStart = findWordStart(index);
    return clueDictionary[orientation][gameGrid[currentWordStart].gridNum];
  }


  function findWordStart(index) {
    let currentIndex = index;
    if (orientation === "across") {
      while (!gameGrid[currentIndex].acrossStart) {
        currentIndex--;
      }
    } else {
      //orientation is "down"
      while (currentIndex >= numCols && !gameGrid[currentIndex].downStart) {
        currentIndex = currentIndex - numCols;
      }
    }
    return currentIndex;
  }

  function findWordEnd(index) {
    let currentIndex = index;
    let wordEnd;
    if (orientation === "across") {
      while (gameGrid[currentIndex].answer !== '.' && currentIndex % numCols !== (numCols - 1)) {
        currentIndex++;
      }
      wordEnd = gameGrid[currentIndex].answer === '.' ? currentIndex - 1 : currentIndex;

    } else {
      //orientation is "down"
      while ((currentIndex + numCols) < (numCols * numRows) && gameGrid[currentIndex].answer !== '.') {
        currentIndex = currentIndex + numCols;
      }
      wordEnd = gameGrid[currentIndex].answer === '.' ? currentIndex - numCols : currentIndex;
    }
    return wordEnd;
  }


  /**
   * For zoomed-in view (mobile option)
   */
  function scrollToWord(index) {
    let firstLetterOfWord = squareRefs[index].current;
    let startBoundary = orientation === "across" ?
      firstLetterOfWord.getBoundingClientRect().left : firstLetterOfWord.getBoundingClientRect().top;
    let lastLetterOfWord = squareRefs[findWordEnd(index)].current;
    let endBoundary = orientation === "across" ?
      lastLetterOfWord.getBoundingClientRect().right : lastLetterOfWord.getBoundingClientRect().bottom;
    let outOfBounds = orientation === "across" ?
      window.innerWidth : document.querySelector('.Board').getBoundingClientRect().bottom;
    if (endBoundary > outOfBounds) {
      let lengthOfWord = endBoundary - startBoundary;
      let validBoundaries = orientation === "across" ?
        window.innerWidth : document.querySelector('.Board').offsetHeight;
      if (lengthOfWord <= validBoundaries) {
        lastLetterOfWord.scrollIntoView({
          behavior: "smooth",
          block: orientation === "across" ? (nearBottomOfScreen(firstLetterOfWord) ? "center" : "nearest") : "end",
          inline: orientation === "across" ? "end" : "nearest"
        });
      } else {
        firstLetterOfWord.scrollIntoView({
          behavior: "smooth",
          block: orientation === "across" ? "nearest" : "start",
          inline: orientation === "across" ? "start" : "nearest"
        });
      }
    }
    if (orientation === "across" && nearBottomOfScreen(firstLetterOfWord)) {
      firstLetterOfWord.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "nearest"
      });
    }
  }

  function nearBottomOfScreen(element) {
    return element.getBoundingClientRect().top > 0.8 * document.querySelector('.Board').getBoundingClientRect().bottom;
  }

  return (
    <div className="container" onKeyDown={handleKeyDown}>
      {!loaded && <h1>Loading...</h1>}
      {loaded && <div className="App">
        <Navbar
          auth={auth}
          jumpToSquare={jumpToSquare}
        />
        <Board
          socket={socket}
          squareRefs={squareRefs}
        />
        <Clue
          jumpToNextWord={jumpToNextWord}
          jumpToPreviousWord={jumpToPreviousWord}
        />
        <Keyboard
          jumpToSquare={jumpToSquare}
          handleKeyDown={(e) => handleKeyDown.current(e)}
        />
      </div>}
    </div>
  );
}

export default App;
