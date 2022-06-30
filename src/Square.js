import React from "react";

export default function Square(props) {
  const { classNames, tabIndex, gridNum, value, handleFocus, handleClick, handleBlur } = props;
  return (
    <div onFocus={handleFocus} onClick={handleClick} onBlur={handleBlur} className={classNames.join(" ")} tabIndex={tabIndex}>
      <div className="square-gridnum">{gridNum !== 0 && gridNum}</div>
      <div className="square-value">{value !== '.' ? value : ''}</div>
    </div>
  )
}