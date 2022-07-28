import React from "react";
import '../styles/common.css';
import "../styles/Square.css";
import { useSelector, useDispatch } from 'react-redux';
import { markVerified, markPartial, markIncorrect } from '../redux/slices/gameSlice';
import { setFocus, toggleOrientation } from '../redux/slices/povSlice';
import { oneLine } from 'common-tags';

export const Square = React.memo((props) => {
  const {
    id,
    // goToNextSquareAfterInput,
    squareRef,
    // handleKeyDown,
    // handleRerender,
    // socket,
    // saveGame
  } = props;

  console.log(`Rendering square component ${id}`);

  const rebusActive = useSelector(state => {
    return state.pov.rebusActive;
  });
  const zoomActive = useSelector(state => {
    return state.pov.zoomActive;
  });
  const autocheck = useSelector(state => {
    return state.game.autocheck;
  });
  const isActiveWord = useSelector(state => {
    return state.pov.board[id].isActiveWord;
  });
  const isActiveLetter = useSelector(state => {
    return state.pov.board[id].isActiveLetter;
  })
  const squareGameState = useSelector(state => {
    return state.game.board[id]
  });
  const squareGrid = useSelector(state => {
    return state.game.gameGrid[id]
  });
  const dispatch = useDispatch();

  function handleFocus() {
    if (squareGrid.answer === ".") return;
    console.log(`Set focus to ${id}`);
    dispatch(setFocus({focus: id}));
  }

  /**
   * This event is fired before 'onFocus', so we can toggle orientation before changing active word
   */
   function handleMouseDown() {
    if (isActiveLetter) {
      console.log("Toggle orientation");
      dispatch(toggleOrientation());
    }
  }

  function displaySquare() {
    if (!squareGrid.isPlayable) return;
    if (squareGameState.reveal) {
      setSquareText(squareGrid.answer);
    } else {
      setSquareText(squareGameState.input);
    }
  }

  let [squareText, setSquareText] = React.useState('');

  React.useEffect(displaySquare, [squareGameState]);
  // React.useEffect(goToNextSquareAfterInput, [squareGameState, rebusActive]);
  React.useEffect(checkAnswer, [autocheck, squareGameState]);

  // React.useEffect(() => {
  //   if (socket === null) return;
  //   if (!squareGameState.initial && squareGameState.source === socket.id) {
  //     console.log("[Client] Sending changes");
  //     socket.emit("send-changes", squareGameState);
  //     saveGame();
  //   }
  // }, [socket, squareGameState]);


  function checkAnswer() {
    if (shouldCheckAnswer()) {
      verifyLetter();
    }
  }

  function shouldCheckAnswer() {
    return autocheck || squareGameState.check;
  }


  function verifyLetter() {
    if (!squareGrid.isPlayable || squareGameState.input === '') return;
    if (squareGameState.input === squareGrid.answer) {
      dispatch(markVerified({ id: id }));

    } else if (squareGrid.answer.length > 1) {
      // rebus
      if (squareGameState.input.length >= 1 && squareGameState.input.charAt(0) === squareGrid.answer.charAt(0)) {
        dispatch(markPartial({ id: id }));
      } else {
        dispatch(markIncorrect({ id: id }));
      }

    } else {
      dispatch(markIncorrect({ id: id }));
    }
  }

  function log() {
    console.log(squareGameState);
  }

  React.useEffect(() => {
    if (zoomActive) {
      // handleRerender();
    }
  }, [zoomActive]);

  return (
    <div
      id={id}
      tabIndex="0"
      ref={squareRef}
      // onKeyDown={handleKeyDown}
      onFocus={handleFocus}
      onMouseDown={handleMouseDown}
      className={oneLine`square
                  ${!squareGrid.isPlayable ? "block" : ""}
                  ${squareGameState.reveal ? "revealed-overlay" : ""}
                  ${isActiveWord ? "focused-word" : ""}
                  ${isActiveLetter ? "focused-letter" : ""}
                  ${zoomActive ? "zoomed" : ""}
                  ${rebusActive && isActiveLetter ? "rebus-square" : ""}
                  `}
      onClick={log}>

      {squareGameState.incorrect && <div className="wrong-answer-overlay"></div>}

      {squareGameState.partial && <div className="partially-correct-overlay"></div>}

      <div className="square-gridnum">{squareGrid.gridNum !== 0 && squareGrid.gridNum}</div>

      {squareGrid.isPlayable && squareGameState.reveal && <div className="revealed-marker"></div>}

      <div className={oneLine`square-value
                      ${squareGameState.penciled ? "penciled-color" : ""}
                      ${squareGameState.verified ? "verified-color" : ""}
                      `}>
            {squareText}
      </div>
    </div>
  )
});