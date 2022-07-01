import React from "react";
import Navbar from './Navbar';
import Board from './Board';
import Clue from './Clue';
import Keyboard from './Keyboard';
import './styles.css';
import data from "./data/xwordinfo.json";



function App() {
  const numRows = data.size.rows;
  const numCols = data.size.cols;
  const answers = data.grid;
  const gridNums = data.gridnums;
  let acrossDictionary = {};
  let downDictionary = {};
  const [ orientation, setOrientation ] = React.useState("across");
  const [ activeSquare, setActiveSquare ] = React.useState(0);
  const [ showAnswers, setShowAnswers ] = React.useState(false);
  const [ squareProps, setSquareProps ] = React.useState(initializeState());
  const [ overwriteMode, setOverwriteMode ] = React.useState(false);
  const [ deleteMode, setDeleteMode ] = React.useState(false);

  /**
   * Sets up state for each square:
   * - enables tabbing for squares at the start of words for default orientation (ACROSS)
   * - populates answer value
   * - populates grid reference number 
   * @returns 
   */
  function initializeState() {

    let initialSquareProps = Array(numRows * numCols);
    answers.forEach((answer, index) => {
      let tabIndex = -1;
      let classes = ["square"];
      // mark out block squares not in play
      if (answer === '.') {
        classes.push("block");
      }
      // mark word starts for across so we can easily tab to this square
      if (answer !== '.' && (index % numCols === 0 || answers[index-1] === '.')) {
        classes.push("ws-across");
        tabIndex = 0; 
      } 
      // mark word starts for down so we can easily tab to this square
      if (answer !== '.' && (index < numCols || answers[index-numCols] === '.')) {
        classes.push("ws-down");
      } 

      let ref = React.createRef();
      initialSquareProps[index] = {
        id: index,
        classNames: classes,
        tabIndex: tabIndex,
        gridNum: gridNums[index],
        answer: answers[index],
        userInput: "",
        squareRef: ref
      };
    });
    return initialSquareProps;
  }

  setupClueDictionary();

  /**
   * Organizes API json 
   */
     function setupClueDictionary() {

      const clueStartNum = /(^\d+)\./;
      const acrossAnswers = data.answers.across;
      const downAnswers = data.answers.down;
  
      data.clues.across.forEach((clue, index) => {
        const m = clueStartNum.exec(clue);
        const key = m[1];
        acrossDictionary[key] = {
          clue: clue,
          answer: acrossAnswers[index]
        }
      });
  
      data.clues.down.forEach((clue, index) => {
        const m = clueStartNum.exec(clue);
        const key = m[1];
        downDictionary[key] = {
          clue: clue,
          answer: downAnswers[index]
        }
      });
    }
  
  function findWordStart(index) {
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

  function findWordEnd(index) {
    const answers = data.grid;
    let currentIndex = index;
    let wordEnd;
    if (orientation === "across") {
      while(answers[currentIndex] !== '.' && currentIndex % numCols !== (numCols-1)) {
        currentIndex++;
      }
      wordEnd = answers[currentIndex] === '.' ?  currentIndex-1 : currentIndex;

    } else {
      //orientation is "down"
      while((currentIndex + numCols) < (numCols * numRows) && answers[currentIndex] !== '.') {
        currentIndex = currentIndex + numCols;
      }
      wordEnd = answers[currentIndex] === '.' ?  currentIndex-numCols : currentIndex;
    }
    return wordEnd;
  }

  function findWordBoundaries(index) {
    return [findWordStart(index), findWordEnd(index)]
  }

  function displayClue() {
    let startIndex = findWordStart(activeSquare);
    let dictionaryKey = gridNums[startIndex];
    if (orientation === "across") {
      return acrossDictionary[dictionaryKey].clue;
    } else {
      return downDictionary[dictionaryKey].clue;
    }
  }

  function clearAllFocus() {
    setSquareProps(prevState => {
      return prevState.map( square => {
        return ({
          ...square,
          classNames: square.classNames.filter( c => c !== "focused-letter" && c!== "focused-word")
        });
      })
    })
  }

  function changeOrientation() {
    clearAllFocus();
    setOrientation( prevState => prevState === "across" ? "down" : "across");

  }

  function toggleAnswers() {
    setShowAnswers( prevState => !prevState );

  }

  function handleKeyDown(event) {
    if (event.key === " ") {
      event.preventDefault();
      setDeleteMode(false);
      changeOrientation();
    } else if (event.key === "Tab") {
      setDeleteMode(false);
      if (orientation === "down") {
        event.preventDefault();
        goToNextLogicalSquare();
      }

      
    } else if (event.key === "Backspace") {
      // if user input already empty, go to previous letter
      if (deleteMode) {
        backspace();
      }
      setDeleteMode(true);
      setSquareProps ( prevState => {
        return prevState.map( square => {
          return square.id === activeSquare ? {...square, userInput: ''} : square
        })
      })
  
    } else if (event.key.length === 1 && event.key.match(/[A-Za-z]/)) {
      setDeleteMode(false);
      if (squareProps[activeSquare].userInput !== "") {
        setOverwriteMode(true);
      }
      setSquareProps( prevState => {
        return prevState.map( square => {
          return square.id === activeSquare ? {...square, userInput: event.key.toUpperCase()} : square
        });
      })
    }
  }

  function backspace() {
    let index = getPreviousSquare();
    squareProps[index].squareRef.current.focus();
  }

  function getPreviousSquare() {
    if (activeSquare === 0) return 0;

    if (orientation === "across") {
      let current = activeSquare-1;
      while(squareProps[current].answer === ".") {
        current--;
      }
      return current;
    } else {
      // orientation: down
      let wordStart = findWordStart(activeSquare);
      if (activeSquare > wordStart) {
        return activeSquare - numCols;
      } else {
        let prevWordStartSquare = 
          squareProps.filter( square => square.classNames.includes("ws-down"))
              .sort ( (a, b) => a.gridNum - b.gridNum)
              .findIndex( square => square.id === squareProps[activeSquare].id ) - 1
        let prevWordStartIndex = squareProps.findIndex( square => square.id === prevWordStartSquare.id);
        let prevEnd = findWordEnd(prevWordStartIndex);
        return prevEnd;
      }

    }
  }

  function goToNextLogicalSquare() {
    if (!deleteMode) {
      let index = getNextEmptySquare();
      squareProps[index].squareRef.current.focus();
    }
  }

  function getNextEmptySquare() {
    // if last square, return to beginning
    if (activeSquare === numRows * numCols - 1) return 0;

    if (overwriteMode) {
      let wordEnd = findWordEnd(activeSquare);
      if (wordEnd === activeSquare) {
        setOverwriteMode(false);
      } else {
        return orientation === "across" ? activeSquare+1 : activeSquare+numCols;
      }
    }
    let [ startIndex, endIndex ] = findWordBoundaries(activeSquare);
    if (orientation === "across") {
      // go to next empty letter in word
      for (let i=activeSquare; i<=endIndex; i++) {
        if (squareProps[i].userInput=== "") return i;
      }

      // go back to any empty letters at the beginning of the word
      for (let i=startIndex; i<activeSquare; i++) {
        if (squareProps[i].userInput=== "") return i;
      }
      // if word is all filled out, go to next empty letter in next word in orientation
      let currentIndex = endIndex;
      while(squareProps[currentIndex].userInput !== "" || squareProps[currentIndex].answer === ".") {
        currentIndex++;
      }
      return currentIndex;
    } else {
      // orientation is "down"
      for (let i=activeSquare; i<=endIndex; i=(i + numCols)) {
        if (squareProps[i].userInput=== "") return i;
      }
      for (let i=startIndex; i<activeSquare; i=(i + numCols)) {
        if (squareProps[i].userInput=== "") return i;
      }

      return getNextDownEmptySquare(startIndex);
    }
  }

  function getNextDownEmptySquare(index) {
    console.log(index);
    if (squareProps.findIndex( square => square.answer !== '.' && square.userInput === "") === -1) {
      // puzzle is complete. go back to top.
      changeOrientation();
      return 0; // TODO: edge case where index 0 is blank square
    }
    let gridNum = gridNums[index];
    let nextStart = squareProps.findIndex( square => square.gridNum > gridNum && square.classNames.includes("ws-down"));
    if (nextStart === -1) {
      // This is the last DOWN clue. Go back to first ACROSS clue and change orientation
      changeOrientation();
      return 0; // TODO: edge case where index 0 is blank square
    } else {
      let nextEnd = findWordEnd(nextStart);
      let current = nextStart;
      while(current <= nextEnd && squareProps[current].userInput !== "") {
        current = current + numCols;
      }
      if (current <= nextEnd) return current;
      getNextDownEmptySquare(nextEnd);
    }
  }

  return (
    <div className="App">
      <Navbar toggleAnswers={toggleAnswers} />
      <Board numCols={numCols}
             numRows={numRows}
             orientation={orientation}
             changeOrientation={changeOrientation}
             clearAllFocus={clearAllFocus}
             squareProps={squareProps}
             setSquareProps={setSquareProps}
             activeSquare={activeSquare}
             setActiveSquare={setActiveSquare}
             findWordBoundaries={findWordBoundaries}
             showAnswers={showAnswers}
             handleKeyDown={handleKeyDown}
             goToNextLogicalSquare={goToNextLogicalSquare}
             deleteMode={deleteMode}
             />
      <Clue 
             handleClick={changeOrientation}
             displayClue={displayClue} />
      <Keyboard />
    </div>
  );
}

export default App;
