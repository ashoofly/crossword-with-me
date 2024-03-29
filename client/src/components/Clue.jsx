import { React, useEffect, useState, useMemo, memo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import prev from '../images/prev.svg';
import next from '../images/next.svg';
import '../styles/Clue.css';
import { povActions } from '../redux/slices/povSlice';
import Logger from '../common/Logger';
import Cursor from '../common/Cursor';

const Clue = memo(props => {
  const {
    isWidescreen,
    cursor,
    loggers,
  } = props;

  const dispatch = useDispatch();
  const clueDictionary = useSelector(state => state.game.clueDictionary);
  const gameGrid = useSelector(state => state.game.gameGrid);
  const currentFocus = useSelector(state => state.pov.focused);
  const { orientation, square: focusedSquare } = currentFocus;
  const [clueText, setClueText] = useState({ __html: '' });
  const [clueHeading, setClueHeading] = useState('');
  const isTouchDevice = 'ontouchstart' in window;

  const game = useSelector(state => state.game);
  const pov = useSelector(state => state.pov);

  if (loggers) {
    const { renderLogger } = loggers;
    renderLogger.log('Clue');
  }

  function displayClue() {
    if (currentFocus && currentFocus.orientation && currentFocus.word) {
      const dictionaryKey = gameGrid[currentFocus.word[0]].gridNum;
      let text;
      try {
        text = clueDictionary[currentFocus.orientation][dictionaryKey].clue;
      } catch (e) {
        // sometimes the data from xword.info is not correct
        const clueDesc = `${dictionaryKey} ${currentFocus.orientation.charAt(0).toUpperCase()}${currentFocus.orientation.slice(1)}`;
        text = `[Sorry, no crossword data for ${clueDesc}]`;
      }
      setClueText({ __html: text });
      if (isWidescreen) {
        setClueHeading(`${dictionaryKey} ${currentFocus.orientation.toUpperCase()}`);
      }
    }
  }

  useEffect(displayClue, [currentFocus, gameGrid, clueDictionary, isWidescreen]);

  return (
    <div className="clue-container">
      {isWidescreen && isTouchDevice && <h4 className="clue-heading">{clueHeading}</h4>}
      <div className="clue">
        <button
          type="button"
          id="left-arrow-container"
          className="arrow-container"
          onClick={cursor.jumpToPreviousWord.bind(cursor, game, pov, focusedSquare)}
        >
          <img className="arrows" src={prev} alt="prev_clue" />
        </button>
        <button
          type="button"
          onClick={() => dispatch(povActions.toggleOrientation())}
          className="clue-text"
          aria-label="clue-text"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={clueText}
        />
        <button
          type="button"
          id="right-arrow-container"
          className="arrow-container"
          onClick={cursor.jumpToNextWord.bind(cursor, game, pov, focusedSquare)}
        >
          <img className="arrows" src={next} alt="next_clue" />
        </button>
      </div>
    </div>
  );
});

Clue.propTypes = {
  isWidescreen: PropTypes.bool.isRequired,
  cursor: PropTypes.instanceOf(Cursor).isRequired,
  loggers: PropTypes.object.isRequired,
};

export default Clue;
