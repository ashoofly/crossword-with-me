import React from "react";
import prev from "../images/prev.svg";
import next from "../images/next.svg";
import '../styles/common.css';
import "../styles/Clue.css";
import { useSelector, useDispatch } from 'react-redux';
import { toggleOrientation } from '../redux/slices/povSlice';

export default React.memo((props) => {
  // console.log("Render clue component");
  const { 
    jumpToPreviousWord,
    jumpToNextWord
  } = props

  const dispatch = useDispatch();

  const clueDictionary = useSelector(state => state.game.clueDictionary);
  const gameGrid = useSelector(state => state.game.gameGrid);

  const orientation = useSelector(state => state.pov.focused.orientation);
  const focusedWord = useSelector(state => state.pov.focused.word);

  const [ clueText, setClueText ] = React.useState({__html: ''});
  React.useEffect(displayClue, [focusedWord, gameGrid, clueDictionary, orientation]);

  function displayClue() {
    let dictionaryKey = gameGrid[focusedWord[0]].gridNum;
    console.log(dictionaryKey);
    setClueText({__html: clueDictionary[orientation][dictionaryKey].clue});
  }

  return (
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
  )
});