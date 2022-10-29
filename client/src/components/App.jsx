import { React, useState, useEffect, useCallback, createRef, Fragment, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useMediaQuery } from 'react-responsive';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import PropTypes from 'prop-types';
import useAuthenticatedUser from '../hooks/useAuthenticatedUser';
import TitleBar from './TitleBar';
import Navbar from './Navbar';
import Board from './Board';
import Clue from './Clue';
import Keyboard from './Keyboard';
import SignIn from './SignIn';
import '../styles/App.css';
import { gameActions } from '../redux/slices/gameSlice';
import { povActions } from '../redux/slices/povSlice';
import Logger from '../common/Logger';
import { setAppLayout, setBoardLayout, debouncedSaveBoard } from '../utils/render';
import Cursor from '../common/Cursor';

function App(props) {
  const {
    socket,
    auth,
  } = props;

  const [loggers, setLoggers] = useState(null);
  const [user, initialized] = useAuthenticatedUser(auth);
  const dispatch = useDispatch();

  /* Routing */
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  /* Game State */
  const [gameNotFound, setGameNotFound] = useState(false);
  const game = useSelector(state => state.game);
  const {
    gameId: loadedGameId,
    numCols,
    numRows,
    players,
    loaded,
    savedBoardToDB,
    board,
    autocheck,
    advanceCursor,
    mostRecentAction } = game;
  const [squareRefs, setSquareRefs] = useState(Array(numRows * numCols)
    .fill(0).map(() => createRef()));
  const [cursor, setCursor] = useState(null);
  const [puzzleDates, setPuzzleDates] = useState(null);

  /* Player State */
  const pov = useSelector(state => state.pov);
  const zoomActive = useSelector(state => state.pov.zoomActive);
  const playerVerified = useSelector(state => state.pov.playerVerified);
  const rebusActive = useSelector(state => state.pov.rebusActive);
  const pencilActive = useSelector(state => state.pov.pencilActive);
  const focusedSquare = useSelector(state => state.pov.focused.square);
  const focusedWord = useSelector(state => state.pov.focused.word);
  const orientation = useSelector(state => state.pov.focused.orientation);
  const [deleteMode, setDeleteMode] = useState(false);
  const [overwriteMode, setOverwriteMode] = useState(false);

  /* Display */
  const [openToast, setOpenToast] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [myColor, setMyColor] = useState(null);

  /* Responsive Layout */
  const isWidescreen = useMediaQuery({ query: '(min-width: 1000px)' });
  const isTouchDevice = 'ontouchstart' in window;

  if (loggers) {
    const { renderLogger } = loggers;
    renderLogger.log('App');
  }

  /**
   * Set up loggers
   */
  useEffect(() => {
    setLoggers({
      renderLogger: new Logger('Render'),
      socketLogger: new Logger('Socket'),
      focusLogger: new Logger('Focus'),
      errorLogger: new Logger('Error'),
      debugLogger: new Logger('Debug'),
    });
  }, []);

  /**
   * Set app layout upon initial render and when resizing window
   */
  useEffect(() => {
    setAppLayout(window, isWidescreen);
    const boundFunc = setAppLayout.bind(null, window, isWidescreen);
    window.addEventListener('resize', boundFunc);
    return () => {
      window.removeEventListener('resize', boundFunc);
    };
  }, [isWidescreen]);

  /**
   * Set square refs when board dimensions change
   */
  useEffect(() => {
    setSquareRefs(Array(numRows * numCols).fill(0).map(() => createRef()));
  }, [numRows, numCols]);

  /**
   * Set board layout whenever new game is loaded and when resizing window
   */
  useEffect(() => {
    setBoardLayout(window, isWidescreen, numCols, numRows, zoomActive);
    const boundFunc = setBoardLayout.bind(null, window, isWidescreen, numCols, numRows, zoomActive);
    window.addEventListener('resize', boundFunc);
    return () => {
      window.removeEventListener('resize', boundFunc);
    };
  }, [isWidescreen, loadedGameId, numCols, numRows, zoomActive]);

  /**
   * Set board layout whenever zoom is toggled
   */
  useEffect(() => {
    setBoardLayout(window, isWidescreen, numCols, numRows, zoomActive);
  }, [isWidescreen, numCols, numRows, zoomActive]);

  /**
   * Initialize cursor for game
   */
  useEffect(() => {
    setCursor(new Cursor(squareRefs, dispatch));
  }, [squareRefs, dispatch]);

  /**
   * After user is authenticated and player is verified,
   * handle direct request for specific game,
   * or get default game if no game ID specified.
   */
  useEffect(() => {
    if (socket === null || !initialized || !playerVerified || !loggers) return;
    const { socketLogger } = loggers;

    socketLogger.log(`Send event: get-team-games for user: ${user.uid}`);
    socket.emit('get-team-games', user.uid);

    socketLogger.log('Send event: get-puzzle-dates');
    socket.emit('get-puzzle-dates');

    const requestedGameId = searchParams.get('gameId');
    if (!requestedGameId) {
      if (user) {
        socketLogger.log(`Send event: get-default-game - user: ${user.uid}`);
        socket.emit('get-default-game', user.uid);
      }
    } else if (requestedGameId !== loadedGameId) {
      if (user) {
        socketLogger.log(`Send event: get-game-by-id with ${user.uid} for ${requestedGameId}`);
        socket.emit('get-game-by-id', requestedGameId, user.uid);
      } else {
        navigate(`/join-game?gameId=${requestedGameId}`);
      }
    }
  // 'loadedGameId' and 'searchParams' should not be included in dep array,
  // b/c this would cause infinite loop:
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, user, playerVerified, initialized, searchParams, loggers, navigate]);

  /**
   * Set up app-level socket listeners after socket or authenticated user changes
   */
  useEffect(() => {
    if (!user || socket === null || !loggers) return;

    const { socketLogger } = loggers;

    function handleLoadPuzzleDates(loadedPuzzleDates) {
      setPuzzleDates(loadedPuzzleDates);
    }

    function handleLoadTeamGame(returnedGames) {
      socketLogger.log('Received load-team-games');
      if (returnedGames) {
        dispatch(povActions.setTeamGames({ teamGames: returnedGames }));
      }
    }

    function handleLoadGame(loadedGame) {
      dispatch(gameActions.loadGame({ ...loadedGame, loaded: true }));
      socketLogger.log(`Received game ${loadedGame.gameId} from server. Loading..`);
      setGameNotFound(false);

      dispatch(povActions.initializePlayerView({
        numRows: loadedGame.numRows,
        numCols: loadedGame.numCols,
        gameGrid: loadedGame.gameGrid,
        focus: loadedGame.clueDictionary.across[1].index,
      }));
      setSearchParams({ gameId: loadedGame.gameId });
    }

    function handleGameNotFound() {
      setGameNotFound(true);
    }

    function handlePlayerVerified(playerId) {
      socketLogger.log(`Received player-exists event for ${playerId}`);
      if (user.uid === playerId) {
        dispatch(povActions.playerVerified({ playerVerified: true }));
      }
    }

    function handlePlayerNotFound(playerId) {
      socketLogger.log(`Received player-not-found event for ${playerId}`);
      if (user.uid === playerId) {
        dispatch(povActions.playerVerified({ playerVerified: false }));
      }
    }
    socket.on('load-puzzle-dates', handleLoadPuzzleDates);
    socket.on('load-team-games', handleLoadTeamGame);
    socket.on('load-game', handleLoadGame);
    socket.on('game-not-found', handleGameNotFound);
    socket.on('player-exists', handlePlayerVerified);
    socket.on('player-not-found', handlePlayerNotFound);

    if (user && !playerVerified) {
      socketLogger.log(`Send verify-player-exists event for ${user.uid}`);
      socket.emit('verify-player-exists', user.uid);
    }

    // eslint-disable-next-line consistent-return
    return function cleanup() {
      socket.off('load-team-games', handleLoadTeamGame);
      socket.off('load-game', handleLoadGame);
      socket.off('game-not-found', handleGameNotFound);
      socket.off('player-exists', handlePlayerVerified);
      socket.off('player-not-found', handlePlayerNotFound);
    };
  }, [dispatch, loggers, playerVerified, setSearchParams, socket, user]);

  /**
   * Set up game-level socket listeners after
   * socket is initialized, user is authenticated, and specific game is loaded
   */
  useEffect(() => {
    if (!user || socket === null || !game || !loggers) return;

    const { socketLogger } = loggers;

    function handleReceiveChanges(wrappedAction) {
      if (wrappedAction.source === socket.id) return;
      if (wrappedAction.gameId !== loadedGameId) return;
      socketLogger.log(`[${socket.id}] Received external change for ${wrappedAction.gameId} from other client ${wrappedAction.source}, updating Redux state.`);
      try {
        dispatch(gameActions[wrappedAction.type]({ ...wrappedAction.payload, source: 'external' }));
      } catch (error) {
        socketLogger.log(error);
      }
    }

    function handlePlayerAddedToGame(player, gameId) {
      socketLogger.log(`Received player-added-to-game event: ${player.playerId} for ${gameId}`);
      dispatch(gameActions.addPlayerToGame({ player, gameId }));
    }

    function handlePlayerOnline(playerId, displayName, serverGameId) {
      socketLogger.log(`Received player-online event: Player ${playerId} signed into game ${serverGameId}!`);
      dispatch(gameActions.enteringPlayer({ playerId, gameId: serverGameId }));
      if (user && (playerId !== user.uid) && (serverGameId === loadedGameId)) {
        const firstName = displayName.split(' ')[0];
        setToastMessage(`${firstName} has entered the game!`);
        setOpenToast(true);
      }
    }

    function handlePlayerOffline(playerId, serverGameId) {
      socketLogger.log(`Player ${playerId} signed out of game ${serverGameId}`);
      dispatch(gameActions.exitingPlayer({ playerId, gameId: serverGameId }));
    }

    function handleLoadPlayerCursorChange(socketId, playerId, serverGameId, currentFocus) {
      if (socketId !== socket.id) {
        socketLogger.log(`Received update-player-focus from ${playerId}`);
        dispatch(gameActions.updatePlayerFocus({ playerId, gameId: serverGameId, currentFocus, source: 'external' }));
      }
    }

    socket.on('receive-changes', handleReceiveChanges);
    socket.on('player-added-to-game', handlePlayerAddedToGame);
    socket.on('player-online', handlePlayerOnline);
    socket.on('player-offline', handlePlayerOffline);
    socket.on('update-player-focus', handleLoadPlayerCursorChange);

    // eslint-disable-next-line consistent-return
    return function cleanup() {
      socket.off('receive-changes', handleReceiveChanges);
      socket.off('player-added-to-game', handlePlayerAddedToGame);
      socket.off('player-online', handlePlayerOnline);
      socket.off('player-offline', handlePlayerOffline);
      socket.off('update-player-focus', handleLoadPlayerCursorChange);
    };
  }, [dispatch, game, loadedGameId, loggers, socket, user]);

  /**
   * Set player game color for specific game
   */
  useEffect(() => {
    if (!user) return;
    const me = players.find(player => player.playerId === user.uid);
    if (me) {
      setMyColor(me.color);
    }
  }, [user, players]);

  /**
   * Send state updates through socket to other clients
   */
  useEffect(() => {
    if (!mostRecentAction || mostRecentAction.initial || socket === null || !loggers) return;
    const { socketLogger } = loggers;

    socketLogger.log(`Send event: send-changes for ${mostRecentAction.type}`);
    socket.emit('send-changes', {
      source: socket.id,
      gameId: mostRecentAction.gameId,
      type: mostRecentAction.type,
      payload: mostRecentAction.payload,
    });
  }, [loggers, mostRecentAction, socket]);

  /**
   * Saves board to DB on current player changes
   */
  useEffect(() => {
    if (socket === null || !loggers) return;
    const { socketLogger } = loggers;

    if (!savedBoardToDB) {
      debouncedSaveBoard(
        socketLogger,
        socket,
        loadedGameId,
        board,
        autocheck,
        dispatch,
        gameActions
      );
    }
  }, [savedBoardToDB, board, players, socket, loggers, loadedGameId, dispatch, autocheck]);

  /**
   * Board navigation
   */
  const goToNextSquareAfterInput = useCallback(() => {
    if (!deleteMode && !rebusActive) {
      const index = cursor.getNextEmptySquare(game, pov, focusedSquare, overwriteMode);
      cursor.jumpToSquare(game, index, zoomActive, orientation);
    }
  }, [cursor, deleteMode, focusedSquare, game, orientation, overwriteMode,
    pov, rebusActive, zoomActive]);

  useEffect(() => {
    if (advanceCursor > 0) {
      goToNextSquareAfterInput();
    }
  // Including the function 'goToNextSquareAfterInput()' as a dependency results in infinite loop
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [advanceCursor]);

  const handleKeyDown = useCallback(e => {
    e.preventDefault();
    if (e.key === ' ') {
      dispatch(povActions.toggleOrientation());
    } else if (e.key === 'Tab' || (e.shiftKey && e.key === 'ArrowRight')) {
      cursor.jumpToNextWord(game, pov, focusedSquare);
    } else if (e.shiftKey && e.key === 'ArrowLeft') {
      cursor.jumpToPreviousWord(game, pov, focusedSquare);
    } else if (rebusActive && e.key === 'Enter') {
      dispatch(povActions.toggleRebus());
    } else if (e.key === 'Backspace') {
      setDeleteMode(true);
      let currentIndex = focusedSquare;
      if (board[focusedSquare].input === '' || board[focusedSquare].verified) {
        // if user input already empty, backspace to previous letter
        currentIndex = cursor.backspace(game, pov);
      }
      if (!board[currentIndex].verified) {
        dispatch(gameActions.changeInput({ gameId: loadedGameId, id: currentIndex, value: '', color: null }));
      }
    } else {
      setDeleteMode(false);
      if (e.key.length === 1 && e.key.match(/[A-Za-z]/)) {
        if (board[focusedSquare].verified) {
          goToNextSquareAfterInput();
        } else if (rebusActive) {
          const currentInput = board[focusedSquare].input;
          const newValue = currentInput + e.key.toUpperCase();
          dispatch(gameActions.changeInput({
            gameId: loadedGameId,
            color: myColor,
            id: focusedSquare,
            value: newValue,
            penciled: pencilActive,
            advanceCursor: true,
          }));
        } else {
          // if letter already in square, go into 'overwrite' mode
          if (board[focusedSquare].input !== '') {
            setOverwriteMode(true);
          } else if (overwriteMode) {
            setOverwriteMode(false);
          }
          dispatch(gameActions.changeInput({
            gameId: loadedGameId,
            color: myColor,
            id: focusedSquare,
            value: e.key.toUpperCase(),
            penciled: pencilActive,
            advanceCursor: true }));
        }
      }
    }
  }, [board, focusedSquare, rebusActive, dispatch, cursor, orientation,
    goToNextSquareAfterInput, game, pov, loadedGameId, myColor, pencilActive, overwriteMode]);

  return (
    // This <div> contains descendant interactive elements such as <Square> and <Keyboard>:
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    <div className="container" onKeyDown={handleKeyDown}>
      { /* Login page if not signed in */ }
      {initialized && !user && <SignIn auth={auth} socket={socket} />}

      { /* Loading page */ }
      {user && !playerVerified && (
        <div className="loading">
          <h1>Loading...</h1>
        </div>
      )}

      {user && playerVerified && (
        <>
          { /* Game not found page */ }
          {searchParams.get('gameId') && gameNotFound && (
            <div className="textbox-container">
              <div className="game-not-found">
                <p>
                  { 'Game ' }
                  <b style={{ color: '#93A1A1' }}>{searchParams.get('gameId')}</b>
                  { ' not found. ' }
                </p>
                <small>
                  Games are rotated every week, so this may have been a game from last week.
                </small>
                <p>
                  <small>
                    { ' <-- Go back ' }
                    <b>
                      <a href="/">Home</a>
                    </b>
                  </small>
                </p>
              </div>
            </div>
          )}
          { /* Game loaded page */ }
          {!gameNotFound && loaded && (
            <div className="App">
              <TitleBar
                socket={socket}
                auth={auth}
                gameId={loadedGameId}
                isWidescreen={isWidescreen}
                cursor={cursor}
                loggers={loggers}
              />
              <Navbar
                socket={socket}
                auth={auth}
                gameId={loadedGameId}
                isWidescreen={isWidescreen}
                cursor={cursor}
                loggers={loggers}
                puzzleDates={puzzleDates}
              />
              <Board
                user={user}
                socket={socket}
                gameId={loadedGameId}
                squareRefs={squareRefs}
                loggers={loggers}
              />
              <Clue
                isWidescreen={isWidescreen}
                handleKeyDown={handleKeyDown}
                cursor={cursor}
                loggers={loggers}
              />
              {isTouchDevice && (
                <Keyboard
                  handleKeyDown={handleKeyDown}
                  cursor={cursor}
                  loggers={loggers}
                />
              )}
              { /* Notification when player enters the game */ }
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
            </div>
          )}
        </>
      )}
    </div>
  );
}

App.propTypes = {
  socket: PropTypes.object.isRequired,
  auth: PropTypes.object.isRequired,
};

export default App;
