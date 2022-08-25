import { useEffect, useState, memo } from "react";
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
    socket,
  } = props;

  //console.log(`Rendering square component ${id}`);

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
  const gameId = useSelector(state => state.game.gameId);

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
    if (activeWordColors.length === 0 && activeLetterColors.length === 0) {
      setHighlightClasses('');

    } 
    // else if (activeLetterColors.includes(playerColor)) {
    //   setHighlightClasses(`${playerColor}-focus-square`);
    //   setCustomStyle({});
    // }
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

    } else if (activeWordColors.length === 1 || activeLetterColors.length === 1) {
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
    if (!squareGrid.isPlayable) {
      setSquareText('');
    }
    else if (squareGameState.reveal) {
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

  function checkAnswer() {
    if (autocheck || squareGameState.check) {
      checkLetter();
    }
  }

  function checkLetter() {
    if (!squareGrid.isPlayable || squareGameState.input === '') return;
    if (squareGameState.input === squareGrid.answer) {
      dispatch(markVerified({gameId, id}));

    } else if (squareGrid.answer.length > 1) {
      // rebus
      if (squareGameState.input.length >= 1 && squareGameState.input.charAt(0) === squareGrid.answer.charAt(0)) {
        dispatch(markPartial({gameId, id}));
      } else {
        dispatch(markIncorrect({gameId, id}));
      }
    } else {
      dispatch(markIncorrect({gameId, id}));
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
//                   ${squareGrid.circle ? "circle" : ""}

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
                  ${squareGameState.verified ? "verified-overlay" : ""}
                  ${highlightClasses}
                  ${zoomActive ? "zoomed" : ""}
                  ${rebusActive && (focused.square === id) ? "rebus-square" : ""}
                  `}
      onClick={log}>

      {squareGrid.circle && <div className="circle"></div>}

      {squareGameState.incorrect && !squareGameState.reveal && <div className="wrong-answer-overlay"></div>}

      {squareGameState.partial && <div className="partially-correct-overlay"></div>}

      <div className="square-gridnum">{squareGrid.gridNum !== 0 && squareGrid.gridNum}</div>

      {squareGrid.isPlayable && (squareGameState.reveal || squareGameState.verified) && <div className="revealed-marker"></div>}

      <div className={oneLine`square-value
                      ${textColorClass}
                      ${squareGameState.penciled ? "penciled-color" : ""}
                      ${squareGameState.reveal ? "revealed-color" : ""}
                      `}>
        {squareText}
      </div>
    </div>
  )
});