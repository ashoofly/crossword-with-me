import React from "react";
import "../styles/Square.css";

export default function Square(props) {
  const { 
    id,
    isPlayableSquare,
    autocheck,
    goToNextSquareAfterInput, 
    squareRef, 
    gridNum, 
    answer, 
    handleFocus, 
    handleMouseDown, 
    userInput, 
    handleKeyDown,
    markSquare,
    classNames,
    squareMarked,
    checkRequest,
    focused,
    rebusActive,
    resetRebus
   } = props;

  function displaySquare() {
    if (!isPlayableSquare) return;
    if (squareMarked.revealed) {
      setSquareText(answer);
    } else {    
      setSquareText(userInput);
    }
  }

  let [squareText, setSquareText] = React.useState('');
  let [squareValueClasses, setSquareValueClasses] = React.useState(["square-value"]);
  let [squareRootClasses, setSquareRootClasses] = React.useState(classNames);

  React.useEffect(displaySquare, [userInput, squareMarked]);
  React.useEffect(goToNextSquareAfterInput, [userInput, rebusActive]);
  React.useEffect(checkAnswer, [autocheck, userInput, checkRequest]);
  React.useEffect(markCheckedSquare, [userInput, autocheck, squareMarked]);



  function markCheckedSquare() {
    setSquareValueClasses( prevState => {
      if (squareMarked.verified) {
        if (!prevState.includes("verified-overlay")) {
          return [...prevState, "verified-overlay"];
        }
      } else {
        if (prevState.includes("verified-overlay")) {
          return prevState.filter( cn => cn !== "verified-overlay");
        }
      } 
      return prevState;
    })
  };


  function checkAnswer() {
    if (shouldCheckAnswer()) {
      if (isPlayableSquare && userInput !== '') {
        if (verifyLetter()) {
          markSquare(id, "verified");
        } else {
          markSquare(id, "incorrect");
        }
      }
    }
  }

  function shouldCheckAnswer() {
    return autocheck || checkRequest;
  }


  function verifyLetter() {
    return userInput === answer;
  }

  function isIncorrect() {
    //TODO: incomplete rebus, mark yellow instead of red. 
    return isPlayableSquare && userInput !== '' && userInput !== answer;
  }


  function log() {
    console.log(`Index: ${id}. Check request: ${checkRequest}`);
    console.log(squareMarked);
  }




  React.useEffect(() => {
    setSquareRootClasses(() => {
      let classNamesWithRevealedStatus = squareMarked.revealed && !classNames.includes("revealed-overlay") ? [...classNames, "revealed-overlay"] : classNames;
      if (focused && rebusActive) {
        if (!classNames.includes("rebus-active")) {
          return [...classNamesWithRevealedStatus, "rebus-square"];
        } else {
          return classNamesWithRevealedStatus;
        }
      } else {
        return classNamesWithRevealedStatus.filter (cn => cn !== "rebus-square");
      }
    });
  }, [squareMarked, classNames, rebusActive, focused]);

  return (
    <div 
        ref={squareRef} 
        tabIndex="0"
        onKeyDown={handleKeyDown} 
        onFocus={handleFocus}
        onMouseDown={handleMouseDown} 
        className={squareRootClasses.join(" ")} 
        onClick={log}
        onBlur={resetRebus}
    >
      {(squareMarked.incorrect || (shouldCheckAnswer() && isIncorrect())) && <div className="wrong-answer-overlay"></div>}
      <div className="square-gridnum">{gridNum !== 0 && gridNum}</div>
      {isPlayableSquare && squareMarked.revealed && <div className="revealed-marker"></div>}
      <div className={squareValueClasses.join(' ')}>{squareText}</div>
    </div>
  )
} 