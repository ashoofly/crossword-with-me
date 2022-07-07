import React from "react";
import './styles.css';
import info from './images/info.svg';
import HintMenu from './HintMenu';

export default function Navbar(props) {

  const { 
    autocheck,
    setAutocheck,
    clearPuzzle
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
      />
      <img className="info" src={info} alt="info" />

    </div>
  )
}