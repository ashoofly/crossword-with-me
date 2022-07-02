import React from "react";
import Square from "./Square";


export default function Board(props) {
  const { 
    numCols, 
    numRows, 
    gridNums,
    toggleOrientation, 
    squareProps, 
    setSquareProps,
    grid,
    showAnswers,
    activeWord,
    setActiveWord,
    findWordStart,
    findWordEnd,
    getPrevWord,
    getNextWord,
    jumpToSquare,
    isLastClueSquare
  } = props;

  const [ deleteMode, setDeleteMode ] = React.useState(false);
  const [ overwriteMode, setOverwriteMode ] = React.useState(false);

  /**
   * Toggles class on/off for square.
   * @param {int} index - Square index in grid
   * @param {string} className - Name of CSS class to toggle
   * @param {boolean} on - Whether we want class on or off 
   */
  function toggleClass(index, className, on) {
    setSquareProps(prevState => {
      return prevState.map( square => {
        return (square.id === index ? 
          {
            ...square, 
            classNames: on ? [...square.classNames, className] 
                            : square.classNames.filter( c => c!== className)
          } : 
          square);
      });
    })
  }

  React.useEffect(highlightActiveWord, [activeWord])

  function handleFocus(event, index) {
    console.log("Focused index: " + index);
    if (squareProps[index].answer === ".") return;
    setActiveWord( prevState => ({
      ...prevState,
      focus: index,
      start: findWordStart(index, prevState.orientation),
      end: findWordEnd(index,prevState.orientation),
    }));
  }

  /**
   * This event is fired before 'onFocus', so we can toggle orientation before changing active word
   * @param {int} index 
   */
  function handleMouseDown(index) {
    if (index === activeWord.focus) {
      toggleOrientation();
    } 
  }

  function highlightActiveWord() {
    clearAllFocus();
    let incrementInterval = activeWord.orientation === "across" ? 1 : numCols;
    for (let i=activeWord.start; i<=activeWord.end; i=(i + incrementInterval)) {
      if (activeWord.focus === i) {
        toggleClass(i, "focused-letter", true);
      } else {
        toggleClass(i, "focused-word", true);
      }
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

  function handleKeyDown(e) {
    e.preventDefault();

    if (e.key === "Backspace") {
      // if user input already empty, go to previous letter
      if (deleteMode) {
        backspace();
      }
      setDeleteMode(true);
      setSquareProps ( prevState => {
        return prevState.map( square => {
          return square.id === activeWord.focus ? {...square, userInput: ''} : square
        })
      })
    } else {
      setDeleteMode(false);
      if (e.key === " ") {
        toggleOrientation();
  
      } else if (e.key === "Tab" || (e.shiftKey && e.key === "ArrowRight")) {
        jumpToSquare(getNextWord(activeWord.focus));
        //TODO:look for next empty space.
      
      } else if (e.shiftKey && e.key === "ArrowLeft") {
        jumpToSquare(getPrevWord(activeWord.focus));
        
      } else if (e.key.length === 1 && e.key.match(/[A-Za-z]/)) {
        // if letter already in square, go into 'overwrite' mode
        if (squareProps[activeWord.focus].userInput !== "") {
          setOverwriteMode(true);
        }
        setSquareProps( prevState => {
          return prevState.map( square => {
            return square.id === activeWord.focus ? {...square, userInput: e.key.toUpperCase()} : square
          });
        })
      }
    }
  }

  function backspace() {
    let index = getPreviousSquare();
    jumpToSquare(index);
  }

  function goToNextSquareAfterInput() {
    if (!deleteMode) {
      console.log("Getting next empty square");
      let index = getNextEmptySquare(activeWord.focus);
      console.log(`Jumping to ${index}`);
      jumpToSquare(index);
    } 
  }

  function isValidSquare(index) {
    return squareProps[index].answer !== '.';
  }

  function getPreviousSquare() {
    if (activeWord.focus === 0) return 0;

    if (activeWord.orientation === "across") {
      let current = activeWord.focus-1;
      while(!isValidSquare(current)) {
        current--;
      }
      return current;
    } else {
      // orientation: down
      if (activeWord.focus > activeWord.start) {
        return activeWord.focus - numCols;
      } else {
        let prevWordEndIndex = findWordEnd(getPrevWord(activeWord.focus), activeWord.orientation);
        return prevWordEndIndex;
      }
    }
  }

  function isPuzzleFilled() {
    return squareProps.filter( square => square.userInput === "").length === 0 ? true : false;
  }

  function getNextEmptySquare(index) {
    // If puzzle is all filled out, return current index
    if (isPuzzleFilled()) {
      console.log("Puzzle is filled.");
      return index;
    }

    // If last square in orientation, start search at beginning
    // TODO: edge case where(0,0) square is not valid
    if (isLastClueSquare(index, activeWord.orientation)) return 0;

    if (overwriteMode) {
      if (activeWord.end === index) {
        // exit overwrite mode at the end of a word
        setOverwriteMode(false);
        return getNextEmptySquare(getNextWord(index));
      } else {
        // in overwrite mode, just go to the next square in the word regardless of whether it is occupied        
        return activeWord.orientation === "across" ? index+1 : index+numCols;
      }

    } else {
      let incrementInterval = activeWord.orientation === "across" ? 1 : numCols;
      let currentWordStart = findWordStart(index, activeWord.orientation);
      let currentWordEnd = findWordEnd(index, activeWord.orientation);

      // Start at current square and go to next empty letter in word
      for (let i=index; i<=currentWordEnd; i=(i + incrementInterval)) {
        console.log(squareProps[i]);
        if (squareProps[i].userInput=== "") return i;
      }
      // If all filled, go back to any empty letters at the beginning of the word
      for (let i=currentWordStart; i<index; i=(i + incrementInterval)) {
        if (squareProps[i].userInput=== "") return i;
      }

      // If word is all filled out, find next word 
      return getNextEmptySquare(getNextWord(index));
    }
  }

  function getNextDownEmptySquare(index) {
    console.log(index);
    if (squareProps.findIndex( square => square.answer !== '.' && square.userInput === "") === -1) {
      // puzzle is complete. go back to top.
      toggleOrientation();
      return 0; // TODO: edge case where index 0 is blank square
    }
    let gridNum = gridNums[index];
    let nextStart = squareProps.findIndex( square => square.gridNum > gridNum && square.classNames.includes("ws-down"));
    if (nextStart === -1) {
      // This is the last DOWN clue. Go back to first ACROSS clue and change orientation
      toggleOrientation();
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

  function showAnswer() {
    return showAnswers;
  }

  const squares = squareProps.map( square => {
    return (
      <Square key={square.id} 
              {...square}
              showAnswer={showAnswer()}
              handleMouseDown={() => handleMouseDown(square.id) }
              handleFocus={(event) => handleFocus(event, square.id) }
              handleKeyDown={handleKeyDown}
              goToNextSquareAfterInput={goToNextSquareAfterInput}
              deleteMode={deleteMode}
      />
    )
  });

  return (
    <div className="Board">
      {squares}
    </div>
  )
}