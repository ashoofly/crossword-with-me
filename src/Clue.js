import React from "react";

export default function Clue(props) {

  const { displayClue, handleDoubleClick } = props

  return (
    <div onDoubleClick={handleDoubleClick} className="clue">
      <p>{displayClue()}</p>
    </div>
  )
}