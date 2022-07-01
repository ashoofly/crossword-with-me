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
      initialSquareProps[index] = {
        id: index,
        classNames: classes,
        tabIndex: tabIndex,
        gridNum: gridNums[index],
        answer: answers[index],
        userInput: ""
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
    console.log("toggle answers");
    setShowAnswers( prevState => !prevState );

  }

  return (
    <div  className="App">
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
             findWordStart={findWordStart}
             showAnswers={showAnswers}
              />
      <Clue 
             handleClick={changeOrientation}
             displayClue={displayClue} />
      <Keyboard />
    </div>
  );
}

export default App;
