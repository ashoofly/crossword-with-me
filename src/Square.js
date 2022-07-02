import React from "react";

export default function Square(props) {
  const { 
    goToNextSquareAfterInput, 
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

  React.useEffect(goToNextSquareAfterInput, [userInput, deleteMode, goToNextSquareAfterInput])

  return (
    <div 
        ref={squareRef} 
        onKeyDown={handleKeyDown} 
        onClick={handleFocus} 
        onMouseDown={handleMouseDown} 
        className={classNames.join(" ")} 
    >
      <div className="square-gridnum">{gridNum !== 0 && gridNum}</div>
      <div className={`square-value ${showAnswer ? "show-answer": ''}`}>{displaySquare()}</div>
    </div>
  )
}