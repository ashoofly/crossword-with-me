import React from "react";
import prev from "../images/prev.svg";
import next from "../images/next.svg";
import '../styles/common.css';
import "../styles/Clue.css";
import { useSelector } from 'react-redux';

export default function Clue(props) {
  const { 
    toggleOrientation,
    goToPrevWord,
    goToNextWord
  } = props

  const game = useSelector(state => {
    return state.game
  });
  const clueDictionary = game.clueDictionary;
  const gameGrid = game.gameGrid;

  const pov = useSelector(state => {
    return state.pov
  });
  const activeWord = pov.activeWord;


  const [ clueText, setClueText ] = React.useState("");
  React.useEffect(displayClue, [activeWord, gameGrid, clueDictionary]);

  function displayClue() {
    let dictionaryKey = gameGrid[activeWord.start].gridNum;
    setClueText(clueDictionary[activeWord.orientation][dictionaryKey].clue);
  }

  return (
    <div className="clue">
      <div className="arrow-container" onClick={goToPrevWord}>
        <img className="arrows" src={prev} alt="prev_clue" />
      </div>
      <div onClick={toggleOrientation} className="clue-text">{clueText}</div>
      <div className="arrow-container" onClick={goToNextWord}>
        <img className="arrows" src={next} alt="next_clue" />
      </div>
    </div>
  )
}