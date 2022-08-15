import React from "react";
import '../styles/common.css';
import "../styles/Square.css";
import { useSelector, useDispatch } from 'react-redux';
import { markVerified, markPartial, markIncorrect, changeSent } from '../redux/slices/gameSlice';
import { setFocusedSquare, toggleOrientation } from '../redux/slices/povSlice';
import { oneLine } from 'common-tags';

export default React.memo((props) => {
  const {
    id,
    squareRef,
    // handleRerender,
    socket,
  } = props;

  // console.log(`Rendering square component ${id}`);

  const squareGrid = useSelector(state => { return state.game.gameGrid[id] });
  const squareGameState = useSelector(state => { return state.game.board[id] });
  const autocheck = useSelector(state => { return state.game.autocheck });
  const activeWordColors = useSelector(state => state.game.board[id].activeWordColors);
  const activeLetterColors = useSelector(state => state.game.board[id].activeLetterColors);
  const rebusActive = useSelector(state => { return state.pov.rebusActive });
  const zoomActive = useSelector(state => { return state.pov.zoomActive });
  const isActiveWord = useSelector(state => { return state.pov.board[id].isActiveWord });
  const isActiveSquare = useSelector(state => { return state.pov.board[id].isActiveSquare });

  const dispatch = useDispatch();

  let [squareText, setSquareText] = React.useState('');
  let [highlightClasses, setHighlightClasses] = React.useState('');


  React.useEffect(displaySquare, [squareGameState, squareGrid]);
  React.useEffect(checkAnswer, [autocheck, squareGameState, squareGrid]);

  React.useEffect(() => {
    if (!activeWordColors || !activeLetterColors) return;
    let colorClasses = [];
    for (const color of activeWordColors) {
      colorClasses.push(`${color}-focused-word`);
    }
    for (const color of activeLetterColors) {
      colorClasses.push(`${color}-focused-square`)
    }
    if (activeWordColors || activeLetterColors) {
      console.log(`Setting highlight classes for ${id}:`);
      console.log(colorClasses);
    }

    setHighlightClasses(colorClasses);

  }, [activeWordColors, activeLetterColors]);


  function displaySquare() {
    if (!squareGrid.isPlayable) return;
    if (squareGameState.reveal) {
      setSquareText(squareGrid.answer);
    } else {
      setSquareText(squareGameState.input);
    }
  }

  function handleFocus() {
    if (squareGrid.answer === ".") return;
    dispatch(setFocusedSquare({ focus: id }));
  }

  function handleMouseDown() {
    if (isActiveSquare) {
      dispatch(toggleOrientation());
    }
  }

  React.useEffect(() => {
    if (socket === null) return;
    if (!squareGameState.initial && squareGameState.source === socket.id) {
      socket.emit("send-changes", {...squareGameState, scope: "square"});
    }
  }, [socket, squareGameState]);  

  function checkAnswer() {
    if (autocheck || squareGameState.check) {
      checkLetter();
    }
  }

  function checkLetter() {
    if (!squareGrid.isPlayable || squareGameState.input === '') return;
    if (squareGameState.input === squareGrid.answer) {
      dispatch(markVerified({source: socket.id, id: id }));

    } else if (squareGrid.answer.length > 1) {
      // rebus
      if (squareGameState.input.length >= 1 && squareGameState.input.charAt(0) === squareGrid.answer.charAt(0)) {
        dispatch(markPartial({source: socket.id, id: id }));
      } else {
        dispatch(markIncorrect({source: socket.id, id: id }));
      }
    } else {
      dispatch(markIncorrect({source: socket.id, id: id }));
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
      onFocus={handleFocus}
      onMouseDown={handleMouseDown}
      className={oneLine`square
                  ${!squareGrid.isPlayable ? "block" : ""}
                  ${squareGameState.reveal ? "revealed-overlay" : ""}
                  ${highlightClasses}
                  ${zoomActive ? "zoomed" : ""}
                  ${rebusActive && isActiveSquare ? "rebus-square" : ""}
                  `}
      onClick={log}>

      {squareGameState.incorrect && !squareGameState.reveal && <div className="wrong-answer-overlay"></div>}

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