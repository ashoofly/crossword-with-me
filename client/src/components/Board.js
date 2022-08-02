import React from "react";
import Square from "./Square";
import '../styles/common.css';
import "../styles/Board.css";
import { useSelector } from 'react-redux';

export default React.memo((props) => {
  // console.log("Rendering Board component.");

  const {
    socket,
    squareRefs,
  } = props;

  const gameGrid = useSelector( state => state.game.gameGrid);

  const squares = gameGrid.map((square, index) => {
    return (
      <Square key={square.id}
        {...square}
        squareRef={squareRefs[index]}
        socket={socket}
      />
    )
  });
  
  return (
    <div className="Board">
      {squares}
    </div>
  )
});