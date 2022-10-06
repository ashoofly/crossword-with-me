import { memo, useState, Fragment } from "react";
import info from '../images/info.svg';
import pencil from '../images/pencil.svg';
import zoomIn from '../images/zoom-in.svg';
import zoomOut from '../images/zoom-out.svg';
import GameMenu from './GameMenu';
import HintMenu from './HintMenu';
import InfoPage from './InfoPage';
import Button from '@mui/material/Button';
import "../styles/Navbar.css";
import { useDispatch, useSelector } from 'react-redux';
import { toggleZoom, toggleRebus, togglePencil } from '../redux/slices/povSlice';
import Logger from '../utils/Logger';


export default memo((props) => {
  // console.log("Render navbar");
  const { 
    socket,
    auth,
    jumpToSquare,
    gameId,
    isWidescreen
  } = props;
  const logger = new Logger("Navbar");

  const [ open, setOpen ] = useState(false);
  const dispatch = useDispatch();
  const pov = useSelector(state => {
    return state.pov
  });
  const zoomActive = pov.zoomActive;
  const rebusActive = pov.rebusActive;
  const pencilActive = pov.pencilActive;
  const focus = pov.focused.square;

  function handleClickOpen() {
    setOpen(true);
  }

  function handleClose() {
    setOpen(false);
  }

  function handleZoom() {
    dispatch(toggleZoom());
  }

  function handleRebusButtonClick() {
    dispatch(toggleRebus());
    jumpToSquare(focus);
  }

  function handlePencilClick() {
    dispatch(togglePencil());
    jumpToSquare(focus);
  }

  return (
      <div className="navbar">
        <GameMenu 
          socket={socket}
          auth={auth}
          gameId={gameId}
        />
        {isWidescreen && <Button 
          tabIndex={parseInt("-1")} 
          className={`rebus ${rebusActive ? "rebus-active": ''}`} 
          variant="contained" 
          onClick={handleRebusButtonClick}>
            Rebus
        </Button>}
        {!isWidescreen && <div className="icon-bg">
          <img className="zoom-icon" src={zoomActive ? zoomOut : zoomIn} alt="zoom" onClick={handleZoom} />
        </div>}
        <div className={`icon-bg ${pencilActive ? "pencil-active": ''}`}>
          <img className={`pencil-icon`} src={pencil} alt="pencil" onClick={handlePencilClick} />
        </div>
        <HintMenu 
          socket={socket}
          auth={auth}
          gameId={gameId}
        />
        <div>
          <div className="icon-bg">
            <img className="info-icon" src={info} alt="info" onClick={handleClickOpen} />
          </div>
          <InfoPage
            open={open}
            handleClose={handleClose}
          />
        </div>
      </div>
  )
});