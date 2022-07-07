import React from "react";

export default function Square(props) {
  const { 
    id,
    isPlayableSquare,
    autocheck,
    goToNextSquareAfterInput, 
    overwriteMode,
    deleteMode, 
    squareRef, 
    gridNum, 
    answer, 
    handleFocus, 
    handleMouseDown, 
    userInput, 
    handleKeyDown,
    markSquareVerified,
    classNames,
    markSquareIncorrect,
    squareMarked
   } = props;

  function displaySquare() {
    setSquareText(userInput);
  }

  let [squareText, setSquareText] = React.useState('');
  let [squareValueClasses, setSquareValueClasses] = React.useState(["square-value"]);

  React.useEffect(displaySquare, [userInput, squareMarked]);
  React.useEffect(goToNextSquareAfterInput, [userInput]);
  React.useEffect(checkAnswer, [autocheck, userInput]);
  React.useEffect(markCheckedSquare, [userInput, autocheck, squareMarked]);

  function markCheckedSquare() {
    setSquareValueClasses( prevState => {
      if (squareMarked.verified) {
        if (!prevState.includes("verified")) {
          return [...prevState, "verified"];
        }
      } else if (squareMarked.incorrect) {
        return [...prevState, "checked-incorrect"];
      } else if (!squareMarked.incorrect) {
        return prevState.filter( cn => cn !== "checked-incorrect");
      } else {
        return prevState;
      }
    })
  };


  function checkAnswer() {
    if (autocheck || userInput.requestCheck) {
      if (isPlayableSquare && userInput !== '') {
        if (verifyLetter()) {
          markSquareVerified(id);
        } else {
          markSquareIncorrect(id);
        }
      }
    }
  }


  function verifyLetter() {
    return userInput === answer;
  }

  function isIncorrect() {
    //TODO: incomplete rebus, mark yellow instead of red. 
    return isPlayableSquare && userInput !== '' && userInput !== answer;
  }


  function log() {
    console.log(`Index: ${id}. Should check answer: ${shouldCheckAnswer}`);
    console.log(squareMarked);
  }

  return (
    <div 
        ref={squareRef} 
        tabIndex="0"
        onKeyDown={handleKeyDown} 
        onFocus={handleFocus}
        onMouseDown={handleMouseDown} 
        className={classNames.join(" ")} 
        onClick={log}
    >
      {(squareMarked.incorrect || (shouldCheckAnswer && isIncorrect())) && <div className="wrong-answer-overlay"></div>}
      <div className="square-gridnum">{gridNum !== 0 && gridNum}</div>
      <div className={squareValueClasses.join(' ')}>{squareText}</div>
    </div>
  )
} 