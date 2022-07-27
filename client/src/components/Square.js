import React from "react";
import '../styles/common.css';
import "../styles/Square.css";
import { useSelector, useDispatch } from 'react-redux';
import { markVerified, markPartial, markIncorrect } from '../redux/slices/gameSlice';

export default function Square(props) {

  const {
    id,
    goToNextSquareAfterInput,
    squareRef,
    handleFocus,
    handleMouseDown,
    handleKeyDown,
    handleRerender,
    socket,
    saveGame
  } = props;


  const pov = useSelector(state => {
    return state.pov
  });
  const game = useSelector(state => {
    return state.game
  });
  const squareGrid = useSelector(state => {
    return state.game.gameGrid[id]
  });
  const board = game.board[id];
  const dispatch = useDispatch();


  function displaySquare() {
    if (!squareGrid.isPlayable) return;
    if (board.reveal) {
      setSquareText(squareGrid.answer);
    } else {
      setSquareText(board.input);
    }
  }

  let [squareText, setSquareText] = React.useState('');

  React.useEffect(displaySquare, [board]);
  React.useEffect(goToNextSquareAfterInput, [board, pov.rebusActive]);
  React.useEffect(checkAnswer, [game.autocheck, board]);

  React.useEffect(() => {
    if (socket === null) return;
    if (!board.initial && board.source === socket.id) {
      console.log("[Client] Sending changes");
      socket.emit("send-changes", board);
      saveGame();
    }
  }, [socket, board]);


  function checkAnswer() {
    if (shouldCheckAnswer()) {
      verifyLetter();
    }
  }

  function shouldCheckAnswer() {
    return game.autocheck || board.check;
  }


  function verifyLetter() {
    if (!squareGrid.isPlayable || board.input === '') return;
    if (board.input === squareGrid.answer) {
      dispatch(markVerified({ id: id }));

    } else if (squareGrid.answer.length > 1) {
      // rebus
      if (board.input.length >= 1 && board.input.charAt(0) === squareGrid.answer.charAt(0)) {
        dispatch(markPartial({ id: id }));
      } else {
        dispatch(markIncorrect({ id: id }));
      }

    } else {
      dispatch(markIncorrect({ id: id }));
    }
  }

  function log() {
    console.log(board);
  }

  React.useEffect(() => {
    if (pov.zoomActive) {
      handleRerender();
    }
  }, [pov.zoomActive]);

  return (
    <div
      id={id}
      tabIndex="0"
      ref={squareRef}
      onKeyDown={handleKeyDown}
      onFocus={handleFocus}
      onMouseDown={handleMouseDown}
      className={`square 
                  ${!squareGrid.isPlayable ? "block" : ""}
                  ${board.reveal ? "revealed-overlay" : ""}
                  ${pov.activeWord ? "focused-word" : ""}
                  ${pov.activeLetter ? "focused-letter" : ""}
                  ${pov.zoomActive ? "zoomed" : ""}
                  ${pov.rebusActive && pov.activeLetter ? "rebus-square" : ""}
                  `}
      onClick={log}>

      {board.incorrect && <div className="wrong-answer-overlay"></div>}

      {board.partial && <div className="partially-correct-overlay"></div>}

      <div className="square-gridnum">{squareGrid.gridNum !== 0 && squareGrid.gridNum}</div>

      {squareGrid.isPlayable && board.reveal && <div className="revealed-marker"></div>}

      <div className={`square-value
                      ${board.penciled ? "penciled-color" : ""}
                      ${board.verified ? "verified-color" : ""}
                      `}>
            {squareText}
      </div>

    </div>
  )
} 