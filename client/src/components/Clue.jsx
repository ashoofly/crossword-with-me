import { React, useEffect, useState, useMemo, memo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import prev from '../images/prev.svg';
import next from '../images/next.svg';
import '../styles/Clue.css';
import povActions from '../redux/slices/povSlice';
import Logger from '../utils/Logger';

const Clue = memo(props => {
  const { isWidescreen } = props;
  const logger = useMemo(() => new Logger('Clue'), []);
  logger.log('Render clue component');

  const dispatch = useDispatch();
  const clueDictionary = useSelector(state => state.game.clueDictionary);
  const gameGrid = useSelector(state => state.game.gameGrid);
  const currentFocus = useSelector(state => state.pov.focused);
  const [clueText, setClueText] = useState({ __html: '' });
  const [clueHeading, setClueHeading] = useState('');
  const isTouchDevice = 'ontouchstart' in window;

  function displayClue() {
    if (currentFocus && currentFocus.orientation && currentFocus.word) {
      const dictionaryKey = gameGrid[currentFocus.word[0]].gridNum;
      setClueText({__html: clueDictionary[currentFocus.orientation][dictionaryKey].clue});
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
        <div className="arrow-container" onClick={jumpToPreviousWord}>
          <img className="arrows" src={prev} alt="prev_clue" />
        </div>
        <div
          onClick={() => dispatch(povActions.toggleOrientation())}
          className="clue-text"
          dangerouslySetInnerHTML={clueText} />
        <div className="arrow-container" onClick={jumpToNextWord}>
          <img className="arrows" src={next} alt="next_clue" />
        </div>
      </div>
    </div>
  );
});

Clue.propTypes = {
  isWidescreen: PropTypes.bool.isRequired,
};

export default Clue;
