import React from "react";
import './styles.css';
import lifebuoy from './images/life-buoy.svg';

export default function Navbar(props) {

  const { toggleAnswers } = props;

  return (
    <div className="navbar">
      <h1>Crossword with Friends</h1>
      {/* <p>{nyt.title}</p>
      <p>Author: {nyt.author}</p>
      <p>Ed: {nyt.editor}</p>
      <small>	&copy; {nyt.copyright}</small> */}
      <img onClick={toggleAnswers} className="check-puzzle" src={lifebuoy} alt="check_puzzle" />
    </div>
  )
}