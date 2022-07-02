import React from "react";

export default function Clue(props) {
  const { 
    clues,
    answers,
    gridNums,
    activeWord, 
    orientation, 
    toggleOrientation 
  } = props

  let clueDictionary = setupClueDictionary();

  /**
   * Organizes API json 
   */
   function setupClueDictionary() {
    let clueDictionary = {
      across: {},
      down: {}
    };
    const clueStartNum = /(^\d+)\./;
    const acrossAnswers = answers.across;
    const downAnswers = answers.down;

    clues.across.forEach((clue, index) => {
      const m = clueStartNum.exec(clue);
      const key = m[1];
      clueDictionary.across[key] = {
        clue: clue,
        answer: acrossAnswers[index]
      }
    });

    clues.down.forEach((clue, index) => {
      const m = clueStartNum.exec(clue);
      const key = m[1];
      clueDictionary.down[key] = {
        clue: clue,
        answer: downAnswers[index]
      }
    });
    return clueDictionary;
  }


  function displayClue() {
    let dictionaryKey = gridNums[activeWord.start];
    return clueDictionary[orientation][dictionaryKey].clue;
  }

  React.useEffect(displayClue, [clueDictionary, gridNums, orientation, activeWord])

  return (
    <div onClick={toggleOrientation} className="clue">
      <p>{displayClue()}</p>
    </div>
  )
}