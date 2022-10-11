import { React, useEffect, memo, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import Square from './Square';
import '../styles/colors.css';
import '../styles/Board.css';
import { gameActions } from '../redux/slices/gameSlice';
import Logger from '../common/Logger';

const Board = memo(props => {
  const {
    socket,
    user,
    gameId,
    squareRefs,
    loggers,
  } = props;

  const dispatch = useDispatch();
  const gameGrid = useSelector(state => state.game.gameGrid);
  const numRows = useSelector(state => state.game.numRows);
  const numCols = useSelector(state => state.game.numCols);
  const focused = useSelector(state => state.pov.focused);

  if (loggers) {
    const { renderLogger } = loggers;
    renderLogger.log('Board');
  }

  useEffect(() => {
    document.documentElement.style.setProperty('--numRows', numRows);
  }, [numRows]);

  useEffect(() => {
    document.documentElement.style.setProperty('--numCols', numCols);
  }, [numCols]);

  useEffect(() => {
    if (socket === null || !gameId || Object.keys(focused).length === 0 || !loggers) return;
    const { socketLogger } = loggers;

    dispatch(gameActions.updatePlayerFocus({
      playerId: user.uid,
      gameId,
      currentFocus: focused,
    }));

    socketLogger.log(`Send event: update-player-focus - socket ${socket.id}`);
    socket.emit('update-player-focus', user.uid, gameId, focused);

  }, [user, gameId, focused, socket, dispatch, loggers]);

  const squares = gameGrid.map((square, index) => (
    <Square
      key={square.id}
      id={square.id}
      squareRef={squareRefs[index]}
      loggers={loggers}
    />
  ));

  return (
    <div className="Board">
      {squares}
    </div>
  );
});

Board.propTypes = {
  socket: PropTypes.object.isRequired,
  user: PropTypes.object.isRequired,
  gameId: PropTypes.string.isRequired,
  squareRefs: PropTypes.arrayOf(PropTypes.object).isRequired,
  loggers: PropTypes.object.isRequired,
};

export default Board;
