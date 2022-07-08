import React from "react";
import './styles.css';
import info from './images/info.svg';
import HintMenu from './HintMenu';
import InfoPage from './InfoPage';

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
    revealPuzzle
  } = props;

  const [ open, setOpen ] = React.useState(false);

  function handleClickOpen() {
    setOpen(true);
  }

  function handleClose() {
    setOpen(false);
  }

  return (
    <div className="navbar">
      <h1>Crossword with Friends</h1>
      <div className="rebus-button">REBUS</div>
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