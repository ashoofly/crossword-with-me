import { memo, useState, Fragment } from "react";
import info from '../images/info.svg';
import pencil from '../images/pencil.svg';
import zoomIn from '../images/zoom-in.svg';
import zoomOut from '../images/zoom-out.svg';
import GameMenu from './GameMenu';
import HintMenu from './HintMenu';
import InfoPage from './InfoPage';
import PlayerBox from './PlayerBox';
import Button from '@mui/material/Button';
import '../styles/common.css';
import "../styles/Navbar.css";
import { useDispatch, useSelector } from 'react-redux';
import { toggleZoom, toggleRebus, togglePencil } from '../redux/slices/povSlice';


export default memo((props) => {
  // console.log("Render navbar");
  const { 
    socket,
    auth,
    jumpToSquare,
    gameId
  } = props;

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
    <Fragment>
      <div className="title-bar">
        <GameMenu 
          socket={socket}
          auth={auth}
          gameId={gameId}
        />
        <h1>Crossword with Friends</h1>
        <PlayerBox 
          auth={auth}
          socket={socket}
          gameId={gameId}
        />
      </div>
      <div className="navbar">


        {/* <h1>Crossword with Friends</h1> */}
        {/* TODO: display only for desktop. */}
        <Button 
          tabIndex={parseInt("-1")} 
          className={`rebus ${rebusActive ? "rebus-active": ''}`} 
          variant="contained" 
          onClick={handleRebusButtonClick}>
            Rebus
        </Button>
        {/* TODO: display zoom only for mobile. */}
        <div className="icon-bg">
          <img className="zoom-icon" src={zoomActive ? zoomOut : zoomIn} alt="zoom" onClick={handleZoom} />
        </div>
        <div className={`icon-bg ${pencilActive ? "pencil-active": ''}`}>
          <img className={`pencil-icon`} src={pencil} alt="pencil" onClick={handlePencilClick} />
        </div>
        <HintMenu 
          socket={socket}
          auth={auth}
          gameId={gameId}
        />
        <div className="icon-bg">
          <img className="info-icon" src={info} alt="info" onClick={handleClickOpen} />
        </div>
        <InfoPage
          open={open}
          handleClose={handleClose}
        />
      </div>
    </Fragment>

  )
});