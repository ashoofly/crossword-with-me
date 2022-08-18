import { useEffect, useState, memo } from "react";
import '../styles/common.css';
import "../styles/Square.css";
import { useSelector, useDispatch } from 'react-redux';
import { markVerified, markPartial, markIncorrect } from '../redux/slices/gameSlice';
import { setFocusedSquare, toggleOrientation } from '../redux/slices/povSlice';
import { oneLine } from 'common-tags';
import Logger from '../utils/logger';

export default memo((props) => {
  const {
    id,
    user,
    squareRef,
    gameId,
    // handleRerender,
    socket,
  } = props;

  // logger.log(`Rendering square component ${id}`);

  const squareGrid = useSelector(state => { return state.game.gameGrid[id] });
  const squareGameState = useSelector(state => { return state.game.board[id] });
  const autocheck = useSelector(state => { return state.game.autocheck });
  const activeWordColors = useSelector(state => state.game.board[id].activeWordColors);
  const activeLetterColors = useSelector(state => state.game.board[id].activeLetterColors);
  const rebusActive = useSelector(state => { return state.pov.rebusActive });
  const zoomActive = useSelector(state => { return state.pov.zoomActive });
  const focused = useSelector(state => state.pov.focused);
  const textColor = useSelector(state => state.game.board[id].color);
  const players = useSelector(state => state.game.players);
  const playerColor = players.find(player => player.playerId === user.uid).color;
  const dispatch = useDispatch();
  const logger = new Logger("Square");

  let [squareText, setSquareText] = useState('');
  let [highlightClasses, setHighlightClasses] = useState('');
  let [textColorClass, setTextColorClass] = useState('');
  let [multipleFocus, setMultipleFocus] = useState(false);
  let [customStyle, setCustomStyle] = useState(null);



  useEffect(displaySquare, [squareGameState, squareGrid]);
  useEffect(checkAnswer, [autocheck, squareGameState, squareGrid]);

  useEffect(() => {
    setTextColorClass( textColor ? `${textColor}-text` : '');
    
  }, [textColor]);

  useEffect(() => {
    if (!activeWordColors || !activeLetterColors) return;
    if (activeLetterColors.includes(playerColor)) {
      setHighlightClasses(`${playerColor}-focus-square`);
      setCustomStyle({});
    }
    else if ((activeWordColors.length + activeLetterColors.length) > 1) {
      let allColors = [];
      for (const color of activeWordColors) {
        let cssProperty = `--${color}-focus-word`
        let cssValue = getComputedStyle(document.documentElement).getPropertyValue(cssProperty);
        let rgbArray = cssValue.replace(/[^\d,]/g, '').split(',').map(val => parseInt(val));
        allColors.push(rgbArray);
      } 
      for (const color in activeLetterColors) {
        let cssProperty = `--${color}-focus-square`;
        let cssValue = getComputedStyle(document.documentElement).getPropertyValue(cssProperty);
        let rgbArray = cssValue.replace(/[^\d,]/g, '').split(',').map(val => parseInt(val));
        allColors.push(rgbArray);
      }

      const minR = Math.min(...allColors.map(rgbVal => rgbVal[0]));
      const minG = Math.min(...allColors.map(rgbVal => rgbVal[1]));
      const minB = Math.min(...allColors.map(rgbVal => rgbVal[2]));
      const minRGB = [minR, minG, minB];

      const maxR = Math.max(...allColors.map(rgbVal => rgbVal[0]));
      const maxG = Math.max(...allColors.map(rgbVal => rgbVal[1]));
      const maxB = Math.max(...allColors.map(rgbVal => rgbVal[2]));
      const maxRGB = [maxR, maxG, maxB];

      let midRGB = [];
      minRGB.forEach((minColorComp, index) => {
        midRGB.push((minColorComp + maxRGB[index])/2);
      })
      setCustomStyle({backgroundColor: `rgb(${midRGB[0]}, ${midRGB[1]}, ${midRGB[2]})`});
//rgb(204, 192.5, 183.5)
    } else {
      let color = activeWordColors[0];
      if (color) {
        setHighlightClasses(`${color}-focus-word`);
      } else {
        color = activeLetterColors[0];
        setHighlightClasses(`${color}-focus-square`);
      }
      setCustomStyle({});
    }

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
    if (focused.square === id) {
      dispatch(toggleOrientation());
    }
  }

  useEffect(() => {
    if (socket === null) return;
    if (!squareGameState.initial && squareGameState.source === socket.id) {
      socket.emit("send-changes", {...squareGameState, gameId: gameId, scope: "square"});
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
    logger.log(squareGameState);
  }

  useEffect(() => {
    if (zoomActive) {
      // handleRerender();
    }
  }, [zoomActive]);

  return (
    <div
      style={customStyle}
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
                  ${rebusActive && (focused.square === id) ? "rebus-square" : ""}
                  `}
      onClick={log}>

      {squareGameState.incorrect && !squareGameState.reveal && <div className="wrong-answer-overlay"></div>}

      {squareGameState.partial && <div className="partially-correct-overlay"></div>}

      <div className="square-gridnum">{squareGrid.gridNum !== 0 && squareGrid.gridNum}</div>

      {squareGrid.isPlayable && squareGameState.reveal && <div className="revealed-marker"></div>}

      <div className={oneLine`square-value
                      ${textColorClass}
                      ${squareGameState.penciled ? "penciled-color" : ""}
                      ${squareGameState.verified ? "verified-color" : ""}
                      `}>
        {squareText}
      </div>
    </div>
  )
});