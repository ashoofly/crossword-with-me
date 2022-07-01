import React from "react";
import Square from "./Square";
import data from "./data/xwordinfo.json";


export default function Board(props) {
  const { 
    numCols, 
    numRows, 
    orientation, 
    changeOrientation, 
    clearAllFocus,
    squareProps, 
    setSquareProps,
    activeSquare,
    setActiveSquare ,
    findWordStart,
    showAnswers
  } = props;

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

  function switchFocusOnOrientationChange() {
    toggleWordHighlight(activeSquare, true);
    switchTabbingBehavior();
  }

  function switchTabbingBehavior() {
    const tabClass = orientation === "across" ? "ws-across" : "ws-down";
    setSquareProps( prevState => {
      return prevState.map( square => {
        return ({
          ...square,
          tabIndex: square.classNames.find( c => c === tabClass) ? 0 : -1
        });
      })
    });
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  React.useEffect(switchFocusOnOrientationChange, [orientation]);


  function handleFocus(event, index) {
    if (squareProps[index].answer === ".") return;
    clearAllFocus();
    setActiveSquare(index);
    toggleWordHighlight(index, true);
  }

  function handleMouseDown(index) {
    if (index === activeSquare) {
      changeOrientation();
    } 
  }

  function handleBlur(index) {
    // toggleWordHighlight(index, false);
  }

  function toggleWordHighlight(index, isHighlighted) {
    let endIndex = findWordEnd(index);
    let startIndex = findWordStart(index);
    if (orientation === "across") {
      for (let i=startIndex; i<=endIndex; i++) {
        if (index === i) {
          toggleClass(i, "focused-letter", isHighlighted);
        } else {
          toggleClass(i, "focused-word", isHighlighted);
        }
      }
    } else {
      // orientation is "down"
      for (let i=startIndex; i<=endIndex; i=(i + numCols)) {
        if (index === i) {
          toggleClass(i, "focused-letter", isHighlighted);
        } else {
          toggleClass(i, "focused-word", isHighlighted);
        }
      }
    }
  }



  const squares = squareProps.map( square => {
    return (
      <Square key={square.id} 
              {...square}
              showAnswers={showAnswers}
              handleMouseDown={() => handleMouseDown(square.id) }
              handleFocus={(event) => handleFocus(event, square.id) }
              handleBlur={() => handleBlur(square.id)} 
      />
    )
  });

  function handleKeyDown(event) {
    if (event.key === " ") {
      changeOrientation();
    }
  }


  return (
    <div onKeyDown={handleKeyDown} className="Board">
      {squares}
    </div>
  )
}