import { React, memo, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Socket from 'socket.io-client';
import PropTypes from 'prop-types';
import { Auth } from 'firebase/app';
import Button from '@mui/material/Button';
import info from '../images/info.svg';
import pencil from '../images/pencil.svg';
import zoomIn from '../images/zoom-in.svg';
import zoomOut from '../images/zoom-out.svg';
import GameMenu from './GameMenu';
import HintMenu from './HintMenu';
import InfoPage from './InfoPage';
import '../styles/Navbar.css';
import povActions from '../redux/slices/povSlice';
import Logger from '../common/Logger';
import Cursor from '../common/Cursor';

const Navbar = memo(props => {
  const {
    socket,
    auth,
    cursor,
    gameId,
    isWidescreen,
  } = props;
  const logger = new Logger('Navbar');
  logger.log('Render navbar');

  const [open, setOpen] = useState(false);
  const dispatch = useDispatch();
  const {
    zoomActive,
    rebusActive,
    pencilActive,
    'focused.square': focus,
  } = useSelector(state => state.pov);

  function handleClickOpen() {
    setOpen(true);
  }

  const handleClose = useCallback(() => {
    setOpen(false);
  }, []);

  function handleZoom() {
    dispatch(povActions.toggleZoom());
  }

  const handleRebusButtonClick = useCallback(() => {
    dispatch(povActions.toggleRebus());
    cursor.jumpToSquare(focus);
  }, [cursor, dispatch, focus]);

  function handlePencilClick() {
    dispatch(povActions.togglePencil());
    cursor.jumpToSquare(focus);
  }

  return (
    <div className="navbar">
      <GameMenu
        socket={socket}
        auth={auth}
        gameId={gameId}
      />
      {isWidescreen && (
        <Button
          tabIndex={parseInt('-1', 10)}
          className={`rebus ${rebusActive ? 'rebus-active' : ''}`}
          variant="contained"
          onClick={handleRebusButtonClick}
        >
          Rebus
        </Button>
      )}
      {!isWidescreen && (
        <button type="button" className="icon-bg" onClick={handleZoom}>
          <img className="zoom-icon" src={zoomActive ? zoomOut : zoomIn} alt="zoom" />
        </button>
      )}
      <button
        type="button"
        className={`icon-bg ${pencilActive ? 'pencil-active' : ''}`}
        onClick={handlePencilClick}
      >
        <img className="pencil-icon" src={pencil} alt="pencil" />
      </button>
      <HintMenu
        socket={socket}
        auth={auth}
        gameId={gameId}
      />
      <div>
        <button type="button" className="icon-bg" onClick={handleClickOpen}>
          <img className="info-icon" src={info} alt="info" />
        </button>
        <InfoPage
          open={open}
          handleClose={handleClose}
        />
      </div>
    </div>
  );
});

Navbar.propTypes = {
  socket: PropTypes.instanceOf(Socket).isRequired,
  cursor: PropTypes.instanceOf(Cursor).isRequired,
  auth: PropTypes.instanceOf(Auth).isRequired,
  gameId: PropTypes.string.isRequired,
  isWidescreen: PropTypes.bool.isRequired,
};

export default Navbar;
