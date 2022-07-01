import React from "react";

export default function Square(props) {
  const { goToNextLogicalSquare, deleteMode, squareRef, classNames, tabIndex, gridNum, answer, handleFocus, handleMouseDown, handleBlur, showAnswer, userInput, handleKeyDown } = props;

  function displaySquare() {
    if (showAnswer) {
      return answer!== '.' ? answer : '';
    } else {
      return userInput;
    }
  }

  React.useEffect(goToNextLogicalSquare, [userInput, deleteMode])

  return (
    <div ref={squareRef} onKeyDown={handleKeyDown} onFocus={handleFocus} onMouseDown={handleMouseDown} onBlur={handleBlur} className={classNames.join(" ")} tabIndex={tabIndex}>
      <div className="square-gridnum">{gridNum !== 0 && gridNum}</div>
      <div className={`square-value ${showAnswer ? "show-answer": ''}`}>{displaySquare()}</div>
    </div>
  )
}