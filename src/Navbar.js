import React from "react";
import './styles.css';
import info from './images/info.svg';
import HintMenu from './HintMenu';

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

  return (
    <div className="navbar">
      <h1>Crossword with Friends</h1>
      {/* <p>{nyt.title}</p>
      <p>Author: {nyt.author}</p>
      <p>Ed: {nyt.editor}</p>
      <small>	&copy; {nyt.copyright}</small> */}
      <div className="rebus-button">REBUS</div>
      {/* <img onClick={toggleAnswers} className="check-puzzle" src={lifebuoy} alt="check_puzzle" /> */}
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
      <img className="info" src={info} alt="info" />

    </div>
  )
}