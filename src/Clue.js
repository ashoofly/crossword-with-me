import React from "react";
import prev from "./images/prev.svg";
import next from "./images/next.svg";

export default function Clue(props) {
  const { 
    clueDictionary,
    gridNums,
    activeWord, 
    toggleOrientation,
    goToPrevClue,
    goToNextClue 
  } = props

  const [ clueText, setClueText ] = React.useState("");

  function displayClue() {
    let dictionaryKey = gridNums[activeWord.start];
    setClueText(clueDictionary[activeWord.orientation][dictionaryKey].clue);
  }

  React.useEffect(displayClue, [activeWord, gridNums, clueDictionary]);

  return (
    <div className="clue">
      <img onClick={goToPrevClue} className="arrows" src={prev} alt="prev_clue" />
      <div onClick={toggleOrientation} className="clue-text">{clueText}</div>
      <img onClick={goToNextClue} className="arrows" src={next} alt="next_clue" />
    </div>
  )
}