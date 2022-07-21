import React from "react";
import '../styles/common.css';
import "../styles/Square.css";
import { useSelector, useDispatch } from 'react-redux';
import { markVerified, markPartial, markIncorrect } from '../redux/slices/gameSlice';

export default function Square(props) {

  const {
    id,
    isPlayableSquare,
    goToNextSquareAfterInput,
    squareRef,
    gridNum,
    answer,
    handleFocus,
    handleMouseDown,
    handleKeyDown,
    handleRerender,
    socket,
    saveGame
  } = props;


  const reduxPlayerState = useSelector(state => {
    return state.player
  });
  const playerViewClasses = useSelector(state => {
    return state.player.board[id].playerViewClasses
  });
  const reduxGameState = useSelector(state => {
    return state.game
  });
  const reduxSquareState = reduxGameState.board[id];
  const autocheck = reduxGameState.autocheck;
  const zoomActive = reduxPlayerState.zoomActive;
  const rebusActive = reduxPlayerState.rebusActive;


  const dispatch = useDispatch();


  function displaySquare() {
    if (!isPlayableSquare) return;
    if (reduxSquareState.reveal) {
      setSquareText(answer);
    } else {
      setSquareText(reduxSquareState.input);
    }
  }

  let [squareText, setSquareText] = React.useState('');

  React.useEffect(displaySquare, [reduxSquareState]);
  React.useEffect(goToNextSquareAfterInput, [reduxSquareState.input, rebusActive]);
  React.useEffect(checkAnswer, [autocheck, reduxSquareState.check]);

  React.useEffect(() => {
    if (socket === null) return;
    if (!reduxSquareState.initial && reduxSquareState.source === socket.id) {
      console.log("[Client] Sending changes");
      socket.emit("send-changes", reduxSquareState);
      saveGame();
    }
  }, [socket, reduxSquareState]);


  function checkAnswer() {
    if (shouldCheckAnswer()) {
      verifyLetter();
    }
  }

  function shouldCheckAnswer() {
    return autocheck || reduxSquareState.check;
  }


  function verifyLetter() {
    if (!isPlayableSquare || reduxSquareState.input === '') return;
    if (reduxSquareState.input === answer) {
      dispatch(markVerified({ id: id }));

    } else if (answer.length > 1) {
      // rebus
      if (reduxSquareState.input.length >= 1 && reduxSquareState.input.charAt(0) === answer.charAt(0)) {
        dispatch(markPartial({ id: id }));
      } else {
        dispatch(markIncorrect({ id: id }));
      }

    } else {
      dispatch(markIncorrect({ id: id }));
    }
  }

  function log() {
    console.log(reduxSquareState);
  }

  React.useEffect(() => {
    if (zoomActive) {
      handleRerender();
    }
  }, [zoomActive]);

  return (
    <div
      id={id}
      tabIndex="0"
      ref={squareRef}
      onKeyDown={handleKeyDown}
      onFocus={handleFocus}
      onMouseDown={handleMouseDown}
      className={reduxSquareState.squareRootClasses.concat(playerViewClasses).join(" ")}
      onClick={log}
    >
      {reduxSquareState.incorrect && <div className="wrong-answer-overlay"></div>}
      {reduxSquareState.partial && <div className="partially-correct-overlay"></div>}
      <div className="square-gridnum">{gridNum !== 0 && gridNum}</div>
      {isPlayableSquare && reduxSquareState.reveal && <div className="revealed-marker"></div>}
      <div className={reduxSquareState.squareValueClasses.join(' ')}>{squareText}</div>
    </div>
  )
} 