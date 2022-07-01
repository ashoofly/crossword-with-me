/* eslint-disable react-hooks/exhaustive-deps */
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
    findWordBoundaries,
    showAnswers,
    handleKeyDown,
    goToNextLogicalSquare, 
    deleteMode
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

  // eslint-disable-next-line react-hooks/exhaustive-deps
  // React.useEffect(switchFocusOnOrientationChange, [orientation]);
  React.useEffect(highlightActiveWord, [orientation, activeSquare])

  function handleFocus(event, index) {
    console.log("Focused index: " + index);
    if (squareProps[index].answer === ".") return;
    clearAllFocus();
    setActiveSquare(index);
  }

  function handleMouseDown(index) {
    if (index === activeSquare) {
      changeOrientation();
    } 
  }

  function highlightActiveWord() {
    let [ startIndex, endIndex ] = findWordBoundaries(activeSquare);
    if (orientation === "across") {
      for (let i=startIndex; i<=endIndex; i++) {
        if (activeSquare === i) {
          toggleClass(i, "focused-letter", true);
        } else {
          toggleClass(i, "focused-word", true);
        }
      }
    } else {
      // orientation is "down"
      for (let i=startIndex; i<=endIndex; i=(i + numCols)) {
        if (activeSquare === i) {
          toggleClass(i, "focused-letter", true);
        } else {
          toggleClass(i, "focused-word", true);
        }
      }
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
              goToNextLogicalSquare={goToNextLogicalSquare}
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