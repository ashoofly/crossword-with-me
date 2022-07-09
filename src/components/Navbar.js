import React from "react";
import info from '../images/info.svg';
import HintMenu from './HintMenu';
import InfoPage from './InfoPage';
import Button from '@mui/material/Button';
import '../styles/App.css';
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
    jumpToSquare
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

  return (
    <div className="navbar">
      <h1>Crossword with Friends</h1>
      <Button className={`rebus-button ${rebusActive ? "rebus-active": ''}`} variant="contained" onClick={handleRebusButtonClick} disabled={isRebusButtonDisabled()}>Rebus</Button>
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
      <img className="info" src={info} alt="info" onClick={handleClickOpen} />
      <InfoPage
        open={open}
        handleClose={handleClose}
      />
    </div>
  )
}