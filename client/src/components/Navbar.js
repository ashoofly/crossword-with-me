import React from "react";
import info from '../images/info.svg';
import pencil from '../images/pencil.svg';
import zoomIn from '../images/zoom-in.svg';
import zoomOut from '../images/zoom-out.svg';
import HintMenu from './HintMenu';
import InfoPage from './InfoPage';
import Account from './Account';
import Button from '@mui/material/Button';
import '../styles/common.css';
import "../styles/Navbar.css";
import { useDispatch, useSelector } from 'react-redux';
import { toggleZoom, toggleRebus, togglePencil } from '../redux/slices/playerSlice';


export default function Navbar(props) {

  const { 
    auth,
    jumpToSquare
  } = props;

  const [ open, setOpen ] = React.useState(false);
  const dispatch = useDispatch();
  const reduxPlayerState = useSelector(state => {
    return state.player
  });
  const zoomActive = reduxPlayerState.zoomActive;
  const rebusActive = reduxPlayerState.rebusActive;
  const pencilActive = reduxPlayerState.pencilActive;
  const activeWord = reduxPlayerState.activeWord;

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
    dispatch(toggleRebus({id: activeWord.focus}));
    jumpToSquare(activeWord.focus);
  }

  function isRebusButtonDisabled() {
    return rebusActive;
  }

  function handlePencilClick() {
    dispatch(togglePencil());
    jumpToSquare(activeWord.focus);
  }

  return (
    <div className="navbar">
      <Account 
        auth={auth} />
      <h1>Crossword with Friends</h1>
      {/* TODO: display only for desktop. */}
      <Button className={`rebus-button ${rebusActive ? "rebus-active": ''}`} variant="contained" onClick={handleRebusButtonClick} disabled={isRebusButtonDisabled()}>Rebus</Button>
      {/* TODO: display zoom only for mobile. */}
      <div className="icon-bg">
        <img className="zoom-icon" src={zoomActive ? zoomOut : zoomIn} alt="zoom" onClick={handleZoom} />
      </div>
      <div className={`icon-bg ${pencilActive ? "pencil-active": ''}`}>
        <img className={`pencil-icon`} src={pencil} alt="pencil" onClick={handlePencilClick} />
      </div>
      <HintMenu 
      />
      <div className="icon-bg">
        <img className="info-icon" src={info} alt="info" onClick={handleClickOpen} />
      </div>
      <InfoPage
        open={open}
        handleClose={handleClose}
      />
    </div>
  )
}