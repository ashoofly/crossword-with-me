import React from "react";
import prev from "../images/prev.svg";
import next from "../images/next.svg";
import '../styles/common.css';
import "../styles/Clue.css";

export default function Clue(props) {
  const { 
    clueDictionary,
    gridNums,
    activeWord, 
    toggleOrientation,
    goToPrevWord,
    goToNextWord
  } = props

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