import { useEffect, memo } from "react";
import Square from "./Square";
import '../styles/common.css';
import "../styles/Board.css";
import { useDispatch, useSelector } from 'react-redux';
import {
  updatePlayerFocus
} from '../redux/slices/gameSlice.js'
import Logger from '../utils/logger';

export default memo((props) => {
  // logger.log("Rendering Board component.");

  const {
    socket,
    user,
    gameId,
    squareRefs,
  } = props;

  const dispatch = useDispatch();
  const gameGrid = useSelector(state => state.game.gameGrid);
  const numRows = useSelector(state => state.game.numRows);
  const numCols = useSelector(state => state.game.numCols);
  const focused = useSelector(state => state.pov.focused);
  const logger = new Logger("Board");

  document.documentElement.style.setProperty("--numRows", numRows);
  document.documentElement.style.setProperty("--numCols", numCols);

  useEffect(() => {
    if (socket === null || !gameId || Object.keys(focused).length === 0) return;
    dispatch(updatePlayerFocus({playerId: user.uid, gameId: gameId, currentFocus: focused}));
    logger.log(`Sending send-player-cursor-change event through socket ${socket.id}`)
    socket.emit('send-player-cursor-change', user.uid, gameId, focused);

  }, [user, gameId, focused]);

  const squares = gameGrid.map((square, index) => {
    return (
      <Square key={square.id}
        {...square}
        gameId={gameId}
        user={user}
        squareRef={squareRefs[index]}
        socket={socket}
      />
    )
  });
  
  return (
    <div className="Board">
      {squares}
    </div>
  )
});