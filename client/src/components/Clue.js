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

  const reduxPuzzleState = useSelector(state => {
    return state.puzzle
  });
  const clueDictionary = reduxPuzzleState.clueDictionary;
  const gridNums = reduxPuzzleState.gridNums;

  const reduxPlayerState = useSelector(state => {
    return state.player
  });
  const activeWord = reduxPlayerState.activeWord;


  const [ clueText, setClueText ] = React.useState("");
  React.useEffect(displayClue, [activeWord, gridNums, clueDictionary]);

  function displayClue() {
    let dictionaryKey = gridNums[activeWord.start];
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