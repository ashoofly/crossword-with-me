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
    findWordEnd
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
 // React.useEffect(clearAllFocus, [activeWord]); //TODO: how can we tell which order these will run in and weird dependencies that i don't want to include 

  function handleFocus(event, index) {
    console.log("Focused index: " + index);
    if (squareProps[index].answer === ".") return;
    // clearAllFocus();
    setActiveWord( prevState => ({
      ...prevState,
      focus: index,
      start: findWordStart(index, prevState.orientation),
      end: findWordEnd(index,prevState.orientation),
    }));
  }

  function handleMouseDown(index) {
    console.log("mousedown");
    if (index === activeWord.focus) {
      toggleOrientation();
    } 
  }

  function highlightActiveWord() {
    clearAllFocus();
    console.log("highlight active word");
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
    console.log("clear focus");
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
    console.log(e.key);
    e.preventDefault();

    if (e.key === " ") {
      setDeleteMode(false);
      toggleOrientation();

    } else if (e.key === "Tab") {
      setDeleteMode(false);
      //TODO: Find next word first. Then look for next empty space. 
    
    } else if (e.key === "Backspace") {
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
  
    } else if (e.key.length === 1 && e.key.match(/[A-Za-z]/)) {
      setDeleteMode(false);
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

  function backspace() {
    let index = getPreviousSquare();
    squareProps[index].squareRef.current.focus();
  }

  function goToNextSquareAfterInput() {
    if (!deleteMode) {
      let index = getNextEmptySquare(activeWord.focus);
      squareProps[index].squareRef.current.focus();
    } 
  }


  function getPreviousSquare() {
    if (activeWord.focus === 0) return 0;

    if (activeWord.orientation === "across") {
      let current = activeWord.focus-1;
      while(squareProps[current].answer === ".") {
        current--;
      }
      return current;
    } else {
      // orientation: down
      if (activeWord.focus > activeWord.start) {
        return activeWord.focus - numCols;
      } else {
        let sortedDownWordsByGridnum = squareProps.filter(square => square.classNames.includes("ws-down"))
                      .sort ((a, b) => a.gridNum - b.gridNum)
        let prevGridNum = sortedDownWordsByGridnum[
                            sortedDownWordsByGridnum.findIndex( 
                              square => square.id === squareProps[activeWord.focus].id ) - 1].gridNum;
        let prevWordStartIndex = squareProps.findIndex( square => square.gridNum === prevGridNum);
        let prevWordEndIndex = findWordEnd(prevWordStartIndex);
        return prevWordEndIndex;
      }
    }
  }

  // function getPreviousWord() {
  //   // TODO: For the tab back button on the clue bar. 
  // }

  // function getNextWord() {
  //   // TODO:
  //   if (activeWord.orientation === "across") {
  //     let currentIndex = activeWord.end;
  //     while(squareProps[currentIndex].userInput !== "" || squareProps[currentIndex].answer === ".") {
  //       currentIndex++;
  //     }
  //     return currentIndex;
  //   } else {
  //     // orientation is "down"
  //     return getNextDownEmptySquare(activeWord.start);
  //   }
  // }

  function getNextEmptySquare(index) {
    // TODO: if last square, start search at beginning
    // TODO: Need base case for recursion. Puzzle all filled out / no more empty squares.

    if (overwriteMode) {
      console.log("Overwrite mode");
      let wordEnd = findWordEnd(index);
      if (wordEnd === index) {
        // exit overwrite mode at the end of a word
        setOverwriteMode(false);
      } else {
        // in overwrite mode, just go to the next square regardless of whether it is occupied
        return activeWord.orientation === "across" ? index+1 : index+numCols;
      }

    } else {
      let incrementInterval = activeWord.orientation === "across" ? 1 : numCols;

      // Start at active square and go to next empty letter in word
      for (let i=index; i<=activeWord.end; i=(i + incrementInterval)) {
        if (squareProps[i].userInput=== "") return i;
      }
      // If all filled, go back to any empty letters at the beginning of the word
      for (let i=activeWord.start; i<index; i=(i + incrementInterval)) {
        if (squareProps[i].userInput=== "") return i;
      }

      // TODO: If word is all filled out, find next word 
      //let indexOfNextWord = getNextWord();
      //return getNextEmptySquare(indexOfNextWord);
      // if (orientation === "across") {
      //   let currentIndex = endIndex;
      //   while(squareProps[currentIndex].userInput !== "" || squareProps[currentIndex].answer === ".") {
      //     currentIndex++;
      //   }
      //   return currentIndex;
      // } else {
      //   // orientation is "down"
      //   return getNextDownEmptySquare(startIndex);
      // }
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