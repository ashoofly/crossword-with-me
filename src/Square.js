import React from "react";

export default function Square(props) {
  const { 
    id,
    isPlayableSquare,
    checkAnswer,
    goToNextSquareAfterInput, 
    overwriteMode,
    deleteMode, 
    squareRef, 
    classNames, 
    gridNum, 
    answer, 
    handleFocus, 
    handleMouseDown, 
    showAnswer, 
    userInput, 
    handleKeyDown } = props;

  function displaySquare() {
    if (showAnswer) {
      return answer!== '.' ? answer : '';
    } else {
      return userInput;
    }
  }

  React.useEffect(goToNextSquareAfterInput, [userInput])


  function checkSquare() {
    return isPlayableSquare && userInput !== '' && checkAnswer() && userInput.charAt(0) !== answer.charAt(0);
  }


  return (
    <div 
        ref={squareRef} 
        tabIndex="0"
        onKeyDown={handleKeyDown} 
        onFocus={handleFocus}
        onMouseDown={handleMouseDown} 
        className={classNames.join(" ")} 
    >
      {checkSquare() && <div className="wrong-answer-overlay"></div>}
      <div className="square-gridnum">{gridNum !== 0 && gridNum}</div>
      <div className={`square-value ${showAnswer ? "show-answer": ''}`}>{displaySquare()}</div>
    </div>
  )
}