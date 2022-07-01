import React from "react";

export default function Square(props) {
  const { classNames, tabIndex, gridNum, answer, handleFocus, handleMouseDown, handleBlur, showAnswers } = props;

  function handleKeyDown(event) {
    console.log(event.key)
  }

  return (
    <div onKeyDown={handleKeyDown} onFocus={handleFocus} onMouseDown={handleMouseDown} onBlur={handleBlur} className={classNames.join(" ")} tabIndex={tabIndex}>
      <div className="square-gridnum">{gridNum !== 0 && gridNum}</div>
      <div className="square-value">{answer !== '.' && showAnswers ? answer : ''}</div>
    </div>
  )
}