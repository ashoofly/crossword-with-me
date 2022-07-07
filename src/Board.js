import React from "react";
import Square from "./Square";
import useLocalStorage from "./hooks/useLocalStorage";


export default function Board(props) {
  const {
    autocheck,
    setAutocheck,
    numRows,
    numCols,
    toggleOrientation,
    squareProps,
    setSquareProps,
    activeWord,
    setActiveWord,
    findWordStart,
    findWordEnd,
    getNextWord,
    getPrevWord,
    goToNextWord,
    goToPreviousWord,
    isLastClueSquare,
    clearPuzzle,
    requestCheckAnswer
  } = props;

  const [deleteMode, setDeleteMode] = React.useState(false);
  const [overwriteMode, setOverwriteMode] = React.useState(false);
  const [userInput, setUserInput] = useLocalStorage("userInput", Array(numRows * numCols).fill(""));
  const [squareMarked, setSquareMarked] = useLocalStorage("squareMarked", Array(numRows * numCols).fill({
    verified: false,
    incorrect: false
  }));

  function jumpToPreviousWord() {
    jumpToSquare(getNextEmptySquare(getPrevWord(activeWord.focus)));
  }
  function jumpToNextWord() {
    jumpToSquare(getNextEmptySquare(getNextWord(activeWord.focus)));
  }


  React.useEffect(() => {
    goToNextWord.current = jumpToNextWord
  }, [activeWord]);

  React.useEffect(() => {
    goToPreviousWord.current = jumpToPreviousWord
  }, [activeWord]);

  React.useEffect(() => {
    clearPuzzle.current = () => {
      setUserInput(Array(numRows * numCols).fill(''));
      setSquareMarked(Array(numRows * numCols).fill({
        verified: false,
        incorrect: false
      }));
      setAutocheck(false);
    };
  }, []);

  React.useEffect(highlightActiveWord, [activeWord])

  React.useEffect(() => {
    if (overwriteMode && activeWord.end === activeWord.focus) {
      setOverwriteMode(false);
    }
  }, [activeWord]);

  /**
   * Toggles class on/off for square.
   * @param {int} index - Square index in grid
   * @param {string} className - Name of CSS class to toggle
   * @param {boolean} on - Whether we want class on or off 
   */
  function toggleClass(index, className, on) {
    setSquareProps(prevState => {
      return prevState.map(square => {
        return (square.id === index ?
          {
            ...square,
            classNames: on ? [...square.classNames, className]
              : square.classNames.filter(c => c !== className)
          } :
          square);
      });
    })
  }


  function handleFocus(event, index) {
    console.log("Focused index: " + index);
    if (squareProps[index].answer === ".") return;
    setActiveWord(prevState => ({
      ...prevState,
      focus: index,
      start: findWordStart(index, prevState.orientation),
      end: findWordEnd(index, prevState.orientation),
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
    for (let i = activeWord.start; i <= activeWord.end; i = (i + incrementInterval)) {
      if (activeWord.focus === i) {
        toggleClass(i, "focused-letter", true);
      } else {
        toggleClass(i, "focused-word", true);
      }
    }
  }

  function clearAllFocus() {
    setSquareProps(prevState => {
      return prevState.map(square => {
        return ({
          ...square,
          classNames: square.classNames.filter(c => c !== "focused-letter" && c !== "focused-word")
        });
      })
    })
  }

  function handleKeyDown(e) {
    e.preventDefault();

    if (e.key === " ") {
      toggleOrientation();

    } else if (e.key === "Tab" || (e.shiftKey && e.key === "ArrowRight")) {
      jumpToNextWord();

    } else if (e.shiftKey && e.key === "ArrowLeft") {
      jumpToPreviousWord();

    } else if (squareMarked[activeWord.focus].verified) {
      goToNextSquareAfterInput();

    } else if (e.key === "Backspace") {
      setDeleteMode(true);
      let currentIndex = activeWord.focus;
      if (userInput[activeWord.focus] === '') {
        // if user input already empty, backspace to previous letter
        currentIndex = backspace();
      }
      removeAnyPreviousIncorrectChecks(currentIndex);
      if (!squareMarked[currentIndex].verified) {
        setUserInput(prevState => {
          return prevState.map((square, index) => {
            return (index === currentIndex ? '' : square);
          });
        });
      }
    } else {
      setDeleteMode(false);

      if (e.key.length === 1 && e.key.match(/[A-Za-z]/)) {
        // if letter already in square, go into 'overwrite' mode
        if (userInput[activeWord.focus] !== "") {
          removeAnyPreviousIncorrectChecks(activeWord.focus);
          setOverwriteMode(true);
        }
        setUserInput(prevState => {
          return prevState.map((square, index) => {
            return (index === activeWord.focus ? e.key.toUpperCase() : square);
          })
        })
      }
    }
  }


    function markSquareVerified(id) {
      setSquareMarked(prevState => {
        return prevState.map((square, index) => {
          return (index === id ?
            {
              ...square,
              verified: true
            }
            : square
          )
        });
      })
    }

    function markSquareIncorrect(id) {
      setSquareMarked(prevState => {
        return prevState.map((square, index) => {
          return (index === id ?
            {
              ...square,
              incorrect: true
            }
            : square
          )
        });
      })
    }

    function removeAnyPreviousIncorrectChecks(id) {
      setSquareMarked(prevState => {
        return prevState.map((square, index) => {
          return (index === id ?
            {
              ...square,
              incorrect: false
            }
            : square
          )
        });
      })
    }
  


    function jumpToSquare(index) {
      squareProps[index].squareRef.current.focus();
    }


    function backspace() {
      let index = getPreviousSquare();
      jumpToSquare(index);
      return index;
    }

    function goToNextSquareAfterInput() {
      if (!deleteMode) {
        let index = getNextEmptySquare(activeWord.focus);
        jumpToSquare(index);
      }
    }

    function isPlayableSquare(index) {
      return squareProps[index].answer !== '.';
    }



    function getPreviousSquare() {
      if (activeWord.focus === 0) return 0;

      if (activeWord.orientation === "across") {
        let current = activeWord.focus - 1;
        while (!isPlayableSquare(current)) {
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
      return userInput.filter(square => square === "").length === 0 ? true : false;
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
        // in overwrite mode, just go to the next square in the word regardless of whether it is occupied        
        return activeWord.orientation === "across" ? index + 1 : index + numCols;

      } else {
        let incrementInterval = activeWord.orientation === "across" ? 1 : numCols;
        let currentWordStart = findWordStart(index, activeWord.orientation);
        let currentWordEnd = findWordEnd(index, activeWord.orientation);
        // Start at current square and go to next empty letter in word
        for (let i = index; i <= currentWordEnd; i = (i + incrementInterval)) {
          if (userInput[i] === "") return i;
        }
        // If all filled, go back to any empty letters at the beginning of the word
        for (let i = currentWordStart; i < index; i = (i + incrementInterval)) {
          if (userInput[i] === "") return i;
        }

        // If word is all filled out, find next word 
        return getNextEmptySquare(getNextWord(index));
      }
    }

    const squares = squareProps.map(square => {
      return (
        <Square key={square.id}
          {...square}
          isPlayableSquare={isPlayableSquare(square.id)}
          autocheck={autocheck}
          overwriteMode={overwriteMode}
          deleteMode={deleteMode}
          userInput={userInput[square.id]}
          handleMouseDown={() => handleMouseDown(square.id)}
          handleFocus={(event) => handleFocus(event, square.id)}
          handleKeyDown={handleKeyDown}
          goToNextSquareAfterInput={goToNextSquareAfterInput}
          markSquareVerified={() => markSquareVerified(square.id)}
          markSquareIncorrect={() => markSquareIncorrect(square.id)}
          squareMarked={squareMarked[square.id]}
          requestCheckAnswer={() => requestCheckAnswer.current(activeWord.focus)}
        />
      )
    });

    return (
      <div className="Board">
        {squares}
      </div>
    )
  }