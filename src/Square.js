import React from "react";

export default function Square(props) {
  const { gridNum, value, classNames, tabIndex, handleFocus } = props;

  return (
    <div onFocus={handleFocus} className={classNames} tabIndex={tabIndex}>
      <div className="square-gridnum">{gridNum !== 0 && gridNum}</div>
      <div className="square-value">{value !== '.' ? value : ''}</div>
    </div>
  )
}