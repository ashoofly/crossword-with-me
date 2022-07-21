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
import { changeInput, loadGame } from '../redux/slices/gameSlice';
import useAuthenticatedUser from '../hooks/useAuthenticatedUser';

function App() {
  const { id: gameId } = useParams();
  const dispatch = useDispatch();

  const reduxBoardState = useSelector(state => {
    return state.game.board
  });

  const reduxPuzzleState = useSelector(state => {
    return state.puzzle
  });

  const grid = reduxPuzzleState.puzzleGrid;
  const clueDictionary = reduxPuzzleState.clueDictionary;
  const numCols = reduxPuzzleState.numCols;
  const numRows = reduxPuzzleState.numRows;
  const numSquares = numCols * numRows;

  const [auth, setAuth] = React.useState(null);
  const user = useAuthenticatedUser(auth);
  const [socket, setSocket] = React.useState(null);




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
      dispatch(loadGame({ board: game.board }));
    });
    socket.emit('get-game', gameId, numSquares);
  }, [socket, gameId, numSquares]);

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
   * Functions in Board component that other components will call
   */
   const handleKeyDown = React.useRef(null);
   const jumpToSquare = React.useRef(null);
   const toggleOrientation = React.useRef(null);
   const goToNextWord = React.useRef(null);
   const goToPreviousWord = React.useRef(null);

  return (
    <div className="container">
      <div className="App">
        <Navbar
          auth={auth}
          jumpToSquare={() => jumpToSquare.current()}
        />
        <Board
          socket={socket}
          jumpToSquare={jumpToSquare}
          doToggleOrientation={toggleOrientation}
          goToNextWord={goToNextWord}
          goToPreviousWord={goToPreviousWord}
          doHandleKeyDown={handleKeyDown}
        />
        <Clue
          toggleOrientation={() => toggleOrientation.current()}
          goToNextWord={() => goToNextWord.current()}
          goToPrevWord={() => goToPreviousWord.current()}
        />
        <Keyboard
          jumpToSquare={jumpToSquare}
          handleKeyDown={(e) => handleKeyDown.current(e)}
        />
      </div>
    </div>
  );
}

export default App;
