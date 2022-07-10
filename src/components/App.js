import React from "react";
import Navbar from './Navbar';
import Board from './Board';
import Clue from './Clue';
import Keyboard from './Keyboard';
import '../styles/common.css';
import '../styles/App.css';
import data from "../api/wednesday";
import useLocalStorage from "../hooks/useLocalStorage";

function App() {
  const numRows = data.size.rows;
  const numCols = data.size.cols;
  const grid = data.grid;
  const gridNums = data.gridnums;
  const clues = data.clues;
  const answers = data.answers;
  let clueDictionary = setupClueDictionary();

  const [ autocheck, setAutocheck ] = useLocalStorage("autocheck", false);
  const [ squareProps, setSquareProps ] = React.useState(initializeState());
  const [ rebusActive, setRebusActive ] = React.useState(false);
  const [ pencilActive, setPencilActive ] = React.useState(false);
  const [ activeWord, setActiveWord ] = React.useState({
    orientation: "across",
    focus: 0,
    start: 0,
    end: 0
  });
  const goToNextWord = React.useRef(null);
  const goToPreviousWord = React.useRef(null);
  const clearPuzzle = React.useRef(null);
  const checkSquare = React.useRef(null);
  const checkWord = React.useRef(null);
  const checkPuzzle = React.useRef(null);
  const revealSquare = React.useRef(null);
  const revealWord = React.useRef(null);
  const revealPuzzle = React.useRef(null);

  function handleRebusButtonOnMouseDown() {
    setRebusActive(prevState => !prevState);
    squareProps[activeWord.focus].squareRef.current.focus();
  }

  function findWordStart(index, orientation) {
    let currentIndex = index;
    if (orientation === "across") {
      while(!squareProps[currentIndex].classNames.find(c => c === "ws-across")) {
        currentIndex--;
      }
    } else {
      //orientation is "down"
      while(currentIndex >= numCols && !squareProps[currentIndex].classNames.find(c => c === "ws-down")) {
        currentIndex = currentIndex - numCols;
      }
    }
    return currentIndex;
  }

  function findWordEnd(index, orientation) {
    let currentIndex = index;
    let wordEnd;
    if (orientation === "across") {
      while(grid[currentIndex] !== '.' && currentIndex % numCols !== (numCols-1)) {
        currentIndex++;
      }
      wordEnd = grid[currentIndex] === '.' ?  currentIndex-1 : currentIndex;

    } else {
      //orientation is "down"
      while((currentIndex + numCols) < (numCols * numRows) && grid[currentIndex] !== '.') {
        currentIndex = currentIndex + numCols;
      }
      wordEnd = grid[currentIndex] === '.' ?  currentIndex-numCols : currentIndex;
    }
    return wordEnd;
  }

  /**
   * Methods for child components to use to toggle state
   */
  function toggleOrientation() {
    setActiveWord( prevWord => {
        const newOrientation = prevWord.orientation === "across" ? "down" : "across";
        return {
          ...prevWord,
          orientation: newOrientation,
          start: findWordStart(prevWord.focus, newOrientation),
          end: findWordEnd(prevWord.focus, newOrientation)
      }});
  }

  /**
   * Sets up clue dictionary, linking the previous and next grid nums for more efficient board navigation later
   * [gridNum as key]: {
   *    clue: ...,
   *    answer: ...,
   *    prevGridNum: ...,
   *    nextGridNum: ...
   * }
   */
  function setupClueDictionary() {
    let clueDictionary = {
      across: {},
      down: {}
    };
    const clueStartNum = /(^\d+)\./;
    const acrossAnswers = answers.across;
    const downAnswers = answers.down;

    let orderedGridNumAcross = []
    clues.across.forEach((clue, index) => {
      const m = clueStartNum.exec(clue);
      const key = m[1];
      clueDictionary.across[key] = {
        clue: clue,
        answer: acrossAnswers[index]
      }
      orderedGridNumAcross.push(parseInt(key));
    });
    for (let i=0; i<orderedGridNumAcross.length; i++) {
      clueDictionary.across[orderedGridNumAcross[i]] = {
        ...clueDictionary.across[orderedGridNumAcross[i]],
        prevGridNum: i===0 ? -1 : orderedGridNumAcross[i-1],
        nextGridNum: i+1 < orderedGridNumAcross.length ? orderedGridNumAcross[i+1] : -1,
        isLastClue: i+1 < orderedGridNumAcross.length ? false : true
      }
    }
    let orderedGridNumDown = []
    clues.down.forEach((clue, index) => {
      const m = clueStartNum.exec(clue);
      const key = m[1];
      clueDictionary.down[key] = {
        clue: clue,
        answer: downAnswers[index]
      }
      orderedGridNumDown.push(parseInt(key));
    });
    for (let i=0; i<orderedGridNumDown.length; i++) {
      clueDictionary.down[orderedGridNumDown[i]] = {
        ...clueDictionary.down[orderedGridNumDown[i]],
        prevGridNum: i===0 ? -1 : orderedGridNumDown[i-1],
        nextGridNum: i+1 < orderedGridNumDown.length ? orderedGridNumDown[i+1] : -1,
        isLastClue: i+1 < orderedGridNumDown.length ? false : true
      }
    }
    return clueDictionary;
  }

  function isLastClueSquare(index, orientation) {
    let currentWordClueDictionaryEntry = mapGridIndexToClueDictionaryEntry(index);
    return currentWordClueDictionaryEntry.isLastClue && findWordEnd(index, orientation) === index;
  }

  /**
   * Sets up state for each square:
   * - marks word starts to facilitate board navigation
   * - populates answer value
   * - populates grid reference number 
   * Also updates clue dictionary to include index for each grid number
   * 
   * @returns 
   */
  function initializeState() {

    let initialSquareProps = Array(numRows * numCols);
    grid.forEach((value, index) => {
      let classes = ["square"];
      // mark out block squares not in play
      if (value === '.') {
        classes.push("block");
      }
      // mark word starts for across so we can easily tab to this square
      if (value !== '.' && (index % numCols === 0 || grid[index-1] === '.')) {
        classes.push("ws-across");
      } 
      // mark word starts for down so we can easily tab to this square
      if (value !== '.' && (index < numCols || grid[index-numCols] === '.')) {
        classes.push("ws-down");
      } 

      let ref = React.createRef();
      initialSquareProps[index] = {
        id: index,
        classNames: classes,
        gridNum: gridNums[index],
        answer: value,
        squareRef: ref
      };

      if (gridNums[index] !== 0) {
        if (clueDictionary.across[gridNums[index]]) {
          clueDictionary.across[gridNums[index]] = {
            ...clueDictionary.across[gridNums[index]],
            index: index
          }
        }
        if (clueDictionary.down[gridNums[index]]) {
          clueDictionary.down[gridNums[index]] = {
            ...clueDictionary.down[gridNums[index]],
            index: index
          }
        }
      }
    });

    return initialSquareProps;
  }


  function mapGridIndexToClueDictionaryEntry(index) {
    let currentWordStart = findWordStart(index, activeWord.orientation);
    return clueDictionary[activeWord.orientation][squareProps[currentWordStart].gridNum];
  }


  function getPrevWord(index) {
    let currentWordClueDictionaryEntry = mapGridIndexToClueDictionaryEntry(index);
    let prevGridNum = currentWordClueDictionaryEntry.prevGridNum;
    if (prevGridNum !== -1) {
      let prevWordStartIndex = clueDictionary[activeWord.orientation][prevGridNum].index;
      return prevWordStartIndex;
    } else {
      let currentWordStart = findWordStart(index, activeWord.orientation);
      return currentWordStart;
    }
  }

  function getNextWord(index) {
    let currentWordClueDictionaryEntry = mapGridIndexToClueDictionaryEntry(index);
    let nextGridNum = currentWordClueDictionaryEntry.nextGridNum;
    if (nextGridNum !== -1) {
      let nextWordStartIndex = clueDictionary[activeWord.orientation][nextGridNum].index;
      return nextWordStartIndex;
    } else {
      let currentWordEnd = findWordEnd(index, activeWord.orientation);
      return currentWordEnd;
    }
  }

  function jumpToSquare(index) {
    squareProps[index].squareRef.current.focus();
  }



  return (
      <div className="App">
        <Navbar
              clearPuzzle={() => clearPuzzle.current()}
              checkSquare={() => checkSquare.current()}
              checkWord={() => checkWord.current()}
              checkPuzzle={() => checkPuzzle.current()}
              revealSquare={() => revealSquare.current()}
              revealWord={() => revealWord.current()}
              revealPuzzle={() => revealPuzzle.current()}
              autocheck={autocheck}
              setAutocheck={setAutocheck} 
              handleRebusButtonOnMouseDown={handleRebusButtonOnMouseDown}
              rebusActive={rebusActive}
              setRebusActive={setRebusActive}
              activeWord={activeWord}
              jumpToSquare={jumpToSquare}
              pencilActive={pencilActive}
              setPencilActive={setPencilActive}
         />
        <Board 
              rebusActive={rebusActive}
              setRebusActive={setRebusActive}
              initializeState={initializeState}
              checkSquare={checkSquare}
              checkWord={checkWord}
              checkPuzzle={checkPuzzle}
              revealSquare={revealSquare}
              revealWord={revealWord}
              revealPuzzle={revealPuzzle}
              clearPuzzle={clearPuzzle}
              autocheck={autocheck}
              setAutocheck={setAutocheck}
              numRows={numRows}
              numCols={numCols}
              findWordStart={findWordStart}
              findWordEnd={findWordEnd}
              toggleOrientation={toggleOrientation}
              squareProps={squareProps}
              setSquareProps={setSquareProps}
              activeWord={activeWord}
              setActiveWord={setActiveWord}
              clueDictionary={clueDictionary}
              getNextWord={getNextWord}
              getPrevWord={getPrevWord}
              goToNextWord={goToNextWord}
              goToPreviousWord={goToPreviousWord}
              isLastClueSquare={isLastClueSquare}
              jumpToSquare={jumpToSquare}
              pencilActive={pencilActive}
              />
        <Clue 
              clueDictionary={clueDictionary}
              gridNums={gridNums}
              toggleOrientation={toggleOrientation}
              activeWord={activeWord}
              goToNextWord={() => goToNextWord.current()}
              goToPrevWord={() => goToPreviousWord.current()}
        />
        <Keyboard />
      </div>
  );
}

export default App;
