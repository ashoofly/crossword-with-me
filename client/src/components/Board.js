import React from "react";
import Square from "./Square";
import '../styles/common.css';
import "../styles/Board.css";
import { useDispatch, useSelector } from 'react-redux';
import {
  changeInput,
  removeCheck,
  markBlock
} from '../redux/slices/gameSlice';

import {
  toggleRebus,
  setActiveWord,
  markActiveWord,
  markActiveLetter,
  clearAllFocus
} from '../redux/slices/povSlice';

export default function Board(props) {
  const {
    socket,
    jumpToSquare,
    doToggleOrientation,
    goToNextWord,
    goToPreviousWord,
    doHandleKeyDown
  } = props;

  const [deleteMode, setDeleteMode] = React.useState(false);
  const [overwriteMode, setOverwriteMode] = React.useState(false);
  const dispatch = useDispatch();
  const game = useSelector(state => {
    return state.game
  });

  const board = game.board;
  const gameId = game.gameId;

  const pov = useSelector(state => {
    return state.pov
  });
  const gameGrid = game.gameGrid;
  const numCols = game.numCols;
  const numRows = game.numRows;
  const clueDictionary = game.clueDictionary;

  const zoomActive = pov.zoomActive;
  const rebusActive = pov.rebusActive;
  const pencilActive = pov.pencilActive;
  const activeWord = pov.activeWord;

  const [squareRefs, setSquareRefs] = React.useState(Array(numRows*numCols).fill(0).map(() => {
    return React.createRef();
  }));

  function jumpToPreviousWord() {
    jumpToSquareOnBoard(getNextEmptySquare(getPrevWord(activeWord.focus), true));
  }
  function jumpToNextWord() {
    jumpToSquareOnBoard(getNextEmptySquare(getNextWord(activeWord.focus)));
  }

  function saveBoard() {
    if (socket === null) return;
    socket.emit("save-board", gameId, board);
  }

  React.useEffect(highlightActiveWord, [activeWord])

  React.useEffect(() => {
    if (overwriteMode && activeWord.end === activeWord.focus) {
      setOverwriteMode(false);
    }
  }, [activeWord]);

  React.useEffect(() => {
    jumpToSquare.current = jumpToSquareOnBoard;
  }, [gameGrid, zoomActive, activeWord]);

  React.useEffect(() => {
    doToggleOrientation.current = toggleOrientation
  }, [activeWord]);

  React.useEffect(() => {
    doHandleKeyDown.current = handleKeyDown
  }, [activeWord, board]);

  React.useEffect(() => {
    goToNextWord.current = jumpToNextWord
  }, [activeWord]);

  React.useEffect(() => {
    goToPreviousWord.current = jumpToPreviousWord
  }, [activeWord]);

  function jumpToSquareOnBoard(index) {
    squareRefs[index].current.focus();
    if (zoomActive) {
      scrollToWord(index, activeWord.orientation);
    }
  }

  function centerActiveSquareOnZoom() {
    let firstLetterOfWord = squareRefs[activeWord.focus].current;
    firstLetterOfWord.scrollIntoView({
      behavior: "smooth",
      block: activeWord.orientation === "down" ? "start" : "center",
      inline: "center"
    });
  }

  function handleFocus(event, index) {
    if (gameGrid[index].answer === ".") return;
    let start = findWordStart(index, activeWord.orientation);
    let end = findWordEnd(index, activeWord.orientation);
    console.log(`Focus on index: ${index}. Changing active word to start ${start} and end ${end}`);
    dispatch(setActiveWord({
      ...activeWord,
      focus: index,
      start: findWordStart(index, activeWord.orientation),
      end: findWordEnd(index, activeWord.orientation),
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
    dispatch(clearAllFocus());
    let incrementInterval = activeWord.orientation === "across" ? 1 : numCols;
    for (let i = activeWord.start; i <= activeWord.end; i = (i + incrementInterval)) {
      if (activeWord.focus === i) {
        dispatch(markActiveLetter({ id: i }));
      } else {
        dispatch(markActiveWord({ id: i }));
      }
    }
  }


  function handleKeyDown(e) {
    console.log(e);
    e.preventDefault();

    if (e.key === " ") {
      toggleOrientation();

    } else if (e.key === "Tab" || (e.shiftKey && e.key === "ArrowRight")) {
      jumpToNextWord();

    } else if (e.shiftKey && e.key === "ArrowLeft") {
      jumpToPreviousWord();

    } else if (board[activeWord.focus].verified) {
      goToNextSquareAfterInput();

    } else if (rebusActive && e.key === "Enter") {
      dispatch(toggleRebus());
      goToNextSquareAfterInput();

    } else if (e.key === "Backspace") {
      setDeleteMode(true);
      let currentIndex = activeWord.focus;
      if (board[activeWord.focus].input === '') {
        // if user input already empty, backspace to previous letter
        currentIndex = backspace();
      }
      removeAnyPreviousChecks(currentIndex);
      if (!board[currentIndex].verified) {
        dispatch(changeInput({ id: currentIndex, value: '', source: socket.id }));
      }
    } else {
      setDeleteMode(false);

      if (e.key.length === 1 && e.key.match(/[A-Za-z]/)) {
        // if letter already in square, go into 'overwrite' mode
        if (board[activeWord.focus].input !== "") {
          removeAnyPreviousChecks(activeWord.focus);
          setOverwriteMode(true);
        }
        dispatch(changeInput({ id: activeWord.focus, value: e.key.toUpperCase(), source: socket.id, penciled: pencilActive }));
      }
    }
  }

  function removeAnyPreviousChecks(id) {
    dispatch(removeCheck({ id: id }));
  }

  function backspace() {
    let index = getPreviousSquare();
    jumpToSquareOnBoard(index);
    return index;
  }

  function goToNextSquareAfterInput() {
    if (!deleteMode && !rebusActive) {
      let index = getNextEmptySquare(activeWord.focus);
      jumpToSquareOnBoard(index);
    }
  }

  function isPlayableSquare(index) {
    return gameGrid[index].answer !== '.';
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
    return board.filter(square => square.input === "").length === 0 ? true : false;
  }

  function getNextEmptySquare(index, previous) {
    // If puzzle is all filled out, return current index
    if (isPuzzleFilled()) {
      console.log("Puzzle is filled.");
      return index;
    }

    // If last square in orientation, start search at beginning
    // TODO: edge case where(0,0) square is not valid
    if (index === 0 || isLastClueSquare(index, activeWord.orientation)) return 0;

    if (overwriteMode) {
      // in overwrite mode, just go to the next square in the word regardless of whether it is occupied        
      return activeWord.orientation === "across" ? index + 1 : index + numCols;

    } else {
      let incrementInterval = activeWord.orientation === "across" ? 1 : numCols;
      let currentWordStart = findWordStart(index, activeWord.orientation);
      let currentWordEnd = findWordEnd(index, activeWord.orientation);

      // Start at current square and go to next empty letter in word
      for (let i = index; i <= currentWordEnd; i = (i + incrementInterval)) {
        if (board[i].input === "") return i;
      }
      // If all filled, go back to any empty letters at the beginning of the word
      for (let i = currentWordStart; i < index; i = (i + incrementInterval)) {
        if (board[i].input === "") return i;
      }

      // If word is all filled out, find next word 
      if (previous) {
        return getNextEmptySquare(getPrevWord(index), true);
      } else {
        return getNextEmptySquare(getNextWord(index));
      }
    }
  }

  function findWordStart(index, orientation) {
    let currentIndex = index;
    if (orientation === "across") {
      while (!gameGrid[currentIndex].acrossStart) {
        currentIndex--;
      }
    } else {
      //orientation is "down"
      while (currentIndex >= numCols && !gameGrid[currentIndex].downStart) {
        console.log(gameGrid[currentIndex]);
        currentIndex = currentIndex - numCols;
      }
    }
    return currentIndex;
  }

  function findWordEnd(index, orientation) {
    let currentIndex = index;
    let wordEnd;
    if (orientation === "across") {
      while (gameGrid[currentIndex].answer !== '.' && currentIndex % numCols !== (numCols - 1)) {
        currentIndex++;
      }
      wordEnd = gameGrid[currentIndex].answer === '.' ? currentIndex - 1 : currentIndex;

    } else {
      //orientation is "down"
      while ((currentIndex + numCols) < (numCols * numRows) && gameGrid[currentIndex].answer !== '.') {
        currentIndex = currentIndex + numCols;
      }
      wordEnd = gameGrid[currentIndex].answer === '.' ? currentIndex - numCols : currentIndex;
    }
    return wordEnd;
  }

  /**
   * Methods for child components to use to toggle state
   */
  function toggleOrientation() {
    const newOrientation = activeWord.orientation === "across" ? "down" : "across";
    dispatch(setActiveWord({
      ...activeWord,
      orientation: newOrientation,
      start: findWordStart(activeWord.focus, newOrientation),
      end: findWordEnd(activeWord.focus, newOrientation)
    }));
  }


  function isLastClueSquare(index, orientation) {
    let currentWordClueDictionaryEntry = mapGridIndexToClueDictionaryEntry(index);
    return currentWordClueDictionaryEntry.isLastClue && findWordEnd(index, orientation) === index;
  }


  function mapGridIndexToClueDictionaryEntry(index) {
    let currentWordStart = findWordStart(index, activeWord.orientation);
    return clueDictionary[activeWord.orientation][gameGrid[currentWordStart].gridNum];
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




  /**
   * For zoomed-in view (mobile option)
   */
  function scrollToWord(index, orientation) {
    let firstLetterOfWord = squareRefs[index].current;
    let startBoundary = orientation === "across" ?
      firstLetterOfWord.getBoundingClientRect().left : firstLetterOfWord.getBoundingClientRect().top;
    let lastLetterOfWord = squareRefs[findWordEnd(index, orientation)].current;
    let endBoundary = orientation === "across" ?
      lastLetterOfWord.getBoundingClientRect().right : lastLetterOfWord.getBoundingClientRect().bottom;
    let outOfBounds = orientation === "across" ?
      window.innerWidth : document.querySelector('.Board').getBoundingClientRect().bottom;
    if (endBoundary > outOfBounds) {
      let lengthOfWord = endBoundary - startBoundary;
      let validBoundaries = orientation === "across" ?
        window.innerWidth : document.querySelector('.Board').offsetHeight;
      if (lengthOfWord <= validBoundaries) {
        lastLetterOfWord.scrollIntoView({
          behavior: "smooth",
          block: orientation === "across" ? (nearBottomOfScreen(firstLetterOfWord) ? "center" : "nearest") : "end",
          inline: orientation === "across" ? "end" : "nearest"
        });
      } else {
        firstLetterOfWord.scrollIntoView({
          behavior: "smooth",
          block: orientation === "across" ? "nearest" : "start",
          inline: orientation === "across" ? "start" : "nearest"
        });
      }
    }
    if (orientation === "across" && nearBottomOfScreen(firstLetterOfWord)) {
      firstLetterOfWord.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "nearest"
      });
    }
  }

  function nearBottomOfScreen(element) {
    return element.getBoundingClientRect().top > 0.8 * document.querySelector('.Board').getBoundingClientRect().bottom;
  }




  const squares = gameGrid.map((square, index) => {
    return (
      <Square key={square.id}
        {...square}
        squareRef={squareRefs[index]}
        handleMouseDown={() => handleMouseDown(square.id)}
        handleFocus={(event) => handleFocus(event, square.id)}
        handleKeyDown={handleKeyDown}
        goToNextSquareAfterInput={goToNextSquareAfterInput}
        handleRerender={centerActiveSquareOnZoom}
        socket={socket}
        saveGame={saveBoard}
      />
    )
  });

  return (
    <div className="Board">
      {squares}
    </div>
  )
}