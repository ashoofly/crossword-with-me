import { React, useEffect, useState, useCallback, useMemo, memo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import { oneLine } from 'common-tags';
import '../styles/Square.css';
import { gameActions } from '../redux/slices/gameSlice';
import { povActions } from '../redux/slices/povSlice';
import Logger from '../common/Logger';
import { combinePlayerColors, showColorWithRevealedMarker, showColorWithVerifiedMarker, getClassNameAndRgbValue } from '../utils/render';

const Square = memo(props => {
  const {
    id,
    squareRef,
    loggers,
  } = props;

  const squareGrid = useSelector(state => state.game.gameGrid[id]);
  const squareGameState = useSelector(state => state.game.board[id]);
  const autocheck = useSelector(state => state.game.autocheck);
  const activeWordColors = useSelector(state => state.game.board[id].activeWordColors);
  const activeLetterColors = useSelector(state => state.game.board[id].activeLetterColors);
  const rebusActive = useSelector(state => state.pov.rebusActive);
  const zoomActive = useSelector(state => state.pov.zoomActive);
  const gameId = useSelector(state => state.game.gameId);
  const focused = useSelector(state => state.pov.focused);
  const textColor = useSelector(state => state.game.board[id].color);
  const dispatch = useDispatch();

  const [squareText, setSquareText] = useState('');
  const [highlightClasses, setHighlightClasses] = useState('');
  const [textColorClass, setTextColorClass] = useState('');
  const [customStyle, setCustomStyle] = useState(null);

  if (loggers) {
    const { renderLogger } = loggers;
    renderLogger.log(`Square ${id}`);
  }

  function displaySquare() {
    if (!squareGrid.isPlayable) {
      setSquareText('');
    } else if (squareGameState.reveal) {
      setSquareText(squareGrid.answer);
    } else {
      setSquareText(squareGameState.input);
    }
  }

  const checkLetter = useCallback(() => {
    if (!squareGrid.isPlayable || squareGameState.input === '') return;
    if (squareGameState.input === squareGrid.answer) {
      dispatch(gameActions.markVerified({ gameId, id }));
    } else if (squareGrid.answer.length > 1) {
      // rebus
      if (squareGameState.input.length >= 1
        && squareGameState.input.charAt(0) === squareGrid.answer.charAt(0)) {
        dispatch(gameActions.markPartial({ gameId, id }));
      } else {
        dispatch(gameActions.markIncorrect({ gameId, id }));
      }
    } else {
      dispatch(gameActions.markIncorrect({ gameId, id }));
    }
  }, [dispatch, gameId, id, squareGameState.input, squareGrid.answer, squareGrid.isPlayable]);

  function checkAnswer() {
    if (autocheck || squareGameState.check) {
      checkLetter();
    }
  }

  useEffect(displaySquare, [squareGameState, squareGrid]);
  useEffect(checkAnswer, [autocheck, checkLetter, squareGameState, squareGrid]);

  useEffect(() => {
    setTextColorClass(textColor ? `${textColor}-text` : '');
  }, [textColor]);

  useEffect(() => {
    setHighlightClasses('');
    setCustomStyle({});
    const activeWordArray = activeWordColors || [];
    const activeLetterArray = activeLetterColors || [];

    // combine colors if more than one player on the square
    if ((activeWordArray.length + activeLetterArray.length) > 1) {
      const combinedColors = combinePlayerColors(activeWordArray, activeLetterArray);
      if (squareGameState.reveal) {
        setCustomStyle({
          background: showColorWithRevealedMarker(combinedColors),
          overflow: 'hidden',
        });
      } else if (squareGameState.verified) {
        setCustomStyle({
          background: showColorWithVerifiedMarker(combinedColors),
          overflow: 'hidden',
        });
      } else {
        setCustomStyle({ backgroundColor: combinedColors });
      }
    } else if (activeWordArray.length > 0 || activeLetterArray.length > 0) {
      // else, highlight square with correct single color
      const { className, rgbValue } = getClassNameAndRgbValue(activeWordColors, activeLetterColors);
      if (squareGameState.reveal) {
        setCustomStyle({
          background: showColorWithRevealedMarker(rgbValue),
          overflow: 'hidden',
        });
      } else if (squareGameState.verified) {
        setCustomStyle({
          background: showColorWithVerifiedMarker(rgbValue),
          overflow: 'hidden',
        });
      } else {
        setHighlightClasses(className);
        setCustomStyle({});
      }
    }
  }, [activeWordColors, activeLetterColors, squareGameState.verified, squareGameState.reveal]);

  function handleFocus() {
    if (squareGrid.answer === '.') return;
    if (loggers) loggers.focusLogger.log(id);
    dispatch(povActions.setFocusedSquare({ focus: id }));
  }

  function handleMouseDown() {
    if (focused.square === id) {
      dispatch(povActions.toggleOrientation());
    }
  }

  return (
    <div
      role="textbox"
      style={customStyle}
      id={id}
      tabIndex="0"
      ref={squareRef}
      onFocus={handleFocus}
      onMouseDown={handleMouseDown}
      className={oneLine`square
                  ${!squareGrid.isPlayable ? 'block' : ''}
                  ${squareGameState.reveal ? 'revealed-overlay' : ''}
                  ${squareGameState.verified ? 'verified-overlay' : ''}
                  ${highlightClasses}
                  ${zoomActive ? 'zoomed' : ''}
                  ${rebusActive && (focused.square === id) ? 'rebus-square' : ''}
                  `}
    >
      {squareGrid.circle && <div className="circle" />}
      {squareGameState.incorrect && !squareGameState.reveal && <div className="wrong-answer-overlay" />}
      {squareGameState.partial && <div className="partially-correct-overlay" />}
      <div className="square-gridnum">{squareGrid.gridNum !== 0 && squareGrid.gridNum}</div>
      {squareGrid.isPlayable && (squareGameState.reveal || squareGameState.verified) && <div className="revealed-marker" />}
      <div className={oneLine`square-value
        ${textColorClass}
        ${squareGameState.penciled ? 'penciled-color' : ''}
        ${squareGameState.reveal ? 'revealed-color' : ''}
        `}
      >
        {squareText}
      </div>
    </div>
  );
});

Square.propTypes = {
  id: PropTypes.number.isRequired,
  squareRef: PropTypes.object.isRequired,
  loggers: PropTypes.object.isRequired,
};

export default Square;
