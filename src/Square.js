import React from "react";
import StarsIcon from '@mui/icons-material/Stars';
import SvgIcon from '@mui/material/SvgIcon';

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
    squareMarked,
    checkRequest
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
  React.useEffect(goToNextSquareAfterInput, [userInput]);
  React.useEffect(checkAnswer, [autocheck, userInput, checkRequest]);
  React.useEffect(markCheckedSquare, [userInput, autocheck, squareMarked]);

  function markCheckedSquare() {
    setSquareValueClasses( prevState => {
      if (squareMarked.verified) {
        if (!prevState.includes("verified")) {
          return [...prevState, "verified"];
        }
      } else {
        if (prevState.includes("verified")) {
          return prevState.filter( cn => cn !== "verified");
        }
      } 
      if (squareMarked.incorrect) {
        return [...prevState, "checked-incorrect"];

      } else if (!squareMarked.incorrect) {
        return prevState.filter( cn => cn !== "checked-incorrect");
      }
      return prevState;
    })
  };


  function checkAnswer() {
    if (shouldCheckAnswer()) {
      if (isPlayableSquare && userInput !== '') {
        if (verifyLetter()) {
          markSquareVerified(id);
        } else {
          markSquareIncorrect(id);
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
      return squareMarked.revealed && !classNames.includes("revealed-overlay") ? [...classNames, "revealed-overlay"] : classNames;
    });
  }, [squareMarked, classNames]);

  return (
    <div 
        ref={squareRef} 
        tabIndex="0"
        onKeyDown={handleKeyDown} 
        onFocus={handleFocus}
        onMouseDown={handleMouseDown} 
        className={squareRootClasses.join(" ")} 
        onClick={log}
    >
      {(squareMarked.incorrect || (shouldCheckAnswer() && isIncorrect())) && <div className="wrong-answer-overlay"></div>}
      <div className="square-gridnum">{gridNum !== 0 && gridNum}</div>
      {isPlayableSquare && squareMarked.revealed && <div className="revealed-marker"></div>}
      <div className={squareValueClasses.join(' ')}>{squareText}</div>
    </div>
  )
} 