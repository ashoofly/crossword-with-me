import { useState, useEffect, createRef, Fragment } from "react";
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import useAuthenticatedUser from '../hooks/useAuthenticatedUser';
import { useMediaQuery } from 'react-responsive'
import TitleBar from './TitleBar';
import NavBar from './NavBar';
import Board from './Board';
import Clue from './Clue';
import Keyboard from './Keyboard';
import SignIn from './SignIn';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import '../styles/App.css';
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
import Logger from '../utils/logger';

function App(props) {
  const { 
    socket,
    auth
  } = props;

  const isWidescreen = useMediaQuery({ query: '(min-width: 1000px)' });
  // const [windowSize, setWindowSize] = useState(getWindowSize());

  const numCols = useSelector(state => state.game.numCols);
  const numRows = useSelector(state => state.game.numRows);
  const loadedGameId = useSelector(state => state.game.gameId);
  const [boardPadding, setBoardPadding] = useState(2);


  // if (isWidescreen) {
  //   //  --squareSideLength: min(calc(var(--boardWidth)/var(--numCols)), calc(var(--boardHeight)/var(--numRows)));
  //   console.log(innerHeight*0.90);
  //   console.log(innerWidth*0.55);
  //   let widescreenBoardWidth = Math.max(innerHeight*0.9, innerWidth* 0.55);
  //   let widescreenRightWidth = innerWidth - widescreenBoardWidth;
  //   console.log(widescreenBoardWidth)
  //   document.documentElement.style.setProperty("--widescreen-left-width", `${widescreenBoardWidth}px`);
  //   document.documentElement.style.setProperty("--widescreen-right-width", `${widescreenRightWidth}px`);

  //   //document.documentElement.style.setProperty("--numRows", numRows);
  // }





  useEffect(() => {
    function setAppLayout() {
      const { width, height } = window.visualViewport;



      const maxBoardHeightSmallScreen = height * 0.53;
      const barHeight = isWidescreen ? (height * 0.1) : (height * 0.08);
      const keyboardHeight = isWidescreen ? (height * 0.35) : (height * 0.23);
      const keyboardRowMargin = 2;
      const keyboardMargins = 2 + 3 + 10;
      const keyboardButtonMinHeight = (keyboardHeight - keyboardMargins) / 3;
      document.documentElement.style.setProperty("--app-height", `${height}px`);
      document.documentElement.style.setProperty("--app-width", `${width}px`);
      document.documentElement.style.setProperty("--max-board-height", `${maxBoardHeightSmallScreen}px`);
      document.documentElement.style.setProperty("--board-padding", `${boardPadding}px`);
      document.documentElement.style.setProperty("--bar-height", `${barHeight}px`);
      document.documentElement.style.setProperty("--keyboard-height", `${keyboardHeight}px`);
      document.documentElement.style.setProperty("--keyboard-row-margin", `${keyboardRowMargin}px`); 
      document.documentElement.style.setProperty("--keyboard-button-min-height", `${keyboardButtonMinHeight}px`);

      if (isWidescreen) {
        const middleSectionHeight = height - (barHeight + keyboardHeight);
        document.documentElement.style.setProperty("--middle-section-height", `${middleSectionHeight}px`);
      }

    }

    setAppLayout();
    window.addEventListener('resize', setAppLayout);

    return () => {
      window.removeEventListener('resize', setAppLayout);
    };
  }, []);

  useEffect(() => {
    function setBoardLayout() {
      const squareSideLength = isWidescreen ? 
          (((window.visualViewport.height * 0.9) - (2 * boardPadding)) / numRows) 
              : 
          ((window.visualViewport.width - (2 * boardPadding)) / numCols);
      document.documentElement.style.setProperty("--square-side-length", `${squareSideLength}px`);
    }

    setBoardLayout();
    window.addEventListener('resize', setBoardLayout);

    return () => {
      window.removeEventListener('resize', setBoardLayout);
    };
  }, [loadedGameId]);




  // logger.log("Render App component");
  const [searchParams, setSearchParams] = useSearchParams();
  const [gameId, setGameId] = useState(searchParams.get('gameId'));
  const [openToast, setOpenToast] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [myColor, setMyColor] = useState(null);
  const [gameNotFound, setGameNotFound] = useState(false);
  const [user, initialized] = useAuthenticatedUser(auth);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const game = useSelector(state => state.game);
  const players = useSelector(state => state.game.players);
  const logger = new Logger("App");

  const isDesktop = useMediaQuery({
    query: '(min-width: 1224px)'
  })
  const isBigScreen = useMediaQuery({ query: '(min-width: 1824px)' })
  const isTabletOrMobile = useMediaQuery({ query: '(max-width: 1224px)' })
  const isPortrait = useMediaQuery({ query: '(orientation: portrait)' })
  const isRetina = useMediaQuery({ query: '(min-resolution: 2dppx)' })

  const isTabletLandscape = useMediaQuery({ query: '(min-width: 1000px) and (max-width: 1224px)' });
  /**
   * Handle direct request for specific game, or get default game if no game ID specified
   */
    useEffect(() => {
    if (socket === null || !initialized) return;

    const requestedGameId = searchParams.get('gameId');
    if (!requestedGameId) {
      if (user) {
        logger.log(`Getting default game with ${user.uid}`);
        socket.emit("get-default-game", user.uid);
      }

    } else if (requestedGameId !== game.gameId) {
      logger.log(`Comparing requested game id ${requestedGameId} with current game id ${game.gameId}`)
      // compare requestedGameId to currently loaded game
      if (user) {
        logger.log(`get-game-by-id with ${user.uid}`)
        socket.emit('get-game-by-id', requestedGameId, user.uid);
      } else {
        navigate(`/crossword-with-friends/join-game?gameId=${requestedGameId}`);
      }
    } else if (requestedGameId === game.gameId) {
      logger.log(`Requested game id ${requestedGameId} is same as current game id ${game.gameId}. Will not request game from server again.`)
    }

  }, [socket, user, initialized, searchParams]);

  /**
   * Respond to socket events loading games
   */
  useEffect(() => {
    if (!user || socket === null) return;

    function handleLoadTeamGame(returnedGames) {
      if (returnedGames && returnedGames.length > 0) {
        dispatch(setTeamGames({teamGames: returnedGames}));
      }
    }

    function handleLoadGame(game) {
      logger.log(`[Client] Loaded game ${game.gameId}`);
      logger.log("Setting game id to " + game.gameId);
      setGameId(game.gameId);
      setGameNotFound(false);
      logger.log(JSON.stringify(game, null, 4)); 
      dispatch(loadGame({ ...game, loaded: true }));

      let defaultFocus = game.clueDictionary.across[1].index;
      dispatch(initializePlayerView({
        numRows: game.numRows,
        numCols: game.numCols,
        gameGrid: game.gameGrid,
        focus: defaultFocus
      }));
      setSearchParams({gameId: game.gameId});      
    }

    function handleGameNotFound() {
      setGameNotFound(true);
    }

    logger.log(`Adding listeners to ${socket.id}: load-team-games, load-game, game-not-found`);
    socket.on("load-team-games", handleLoadTeamGame);
    socket.on('load-game', handleLoadGame);
    socket.on('game-not-found', handleGameNotFound);

    logger.log(`Get team games with ${user.uid}`)
    socket.emit("get-team-games", user.uid);


    return function cleanup() { 
      logger.log(`Removing listeners from ${socket.id}: load-team-games, load-game, game-not-found`);
      socket.off("load-team-games", handleLoadTeamGame);
      socket.off('load-game', handleLoadGame);
      socket.off('game-not-found', handleGameNotFound);
    }
  
  }, [socket, user]);

  /**
   * Respond to events of friends entering or leaving game
   */
  useEffect(() => {    
    if (!user || socket === null || !gameId) return;

    function handlePlayerOnline(playerId, serverGameId, displayName) {
      logger.log(`Player ${playerId} signed into game ${serverGameId}!`);
      dispatch(enteringPlayer({playerId: playerId, gameId: serverGameId}));
      if (user && (playerId !== user.uid) && (serverGameId === gameId)) {
        logger.log("Setting toast message");
        let firstName = displayName.split(' ')[0];
        setToastMessage(`${firstName} has entered the game!`);
        setOpenToast(true);
      } else {
        logger.log(`Not setting toast message`);
        logger.log(`Me: ${user.uid} Player signed in: ${playerId} My game:${gameId} Game player signed in: ${serverGameId}`)
      }      
    }

    function handlePlayerOffline(playerId, serverGameId) {
      logger.log(`Player ${playerId} signed out of game ${serverGameId}`);
      dispatch(exitingPlayer({playerId: playerId, gameId: serverGameId}));
    }

    function handleLoadPlayerCursorChange(socketId, playerId, serverGameId, currentFocus) {
      if (socketId !== socket.id) {
        logger.log(`Received load-player-cursor-change from ${playerId}`);
        dispatch(updatePlayerFocus({playerId: playerId, gameId: serverGameId, currentFocus: currentFocus}));
      }
    }

    logger.log(`Adding listeners to ${socket.id}: player-online, player-offline, load-player-cursor-change`);
    socket.on("player-online", handlePlayerOnline);
    socket.on("player-offline", handlePlayerOffline);
    socket.on("load-player-cursor-change", handleLoadPlayerCursorChange);

    return function cleanup() {
      logger.log(`Removing listeners to ${socket.id}: player-online, player-offline, load-player-cursor-change`);
      socket.off("player-online", handlePlayerOnline);
      socket.off("player-offline", handlePlayerOffline);
      socket.off("load-player-cursor-change", handleLoadPlayerCursorChange);
    }

  }, [gameId, socket, user]);

  /**
   * Set player game color
   */
   useEffect(() => {
    if (!user) return;
    let me = players.find(player => player.playerId === user.uid);
    if (me) {
      setMyColor(me.color);
    }
  }, [user, players]);

  /**
   * Redux game state
   */
   const loaded = useSelector(state => state.game.loaded);
   const savedToDB = useSelector(state => state.game.savedToDB);
  //  const numCols = useSelector(state => state.game.numCols);
  //  const numRows = useSelector(state => state.game.numRows);
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
 
   const [squareRefs] = useState(Array(numRows * numCols).fill(0).map(() => {
    return createRef();
  }));
  const [deleteMode, setDeleteMode] = useState(false);
  const [overwriteMode, setOverwriteMode] = useState(false);

  /**
   * Receive updates on game from other sources (different players or browser clients)
   */
  useEffect(() => {
    if (socket === null) return;
    const receiveMsgHandler = (message) => {
      if (message.gameId === game.gameId) {
        logger.log(`Received external change for ${message.gameId}, updating Redux state.`);
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
            logger.log(`Unknown message received for game scope: ${message}`);
          }
        } else {
          logger.log(`Message with unknown scope received: ${message}`);
        }
      }
    }
    socket.on("receive-changes", receiveMsgHandler);

    return () => {
      socket.off("receive-changes", receiveMsgHandler)
    }

  }, [socket, game]);

  /**
   * Send state updates through socket to other clients
   */
  useEffect(() => {
    if (!mostRecentAction || mostRecentAction.initial || socket === null) return;
    if (mostRecentAction.source === socket.id) {
      if (mostRecentAction.scope === "word" || mostRecentAction.scope === "puzzle") {
        socket.emit("send-changes", { gameId: game.gameId, state: mostRecentAction.state, scope: mostRecentAction.scope});
      } else if (mostRecentAction.scope === "game") {
        socket.emit("send-changes", { gameId: game.gameId, type: mostRecentAction.type, scope: mostRecentAction.scope});
      } else {
        logger.log(`Unrecognizable action: ${mostRecentAction}`);
      }
    }

  }, [mostRecentAction, socket, game]);


  /**
   * Saves board to DB on current player changes
   */
  useEffect(() => {
    if (socket === null) return;
    if (!savedToDB) {
      socket.emit("save-board", gameId, board.map(square => ({
        ...square,
        source: null
      })));
      dispatch(boardSaved());
    }
  }, [savedToDB, board]);

  /**
   * Advances cursor after user input
   */
  useEffect(() => {
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
        dispatch(changeInput({ id: currentIndex, value: '', source: socket.id, color: null }));
      }
    } else {
      setDeleteMode(false);

      if (e.key.length === 1 && e.key.match(/[A-Za-z]/)) {
        var virtualKey = document.getElementById(e.key);
        logger.log(virtualKey);
        virtualKey.classList.add("key-pressed");
        window.setTimeout(function() {
          virtualKey.classList.remove("key-pressed");
        }, 300);
        
        if (rebusActive) {
          dispatch(removeCheck({id: focusedSquare }));
          let currentInput = board[focusedSquare].input;
          let newValue = currentInput + e.key.toUpperCase();
          dispatch(changeInput({ color: myColor, id: focusedSquare, value: newValue, source: socket.id, penciled: pencilActive, advanceCursor: true }));
        } else {
          // if letter already in square, go into 'overwrite' mode
          if (board[focusedSquare].input !== "") {
            dispatch(removeCheck({id: focusedSquare }));
            setOverwriteMode(true);
          } else {
            if (overwriteMode) setOverwriteMode(false);
          }
          dispatch(changeInput({ color: myColor, id: focusedSquare, value: e.key.toUpperCase(), source: socket.id, penciled: pencilActive, advanceCursor: true }));
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
      {user && <Fragment>
        {gameId && gameNotFound && <h1>Game {gameId} not found. Games are rotated every week, so this may have been a game from last week.</h1>}
        {!gameNotFound && <div className="App">
          {loaded && <Fragment>
            <TitleBar 
              socket={socket}
              auth={auth}
              gameId={gameId}
              isWidescreen={isWidescreen}
              jumpToSquare={jumpToSquare}
            />
            <NavBar
              socket={socket}
              auth={auth}
              gameId={gameId}
              jumpToSquare={jumpToSquare}
              isWidescreen={isWidescreen}
            />
            <Board
              user={user}
              socket={socket}
              gameId={gameId}
              squareRefs={squareRefs}
            />
            <Clue
              jumpToNextWord={jumpToNextWord}
              jumpToPreviousWord={jumpToPreviousWord}
              isWidescreen={isWidescreen}
              isDesktop={isDesktop} 
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
            </Fragment>
          } 
        </div>}
      </Fragment>
      }
    </div>
  );
}

export default App;
