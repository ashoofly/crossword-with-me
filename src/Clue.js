import React from "react";

export default function Clue(props) {

  const { displayClue, handleClick } = props

  return (
    <div onClick={handleClick} className="clue">
      <p>{displayClue()}</p>
    </div>
  )
}