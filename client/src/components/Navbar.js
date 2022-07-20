import React from "react";
import info from '../images/info.svg';
import pencil from '../images/pencil.svg';
import zoomIn from '../images/zoom-in.svg';
import zoomOut from '../images/zoom-out.svg';
import HintMenu from './HintMenu';
import InfoPage from './InfoPage';
import Account from './Account';
import '../styles/common.css';
import "../styles/Navbar.css";

export default function Navbar(props) {

  const { 
    autocheck,
    setAutocheck,
    clearPuzzle,
    checkSquare,
    checkWord,
    checkPuzzle,
    revealSquare,
    revealWord,
    revealPuzzle,
    rebusActive,
    setRebusActive,
    activeWord,
    jumpToSquare,
    pencilActive,
    setPencilActive,
    zoomActive,
    setZoomActive,
    auth
  } = props;

  const [ open, setOpen ] = React.useState(false);

  function handleClickOpen() {
    setOpen(true);
  }

  function handleClose() {
    setOpen(false);
  }

  function handleZoom() {
    setZoomActive( prevState => !prevState);
  }

  function handleRebusButtonClick() {
    setRebusActive(prevState => !prevState);
    jumpToSquare(activeWord.focus);
  }

  function isRebusButtonDisabled() {
    return rebusActive;
  }

  function handlePencilClick() {
    setPencilActive(prevState => !prevState);
    jumpToSquare(activeWord.focus);
  }

  return (
    <div className="navbar">
      <Account 
        auth={auth} />
      <h1>Crossword with Friends</h1>
      {/* <Button className={`rebus-button ${rebusActive ? "rebus-active": ''}`} variant="contained" onClick={handleRebusButtonClick} disabled={isRebusButtonDisabled()}>Rebus</Button> */}
      {/* TODO: display zoom only for mobile. */}
      <div className="icon-bg">
        <img className="zoom-icon" src={zoomActive ? zoomOut : zoomIn} alt="zoom" onClick={handleZoom} />
      </div>
      <div className={`icon-bg ${pencilActive ? "pencil-active": ''}`}>
        <img className={`pencil-icon`} src={pencil} alt="pencil" onClick={handlePencilClick} />
      </div>
      <HintMenu 
        autocheck={autocheck}
        setAutocheck={setAutocheck} 
        clearPuzzle={clearPuzzle}
        checkSquare={checkSquare}
        checkWord={checkWord}
        checkPuzzle={checkPuzzle}
        revealSquare={revealSquare}
        revealWord={revealWord}
        revealPuzzle={revealPuzzle}
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