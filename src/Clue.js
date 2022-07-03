import React from "react";
import prev from "./images/prev.svg";
import next from "./images/next.svg";

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
      <img onClick={goToPrevWord} className="arrows" src={prev} alt="prev_clue" />
      <div onClick={toggleOrientation} className="clue-text">{clueText}</div>
      <img onClick={goToNextWord} className="arrows" src={next} alt="next_clue" />
    </div>
  )
}