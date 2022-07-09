import React from "react";
import info from '../images/info.svg';
import HintMenu from './HintMenu';
import InfoPage from './InfoPage';
import Button from '@mui/material/Button';
import './App.css';
import "./Navbar.css";

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
  // const [ rebusIndex, setRebusIndex ] = React.useState(-1);

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
    // if (rebusIndex !== activeWord.focus) {
    //   console.log(`Setting reebus active to: ${!rebusActive} and index to ${activeWord.focus}`);
    //   setRebusActive(prevState => !prevState);
    //   setRebusIndex(activeWord.focus);
    //   jumpToSquare(activeWord.focus);
    // } else {
    //   // else, the blur event from active square will have already reset the rebusActive state to false
    //   console.log("Same rebus index as before. Resetting index")
    //   setRebusIndex(-1);
    // }
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