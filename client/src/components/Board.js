import React from "react";
import { Square } from "./Square";
import '../styles/common.css';
import "../styles/Board.css";
import { useDispatch, useSelector } from 'react-redux';
import {
  changeInput,
  removeCheck,
  boardSaved
} from '../redux/slices/gameSlice';

import {
  toggleRebus,
  toggleOrientation
} from '../redux/slices/povSlice';
import { grid } from "@mui/system";

export default function Board(props) {
  console.log("Re-rendering Board component.");

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
  const savedToDB = game.savedToDB;
  const advanceCursor = game.advanceCursor;

  const zoomActive = pov.zoomActive;
  const rebusActive = pov.rebusActive;
  const pencilActive = pov.pencilActive;
  const orientation = pov.focused.orientation;
  const focus = pov.focused.square;
  const wordHighlight = pov.focused.word;

  const [squareRefs] = React.useState(Array(numRows * numCols).fill(0).map(() => {
    return React.createRef();
  }));

  function jumpToPreviousWord() {
    jumpToSquareOnBoard(getNextEmptySquare(getPrevWord(focus), true));
  }
  function jumpToNextWord() {
    jumpToSquareOnBoard(getNextEmptySquare(getNextWord(focus)));
  }

  // function saveBoard() {
  //   if (socket === null) return;
  //   socket.emit("save-board", gameId, board);
  // }

  // React.useEffect(() => {
  //   if (overwriteMode && wordHighlight[wordHighlight.length - 1] === focus) {
  //     setOverwriteMode(false);
  //   }
  // }, [wordHighlight, focus]);


  React.useEffect(() => {
    if (socket === null) return;
    if (!savedToDB) {
      socket.emit("save-board", gameId, board);
      dispatch(boardSaved());
    }
  }, [savedToDB]);

  React.useEffect(() => {
    goToNextSquareAfterInput();
  }, [advanceCursor])

  React.useEffect(() => {
    jumpToSquare.current = jumpToSquareOnBoard;
  }, [jumpToSquare, jumpToSquareOnBoard]);

  React.useEffect(() => {
    doToggleOrientation.current = toggleOrientation
  }, [orientation]);

  React.useEffect(() => {
    doHandleKeyDown.current = handleKeyDown
  }, [doHandleKeyDown]);

  React.useEffect(() => {
    goToNextWord.current = jumpToNextWord
  }, [goToNextWord, jumpToNextWord]);

  React.useEffect(() => {
    goToPreviousWord.current = jumpToPreviousWord
  }, [goToPreviousWord, jumpToPreviousWord]);

  // const memoizedFindWordStart = React.useCallback(findWordStart, [gameGrid, numCols]);
  // const memoizedFindWordEnd = React.useCallback(findWordEnd, [gameGrid, numRows, numCols]);
  // const memoizedHighlightActiveWord = React.useCallback(highlightActiveWord, 
  //   [dispatch, numCols, orientation, memoizedFindWordEnd, memoizedFindWordStart]);
  // const memoizedSaveBoard = React.useCallback(saveBoard, [board, gameId, socket]);

  function jumpToSquareOnBoard(index) {
    squareRefs[index].current.focus();
    if (zoomActive) {
      scrollToWord(index, orientation);
    }
  }

  function centerActiveSquareOnZoom() {
    let firstLetterOfWord = squareRefs[focus].current;
    firstLetterOfWord.scrollIntoView({
      behavior: "smooth",
      block: orientation === "down" ? "start" : "center",
      inline: "center"
    });
  }


  function handleKeyDown(e) {
    e.preventDefault();

    if (e.key === " ") {
      dispatch(toggleOrientation());

    } else if (e.key === "Tab" || (e.shiftKey && e.key === "ArrowRight")) {
      jumpToNextWord();

    } else if (e.shiftKey && e.key === "ArrowLeft") {
      jumpToPreviousWord();

    } else if (board[focus].verified) {
      goToNextSquareAfterInput();

    } else if (rebusActive && e.key === "Enter") {
      dispatch(toggleRebus());

    } else if (e.key === "Backspace") {
      setDeleteMode(true);
      let currentIndex = focus;
      if (board[focus].input === '') {
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
        if (rebusActive) {
          removeAnyPreviousChecks(focus);
          let currentInput = board[focus].input;
          let newValue = currentInput + e.key.toUpperCase();
          dispatch(changeInput({ id: focus, value: newValue, source: socket.id, penciled: pencilActive, advanceCursor: true }));
        } else {
          // if letter already in square, go into 'overwrite' mode
          if (board[focus].input !== "") {
            removeAnyPreviousChecks(focus);
            setOverwriteMode(true);
          } else {
            if (overwriteMode) setOverwriteMode(false);
          }
          dispatch(changeInput({ id: focus, value: e.key.toUpperCase(), source: socket.id, penciled: pencilActive, advanceCursor: true }));
        }
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
    console.log(`Rebus active: ${rebusActive}`);
    if (!deleteMode && !rebusActive) {
      let index = getNextEmptySquare(focus);
      jumpToSquareOnBoard(index);
    }
  }

  function getPreviousSquare() {
    if (focus === 0) return 0;

    if (orientation === "across") {
      let current = focus - 1;
      while (!gameGrid[current].isPlayable) {
        current--;
      }
      return current;
    } else {
      // orientation: down
      if (focus > wordHighlight[0]) {
        return focus - numCols;
      } else {
        let prevWordEndIndex = findWordEnd(getPrevWord(focus), orientation);
        return prevWordEndIndex;
      }
    }
  }

  function isPuzzleFilled() {
    return board.filter((square, index) => (square.input === "" && gameGrid[index].isPlayable && !square.verified)).length === 0 ? true : false;
  }

  function getNextEmptySquare(index, previous) {
    // If puzzle is all filled out, return current index
    // if (isPuzzleFilled()) {
    //   console.log("Puzzle is filled.");
    //   return index;
    // }

    // If last square in orientation, start search at beginning
    // TODO: edge case where(0,0) square is not valid
    if (isLastClueSquare(index, orientation)) return 0;

    let incrementInterval = orientation === "across" ? 1 : numCols;


    // if (board[next].verified) {
    //   while(board[next].verified) {
    //     current = next;
    //     next += incrementInterval;
    //   }
    //   if (!gameGrid[next].isPlayable) {
    //     return getNextEmptySquare(getNextWord(current));
    //   }

    // } else 
    if (overwriteMode) {
      let next = index + incrementInterval;
      // in overwrite mode, just go to the next playable square in the word regardless of whether it is occupied       
      if(next < (numCols*numRows) && gameGrid[next].isPlayable && !board[next].verified) {
        return next;
      } else {
        return getNextWord(index);
      }

    } else {
      let currentWordStart = findWordStart(index, orientation);
      let currentWordEnd = findWordEnd(index, orientation);

      // Start at current square and go to next empty letter in word
      for (let i = index; i <= currentWordEnd; i = (i + incrementInterval)) {
        if (board[i].verified) continue;
        if (board[i].input === "") return i;
      }
      // If all filled, go back to any empty letters at the beginning of the word
      for (let i = currentWordStart; i < index; i = (i + incrementInterval)) {
        if (board[i].verified) continue;
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




  function isLastClueSquare(index, orientation) {
    let currentWordClueDictionaryEntry = mapGridIndexToClueDictionaryEntry(index);
    return currentWordClueDictionaryEntry.isLastClue && findWordEnd(index, orientation) === index;
  }


  function mapGridIndexToClueDictionaryEntry(index) {
    let currentWordStart = findWordStart(index, orientation);
    return clueDictionary[orientation][gameGrid[currentWordStart].gridNum];
  }


  function getPrevWord(index) {
    let currentWordClueDictionaryEntry = mapGridIndexToClueDictionaryEntry(index);
    let prevGridNum = currentWordClueDictionaryEntry.prevGridNum;
    if (prevGridNum !== -1) {
      let prevWordStartIndex = clueDictionary[orientation][prevGridNum].index;
      return prevWordStartIndex;
    } else {
      let currentWordStart = findWordStart(index, orientation);
      return currentWordStart;
    }
  }

  function getNextWord(index) {
    let currentWordClueDictionaryEntry = mapGridIndexToClueDictionaryEntry(index);
    let nextGridNum = currentWordClueDictionaryEntry.nextGridNum;
    if (nextGridNum !== -1) {
      let nextWordStartIndex = clueDictionary[orientation][nextGridNum].index;
      return nextWordStartIndex;
    } else {
      let currentWordEnd = findWordEnd(index, orientation);
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
        // handleRerender={centerActiveSquareOnZoom}
        socket={socket}
      />
    )
  });
  return (
    <div className="Board"
      onKeyDown={handleKeyDown}>
      {squares}
    </div>
  )
}