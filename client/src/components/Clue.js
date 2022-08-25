import { useEffect, useState, memo } from "react";
import prev from "../images/prev.svg";
import next from "../images/next.svg";
// import "../styles/App.css";
import "../styles/Clue.css";
import { useSelector, useDispatch } from 'react-redux';
import { toggleOrientation } from '../redux/slices/povSlice';
import Logger from '../utils/logger';

export default memo((props) => {
  // console.log("Render clue component");
  const { 
    jumpToPreviousWord,
    jumpToNextWord,
    isWidescreen
  } = props
  const logger = new Logger("Clue");

  const dispatch = useDispatch();

  const clueDictionary = useSelector(state => state.game.clueDictionary);
  const gameGrid = useSelector(state => state.game.gameGrid);

  const currentFocus = useSelector(state => state.pov.focused);

  const [ clueText, setClueText ] = useState({__html: ''});
  const [ clueHeading, setClueHeading ] = useState('');
  useEffect(displayClue, [currentFocus, gameGrid, clueDictionary]);

  function displayClue() {
    if (currentFocus && currentFocus.orientation && currentFocus.word) {
      let dictionaryKey = gameGrid[currentFocus.word[0]].gridNum;
      setClueText({__html: clueDictionary[currentFocus.orientation][dictionaryKey].clue});  
      if (isWidescreen) {
        setClueHeading(`${dictionaryKey} ${currentFocus.orientation.toUpperCase()}`) 
      } 
    }
  }
  const isTouchDevice = 'ontouchstart' in window;

  return (
    <div className="clue-container">
      {isWidescreen && isTouchDevice && <h4 className="clue-heading">{clueHeading}</h4>}
      <div className="clue">
        <div className="arrow-container" onClick={jumpToPreviousWord}>
          <img className="arrows" src={prev} alt="prev_clue" />
        </div>
        <div 
          onClick={() => dispatch(toggleOrientation())} 
          className="clue-text"
          dangerouslySetInnerHTML={clueText}>
        </div>
        <div className="arrow-container" onClick={jumpToNextWord}>
          <img className="arrows" src={next} alt="next_clue" />
        </div>
      </div>
    </div>

  )
});