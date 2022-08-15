import React from "react";
import Navbar from './Navbar';
import Board from './Board';
import Clue from './Clue';
import Keyboard from './Keyboard';
import SignIn from './SignIn';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import '../styles/common.css';
import '../styles/App.css';
import useAuthenticatedUser from '../hooks/useAuthenticatedUser';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  changeInput,
  loadGame,
  enteringPlayer,
  exitingPlayer,
  updatePlayerFocus,
  removeCheck,
  boardSaved,
  loadSquareState,
  loadWordState,
  loadBoardState,
  toggleAutocheck,
  resetGame
} from '../redux/slices/gameSlice';
import {
  initializePlayerView,
  toggleRebus,
  toggleOrientation,
  setTeamGames
} from '../redux/slices/povSlice';


function App(props) {
  const { 
    socket,
    auth
  } = props;

  // console.log("Render App component");
  const [searchParams, setSearchParams] = useSearchParams();
  const [gameId, setGameId] = React.useState(searchParams.get('gameId'));
  const [openToast, setOpenToast] = React.useState(false);
  const [toastMessage, setToastMessage] = React.useState(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const game = useSelector(state => state.game);
  const players = useSelector(state => state.game.players);
  /**
   * React component states
   */
  const [gameNotFound, setGameNotFound] = React.useState(false);
  const [user, initialized] = useAuthenticatedUser(auth);

  /**
   * Respond to socket events loading games
   */
  React.useEffect(() => {
    if (!user || socket === null) return;

    console.log(`Adding all listeners... to ${socket.id}`);

    socket.on("load-team-games", returnedGames => {
      if (returnedGames && returnedGames.length > 0) {
        dispatch(setTeamGames({teamGames: returnedGames}));
      }
    });

    console.log(`Get team games with ${user.uid}`)
    socket.emit("get-team-games", user.uid);

    socket.on('load-game', (game, socketId) => {
      console.log(`[Client] Loaded game ${game.gameId} from ${socketId}`);
      setGameId(game.gameId);
      setGameNotFound(false);
      console.log(game);
      dispatch(loadGame({ ...game, loaded: true }));

      let defaultFocus = game.clueDictionary.across[1].index;
      dispatch(initializePlayerView({
        numRows: game.numRows,
        numCols: game.numCols,
        gameGrid: game.gameGrid,
        focus: defaultFocus
      }));
      setSearchParams({gameId: game.gameId});

      socket.on("player-online", (playerId, serverGameId, displayName) => {
        console.log(`Player ${playerId} signed into game ${serverGameId}!`);
        dispatch(enteringPlayer({playerId: playerId, gameId: serverGameId}));
        if (user && (playerId !== user.uid) && (serverGameId === gameId)) {
          console.log("Setting toast message");
          let firstName = displayName.split(' ')[0];
          setToastMessage(`${firstName} has entered the game!`);
          setOpenToast(true);
        } else {
          console.log(`Not setting toast message`);
          console.log(`Me: ${user.uid} Player signed in: ${playerId} My game:${gameId} Game player signed in: ${serverGameId}`)
        }
      })
  
      socket.on("player-offline", (playerId, serverGameId) => {
        console.log(`Player ${playerId} signed out of game ${serverGameId}`);
        dispatch(exitingPlayer({playerId: playerId, gameId: serverGameId}));
      })


  
    });

    socket.on("load-player-cursor-change", (playerId, serverGameId, currentFocus) => {
      console.log(`Received load-player-cursor-change from ${playerId}`);
      dispatch(updatePlayerFocus({playerId: playerId, gameId: serverGameId, currentFocus: currentFocus}));
    })


    socket.on('game-not-found', () => {
      setGameNotFound(true);
    });

  
  }, [socket, user]);

  /**
   * Handle direct request for specific game, or get default game if no game ID specified
   */
  React.useEffect(() => {
    if (socket === null || !initialized) return;

    let requestedGameId = searchParams.get('gameId');
    if (!requestedGameId) {
      if (user) {
        console.log(`Getting default game with ${user.uid}`);
        socket.emit("get-default-game", user.uid);
      }

    } else if (requestedGameId !== game.gameId) {
      if (user) {
        console.log(`get-game-by-id with ${user.uid}`)
        socket.emit('get-game-by-id', requestedGameId, user.uid);
      } else {
        navigate(`/crossword-with-friends/join-game?gameId=${requestedGameId}`);
      }
    } 

  }, [socket, user, initialized, searchParams]);


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
   const mostRecentAction = useSelector(state => state.game.mostRecentAction);
 
   /**
    * Redux player p.o.v. state
    */
   const zoomActive = useSelector(state => state.pov.zoomActive);
   const rebusActive = useSelector(state => state.pov.rebusActive);
   const pencilActive = useSelector(state => state.pov.pencilActive);
   const orientation = useSelector(state => state.pov.focused.orientation);
   const focusedSquare = useSelector(state => state.pov.focused.square);
   const focusedWord = useSelector(state => state.pov.focused.word);
   const defaultFocus = useSelector(state => state.pov.defaultFocus);
 
   const [squareRefs] = React.useState(Array(numRows * numCols).fill(0).map(() => {
    return React.createRef();
  }));
  const [deleteMode, setDeleteMode] = React.useState(false);
  const [overwriteMode, setOverwriteMode] = React.useState(false);

  /**
   * Receive updates on game from other sources (different players or browser clients)
   */
  React.useEffect(() => {
    if (socket === null) return;
    const receiveMsgHandler = (message) => {
      console.log("Received external change, updating Redux state.");
      if (message.scope === "square") {
        dispatch(loadSquareState(message));

      } else if (message.scope === "word") {
        dispatch(loadWordState(message));

      } else if (message.scope === "board") {
        dispatch(loadBoardState(message));

      } else if (message.scope === "game") {
        if (message.type === "toggleAutocheck") {
          dispatch(toggleAutocheck({source: "external"}));

        } else if (message.type === "resetGame") {
          dispatch(resetGame({source: "external"}));

        } else {
          console.log(`Unknown message received for game scope: ${message}`);
        }
      } else {
        console.log(`Message with unknown scope received: ${message}`);
      }
    }
    socket.on("receive-changes", receiveMsgHandler);

    return () => {
      socket.off("receive-changes", receiveMsgHandler)
    }

  }, [socket]);

  /**
   * Send state updates through socket to other clients
   */
  React.useEffect(() => {
    if (!mostRecentAction || mostRecentAction.initial) return;
    if (mostRecentAction.scope === "word" || mostRecentAction.scope === "puzzle") {
      socket.emit("send-changes", { state: mostRecentAction.state, scope: mostRecentAction.scope});
    } else if (mostRecentAction.scope === "game") {
      socket.emit("send-changes", { type: mostRecentAction.type, scope: mostRecentAction.scope});
    } else {
      console.log(`Unrecognizable action: ${mostRecentAction}`);
    }

  }, [mostRecentAction, socket]);


  /**
   * Saves board to DB on current player changes
   */
  React.useEffect(() => {
    if (socket === null) return;
    if (!savedToDB) {
      socket.emit("save-board", gameId, board.map(square => ({
        ...square,
        source: null
      })));
      dispatch(boardSaved());
    }
  }, [savedToDB]);

  /**
   * Advances cursor after user input
   */
  React.useEffect(() => {
    if (advanceCursor > 0)
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
      dispatch(removeCheck({id: currentIndex }));
      if (!board[currentIndex].verified) {
        dispatch(changeInput({ id: currentIndex, value: '', source: socket.id }));
      }
    } else {
      setDeleteMode(false);

      if (e.key.length === 1 && e.key.match(/[A-Za-z]/)) {
        if (rebusActive) {
          dispatch(removeCheck({id: focusedSquare }));
          let currentInput = board[focusedSquare].input;
          let newValue = currentInput + e.key.toUpperCase();
          dispatch(changeInput({ id: focusedSquare, value: newValue, source: socket.id, penciled: pencilActive, advanceCursor: true }));
        } else {
          // if letter already in square, go into 'overwrite' mode
          if (board[focusedSquare].input !== "") {
            dispatch(removeCheck({id: focusedSquare }));
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

  function jumpToNextWord() {
    let nextWordStart = getNextWord(focusedSquare, clueDictionary, orientation);
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
    if (isLastClueSquare(index)) return defaultFocus;

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
    let gridNum = gameGrid[currentWordStart].gridNum;
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
      {initialized && !user && <SignIn auth={auth} socket={socket} />}
      {user && <React.Fragment>
        {gameId && gameNotFound && <h1>Game {gameId} not found. Games are rotated every week, so this may have been a game from last week.</h1>}
        {!gameNotFound && <div className="App">
          <Navbar
            socket={socket}
            auth={auth}
            gameId={gameId}
            jumpToSquare={jumpToSquare}
          />
          {loaded && <React.Fragment>
            <Board
              user={user}
              socket={socket}
              gameId={gameId}
              squareRefs={squareRefs}
            />
            <Clue
              jumpToNextWord={jumpToNextWord}
              jumpToPreviousWord={jumpToPreviousWord}
            />
            <Keyboard
              jumpToSquare={jumpToSquare}
              handleKeyDown={handleKeyDown}
            />
            <Snackbar
                open={openToast}
                onClose={() => setOpenToast(false)}
                autoHideDuration={2000}
            >
              <Alert 
                onClose={() => setOpenToast(false)} 
                severity="info" 
                sx={{ width: '100%' }}
              >
                {toastMessage}
              </Alert>
              </Snackbar>
            </React.Fragment>
          }
        </div>}
      </React.Fragment>
      }
    </div>
  );
}

export default App;
