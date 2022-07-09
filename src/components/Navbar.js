import React from "react";
import info from '../images/info.svg';
import pencil from '../images/pencil.svg';
import HintMenu from './HintMenu';
import InfoPage from './InfoPage';
import Button from '@mui/material/Button';
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
    setPencilActive
  } = props;

  const [ open, setOpen ] = React.useState(false);

  function handleClickOpen() {
    setOpen(true);
  }

  function handleClose() {
    setOpen(false);
  }

  function handleRebusButtonClick() {
    console.log(`Rebus active: ${rebusActive}`);
    setRebusActive(prevState => !prevState);
    jumpToSquare(activeWord.focus);
  }

  function isRebusButtonDisabled() {
    return rebusActive;
  }

  function handlePencilClick() {
    console.log("setting pencil state");
    setPencilActive(prevState => !prevState);
    jumpToSquare(activeWord.focus);
  }

  return (
    <div className="navbar">
      <h1>Crossword with Friends</h1>
      <Button className={`rebus-button ${rebusActive ? "rebus-active": ''}`} variant="contained" onClick={handleRebusButtonClick} disabled={isRebusButtonDisabled()}>Rebus</Button>
      <img className={`pencil-icon ${pencilActive ? "pencil-active": ''}`} src={pencil} alt="pencil" onClick={handlePencilClick} />
      <HintMenu className="hint-icon"
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
      <img className="info-icon" src={info} alt="info" onClick={handleClickOpen} />
      <InfoPage
        open={open}
        handleClose={handleClose}
      />
    </div>
  )
}