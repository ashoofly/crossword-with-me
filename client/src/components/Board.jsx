import { React, useEffect, memo, useMemo, RefObject } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Socket from 'socket.io-client';
import PropTypes from 'prop-types';
import { User } from 'firebase/auth';
import Square from './Square';
import '../styles/colors.css';
import '../styles/Board.css';
import gameActions from '../redux/slices/gameSlice';
import Logger from '../utils/Logger';

const Board = memo(props => {
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
  const logger = useMemo(() => new Logger('Board'), []);
  logger.log('Rendering Board component.');

  useEffect(() => {
    document.documentElement.style.setProperty('--numRows', numRows);
  }, [numRows]);

  useEffect(() => {
    document.documentElement.style.setProperty('--numCols', numCols);
  }, [numCols]);

  useEffect(() => {
    if (socket === null || !gameId || Object.keys(focused).length === 0) return;
    dispatch(gameActions.updatePlayerFocus({
      playerId: user.uid,
      gameId,
      currentFocus: focused,
    }));
    logger.log(`Send event: update-player-focus - socket ${socket.id}`);
    socket.emit('update-player-focus', user.uid, gameId, focused);
  }, [user, gameId, focused, socket, dispatch, logger]);

  const squares = gameGrid.map((square, index) => (
    <Square
      key={square.id}
      id={square.id}
      user={user}
      squareRef={squareRefs[index]}
      socket={socket}
    />
  ));

  return (
    <div className="Board">
      {squares}
    </div>
  );
});

Board.propTypes = {
  socket: PropTypes.instanceOf(Socket).isRequired,
  user: PropTypes.instanceOf(User).isRequired,
  gameId: PropTypes.instanceOf(String).isRequired,
  squareRefs: PropTypes.arrayOf(RefObject).isRequired,
};

export default Board;
