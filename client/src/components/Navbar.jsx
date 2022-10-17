import { React, memo, useState, useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import Button from '@mui/material/Button';
import info from '../images/info.svg';
import pencil from '../images/pencil.svg';
import zoomIn from '../images/zoom-in.svg';
import zoomOut from '../images/zoom-out.svg';
import GameMenu from './GameMenu';
import HintMenu from './HintMenu';
import InfoPage from './InfoPage';
import '../styles/Navbar.css';
import { povActions } from '../redux/slices/povSlice';
import Logger from '../common/Logger';
import Cursor from '../common/Cursor';

const Navbar = memo(props => {
  const {
    socket,
    auth,
    cursor,
    gameId,
    isWidescreen,
    loggers,
    puzzleDates,
  } = props;

  const [open, setOpen] = useState(false);
  const dispatch = useDispatch();
  const {
    zoomActive,
    rebusActive,
    pencilActive,
    focused,
  } = useSelector(state => state.pov);
  const { orientation, square: focus } = focused;

  if (loggers) {
    const { renderLogger } = loggers;
    renderLogger.log('Navbar');
  }

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
    cursor.jumpToSquare(focus, zoomActive, orientation);
  }, [cursor, dispatch, focus, orientation, zoomActive]);

  function handlePencilClick() {
    dispatch(povActions.togglePencil());
    cursor.jumpToSquare(focus, zoomActive, orientation);
  }

  return (
    <div className="navbar">
      <GameMenu
        socket={socket}
        auth={auth}
        gameId={gameId}
        loggers={loggers}
        puzzleDates={puzzleDates}
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
        loggers={loggers}
      />
      <button type="button" className="icon-bg" onClick={handleClickOpen}>
        <img className="info-icon" src={info} alt="info" />
      </button>
      <InfoPage
        open={open}
        handleClose={handleClose}
        loggers={loggers}
      />
    </div>
  );
});

Navbar.propTypes = {
  socket: PropTypes.object.isRequired,
  cursor: PropTypes.instanceOf(Cursor).isRequired,
  auth: PropTypes.object.isRequired,
  gameId: PropTypes.string.isRequired,
  isWidescreen: PropTypes.bool.isRequired,
  loggers: PropTypes.object.isRequired,
  puzzleDates: PropTypes.object.isRequired,
};

export default Navbar;
