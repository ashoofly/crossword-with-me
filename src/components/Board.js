import React from "react";
import Square from "./Square";
import useLocalStorage from "../utils/useLocalStorageHook";
import '../styles/common.css';
import "../styles/Board.css";

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
    checkSquare,
    checkWord,
    checkPuzzle,
    revealSquare,
    revealWord,
    revealPuzzle,
    initializeState,
    rebusActive,
    setRebusActive,
    jumpToSquare,
    pencilActive,
    zoomActive,
    scrollToWord,
    handleVirtualKeydown
  } = props;

  const [deleteMode, setDeleteMode] = React.useState(false);
  const [overwriteMode, setOverwriteMode] = React.useState(false);
  const [userInput, setUserInput] = useLocalStorage("userInput", Array(numRows * numCols).fill(""));
  const [checkRequest, setCheckRequest] = useLocalStorage("checkRequest", Array(numRows * numCols).fill(false));
  const [squareMarked, setSquareMarked] = useLocalStorage("squareMarked", Array(numRows * numCols).fill({
    verified: false,
    incorrect: false,
    revealed: false,
    partial: false,
    penciled: false
  }));

  function jumpToPreviousWord() {
    jumpToSquare(getNextEmptySquare(getPrevWord(activeWord.focus)));
  }
  function jumpToNextWord() {
    jumpToSquare(getNextEmptySquare(getNextWord(activeWord.focus)));
  }

  function checkActiveSquare() {
    if (userInput[activeWord.focus] !== '') {
      setCheckRequest( prevState => {
        return prevState.map( (checkStatus, index) => {
          return index === activeWord.focus ? true : checkStatus;
        })
      });
    }
  }

  React.useEffect(() => {
    checkSquare.current = checkActiveSquare;
  }, [activeWord]); 
  
  React.useEffect(() => {
    checkWord.current = checkActiveWord;
  }, [activeWord]); 

  React.useEffect(() => {
    checkPuzzle.current = checkEntirePuzzle;
  }, [activeWord]); 

  React.useEffect(() => {
    handleVirtualKeydown.current = handleKeyDown;
  }, [activeWord]);

  function checkActiveWord() {
    let incrementInterval = activeWord.orientation === "across" ? 1 : numCols;
    for (let i = activeWord.start; i <= activeWord.end; i = (i + incrementInterval)) {
      if (userInput[i] !== '') {
        setCheckRequest( prevState => {
          return prevState.map( (checkStatus, index) => {
            return index === i ? true : checkStatus;
          })
        });
      }
    }
  }

  function checkEntirePuzzle() {
    setCheckRequest( prevState => {
      return prevState.map( (checkStatus, index) => {
        return userInput[index] !== '' ? true : checkStatus;
      })
    });
  }


  React.useEffect(() => {
    revealSquare.current = () => {
      if (userInput[activeWord.focus] === squareProps[activeWord.focus].answer) {
        checkActiveSquare();
      } else {
        markSquare(activeWord.focus, "revealed");
        markSquare(activeWord.focus, "verified");
      }
    }
  }, [activeWord]);

  React.useEffect(() => {
    revealWord.current = () => {
      let incrementInterval = activeWord.orientation === "across" ? 1 : numCols;
      for (let i = activeWord.start; i <= activeWord.end; i = (i + incrementInterval)) {
        if (!squareMarked[i].revealed && !squareMarked[i].verified) {
          if (userInput[i] === squareProps[i].answer) {
            setCheckRequest( prevState => {
              return prevState.map( (checkStatus, index) => {
                return index === i ? true : checkStatus;
              })
            });
          } else {
            markSquare(i, "revealed");
            markSquare(i, "verified");
          }
        }
      }
    }
  }, [activeWord]);

  React.useEffect(() => {
    revealPuzzle.current = () => {
      userInput.forEach( (square, i) => {
        if (isPlayableSquare(i) && !squareMarked[i].revealed && !squareMarked[i].verified) {
          if (userInput[i] === squareProps[i].answer) {
            setCheckRequest( prevState => {
              return prevState.map( (checkStatus, index) => {
                return index === i ? true : checkStatus;
              })
            });
          } else {
            removeAnyPreviousChecks(i);
            markSquare(i, "revealed");
            markSquare(i, "verified");
          }
        }
      });
    }
  })


  React.useEffect(() => {
    goToNextWord.current = jumpToNextWord
  }, [activeWord]);

  React.useEffect(() => {
    goToPreviousWord.current = jumpToPreviousWord
  }, [activeWord]);

  React.useEffect(() => {
    clearPuzzle.current = () => {
      setUserInput(Array(numRows * numCols).fill(''));
      setCheckRequest(Array(numRows * numCols).fill(false));
      setSquareMarked(Array(numRows * numCols).fill({
        verified: false,
        incorrect: false,
        revealed: false,
        partial: false
      }));
      setAutocheck(false);
      setSquareProps(initializeState());
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

  function centerActiveSquareOnZoom() {
    let firstLetterOfWord = squareProps[activeWord.focus].squareRef.current;
    firstLetterOfWord.scrollIntoView({
      behavior: "smooth", 
      block: activeWord.orientation === "down" ? "start": "center",
      inline: "center"
    });
  }

  function handleFocus(event, index) {
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

    } else if (rebusActive && e.key === "Enter") {
      setRebusActive(false);
      goToNextSquareAfterInput();

    } else if (e.key === "Backspace") {
      setDeleteMode(true);
      let currentIndex = activeWord.focus;
      if (userInput[activeWord.focus] === '') {
        // if user input already empty, backspace to previous letter
        currentIndex = backspace();
      }
      removeAnyPreviousChecks(currentIndex);
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
          removeAnyPreviousChecks(activeWord.focus);
          setOverwriteMode(true);
        }
        setUserInput(prevState => {
          return prevState.map((square, index) => {
            return (index === activeWord.focus ? (rebusActive ? `${square}${e.key.toUpperCase()}` : e.key.toUpperCase()) : square);
          })
        })
        if (pencilActive) {
          markSquare(activeWord.focus, "penciled");
        } else {
          markSquare(activeWord.focus, "penciled", false);
        }
      }
    }
  }

    function markSquare(id, property, value) {
      setSquareMarked(prevState => {
        return prevState.map((square, index) => {
          return (index === id ?
            {
              ...square,
              [property]: value ?? true
            }
            : square
          )
        });
      })
    }

    function removeAnyPreviousChecks(id) {
      setSquareMarked(prevState => {
        return prevState.map((square, index) => {
          return (index === id ?
            {
              ...square,
              incorrect: false,
              partial: false
            }
            : square
          )
        });
      });
      setCheckRequest(prevState => {
        return prevState.map((checkStatus, index) => {
          return (index === id ? false : checkStatus);
        });
      });
    }
  





    function backspace() {
      let index = getPreviousSquare();
      jumpToSquare(index);
      return index;
    }

    function goToNextSquareAfterInput() {
      if (!deleteMode && !rebusActive) {
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

    function resetRebus() {
      setRebusActive(false);
    }

    const squares = squareProps.map(square => {
      return (
        <Square key={square.id}
          {...square}
          isPlayableSquare={isPlayableSquare(square.id)}
          autocheck={autocheck}
          checkRequest={checkRequest[square.id]}
          overwriteMode={overwriteMode}
          deleteMode={deleteMode}
          userInput={userInput[square.id]}
          handleMouseDown={() => handleMouseDown(square.id)}
          handleFocus={(event) => handleFocus(event, square.id)}
          handleKeyDown={handleKeyDown}
          goToNextSquareAfterInput={goToNextSquareAfterInput}
          markSquare={(index, mark) => markSquare(index, mark)}
          squareMarked={squareMarked[square.id]}
          focused={square.id===activeWord.focus}
          rebusActive={rebusActive}
          resetRebus={() => resetRebus()}
          zoomActive={zoomActive}
          handleRerender={centerActiveSquareOnZoom}
        />
      )
    });

    return (
      <div className="Board">
        {squares}
      </div>
    )
  }