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
    setHighlightClasses('');
    setCustomStyle({});


    let activeWordArray = activeWordColors ? activeWordColors : [];
    let activeLetterArray = activeLetterColors ? activeLetterColors : [];

    // combine colors if more than one player on the square
    if ((activeWordArray.length + activeLetterArray.length) > 1) {
      let allColors = [];
      for (const color of activeWordArray) {
        let cssProperty = `--${color}-focus-word`
        let cssValue = getComputedStyle(document.documentElement).getPropertyValue(cssProperty);
        let rgbArray = cssValue.replace(/[^\d,]/g, '').split(',').map(val => parseInt(val));
        allColors.push(rgbArray);
      } 
      for (const color of activeLetterArray) {
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
      const combinedColors = `rgb(${midRGB[0]}, ${midRGB[1]}, ${midRGB[2]})`;

      if (squareGameState.reveal) {
        setCustomStyle({background: `linear-gradient(to top right, ${combinedColors} 85%,rgb(211,54,130) 10%) top right/var(--square-side-length) var(--square-side-length) no-repeat`, 
        overflow: `hidden`});
      } else if (squareGameState.verified) {
        setCustomStyle({background: `linear-gradient(to top right, ${combinedColors} 85%,rgb(4, 141, 25) 10%) top right/var(--square-side-length) var(--square-side-length) no-repeat`, 
        overflow: `hidden`});
      } else {
        setCustomStyle({backgroundColor: combinedColors});
      }
    } else if (activeWordArray.length === 1) {
        const className = `${activeWordColors[0]}-focus-word`;
        const rgbValue = getComputedStyle(document.documentElement).getPropertyValue(`--${className}`);
        if (squareGameState.reveal) {
          setCustomStyle({background: `linear-gradient(to top right, ${rgbValue} 85%,rgb(211,54,130) 10%) top right/var(--square-side-length) var(--square-side-length) no-repeat`, 
          overflow:`hidden`});
        } else if (squareGameState.verified) {
          setCustomStyle({background: `linear-gradient(to top right, ${rgbValue} 85%,rgb(4, 141, 25) 10%) top right/var(--square-side-length) var(--square-side-length) no-repeat`,
          overflow: `hidden`});
        } else {
          setHighlightClasses(className);
          setCustomStyle({});
        }
    } else if (activeLetterArray.length === 1) {
        const className = `${activeLetterColors[0]}-focus-square`;
        const rgbValue = getComputedStyle(document.documentElement).getPropertyValue(`--${className}`);
        if (squareGameState.reveal) {
          setCustomStyle({background: `linear-gradient(to top right, ${rgbValue} 85%,rgb(211,54,130) 10%) top right/var(--square-side-length) var(--square-side-length) no-repeat`,
          overflow: `hidden`});
        } else if (squareGameState.verified) {
          setCustomStyle({background: `linear-gradient(to top right, ${rgbValue} 85%,rgb(4, 141, 25) 10%) top right/var(--square-side-length) var(--square-side-length) no-repeat`, 
          overflow: `hidden`});
        } else {
          setHighlightClasses(className);
          setCustomStyle({});
        }
    }
  }, [activeWordColors, activeLetterColors, squareGameState.verified, squareGameState.reveal]);


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