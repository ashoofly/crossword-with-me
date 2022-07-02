import React from "react";
import prev from "./images/prev.svg";
import next from "./images/next.svg";

export default function Clue(props) {
  const { 
    clueDictionary,
    gridNums,
    activeWord, 
    orientation, 
    toggleOrientation,
    goToPrevClue,
    goToNextClue 
  } = props


  function displayClue() {
    let dictionaryKey = gridNums[activeWord.start];
    return clueDictionary[orientation][dictionaryKey].clue;
  }

  return (
    <div className="clue">
      <img onClick={goToPrevClue} className="arrows" src={prev} alt="prev_clue" />
      <p onClick={toggleOrientation} className="clue-text">{displayClue()}</p>
      <img onClick={goToNextClue} className="arrows" src={next} alt="next_clue" />
    </div>
  )
}