function findWordStart(gameGrid, numCols, index, orientation) {
  let currentIndex = index;
  if (orientation === 'across') {
    while (!gameGrid[currentIndex].acrossStart) {
      currentIndex -= 1;
    }
  } else {
    // orientation is "down"
    while (currentIndex >= numCols && !gameGrid[currentIndex].downStart) {
      currentIndex -= numCols;
    }
  }
  return currentIndex;
}

function findWordEnd(gameGrid, numCols, numRows, index, orientation) {
  let currentIndex = index;
  let wordEnd;
  if (orientation === 'across') {
    while (gameGrid[currentIndex].answer !== '.' && currentIndex % numCols !== (numCols - 1)) {
      currentIndex += 1;
    }
    wordEnd = gameGrid[currentIndex].answer === '.' ? currentIndex - 1 : currentIndex;
  } else {
    // orientation is "down"
    while ((currentIndex + numCols) < (numCols * numRows) && gameGrid[currentIndex].answer !== '.') {
      currentIndex += numCols;
    }
    wordEnd = gameGrid[currentIndex].answer === '.' ? currentIndex - numCols : currentIndex;
  }
  return wordEnd;
}

/**
 * Used in P.O.V. slice reducer to set focused word
 */
function getFocusedWord(gameGrid, numCols, numRows, index, orientation) {
  const start = findWordStart(gameGrid, numCols, index, orientation);
  const end = findWordEnd(gameGrid, numCols, numRows, index, orientation);
  const incrementInterval = orientation === 'across' ? 1 : numCols;
  const focusedWord = [];
  for (let i = start; i <= end; i += incrementInterval) {
    focusedWord.push(i);
  }
  return focusedWord;
}

function isPuzzleFilled(board, gameGrid) {
  const unfilledSquare = board.filter((square, index) => (
    square.input === ''
     && gameGrid[index].isPlayable
     && !square.verified));
  return unfilledSquare.length === 0;
}

function centerActiveSquareOnZoom(squareRefs, focus, orientation) {
  const firstLetterOfWord = squareRefs[focus].current;
  firstLetterOfWord.scrollIntoView({
    behavior: 'smooth',
    block: orientation === 'down' ? 'start' : 'center',
    inline: 'center',
  });
}

// TODO: max call stack size exceeded here
function mapGridIndexToClueDictionaryEntry(clueDictionary, numCols, orientation, gameGrid, index) {
  const currentWordStart = findWordStart(gameGrid, numCols, index, orientation);
  return clueDictionary[orientation][gameGrid[currentWordStart].gridNum];
}

function isLastClue(clueDictionary, numCols, numRows, orientation, gameGrid, index) {
  const currentWordClueDictionaryEntry = mapGridIndexToClueDictionaryEntry(
    clueDictionary,
    numCols,
    orientation,
    gameGrid,
    index
  );
  const wordEnd = findWordEnd(
    gameGrid,
    numCols,
    numRows,
    index,
    orientation
  );
  return currentWordClueDictionaryEntry
    ? (currentWordClueDictionaryEntry.nextGridNum === -1) : false;
}

function isLastClueSquare(clueDictionary, numCols, numRows, orientation, gameGrid, index) {
  const currentWordClueDictionaryEntry = mapGridIndexToClueDictionaryEntry(
    clueDictionary,
    numCols,
    orientation,
    gameGrid,
    index
  );
  const wordEnd = findWordEnd(
    gameGrid,
    numCols,
    numRows,
    index,
    orientation
  );
  return currentWordClueDictionaryEntry
    ? (currentWordClueDictionaryEntry.nextGridNum === -1 && wordEnd === index) : false;
}

export function getPrevWord(clueDictionary, numCols, orientation, gameGrid, index) {
  let currentWordClueDictionaryEntry = mapGridIndexToClueDictionaryEntry(
    clueDictionary,
    numCols,
    orientation,
    gameGrid,
    index
  );
  if (currentWordClueDictionaryEntry) {
    const { prevGridNum } = currentWordClueDictionaryEntry;
    if (prevGridNum !== -1) {
      const prevWordStartIndex = clueDictionary[orientation][prevGridNum].index;
      return prevWordStartIndex;
    } else {
      // this is first clue
      const currentWordStart = findWordStart(gameGrid, numCols, index, orientation);
      return currentWordStart;
    }
  } else {
    // handle errors in xword.info data by going to previous valid clue entry if any are missing
    let prevIndex = index;
    while (!currentWordClueDictionaryEntry) {
      prevIndex -= 1;
      currentWordClueDictionaryEntry = mapGridIndexToClueDictionaryEntry(
        clueDictionary,
        numCols,
        orientation,
        gameGrid,
        prevIndex
      );
    }
    return currentWordClueDictionaryEntry.index;
  }
}

export function getNextWord(clueDictionary, numCols, numRows, orientation, gameGrid, index) {
  let currentWordClueDictionaryEntry = mapGridIndexToClueDictionaryEntry(
    clueDictionary,
    numCols,
    orientation,
    gameGrid,
    index
  );
  if (currentWordClueDictionaryEntry) {
    const { nextGridNum } = currentWordClueDictionaryEntry;
    if (nextGridNum !== -1) {
      const nextWordStartIndex = clueDictionary[orientation][nextGridNum].index;
      return nextWordStartIndex;
    } else {
      // this is last clue
      const currentWordEnd = findWordEnd(
        gameGrid,
        numCols,
        numRows,
        index,
        orientation
      );
      return currentWordEnd;
    }
  } else {
    // handle errors in xword.info data by going to next valid clue entry if any are missing
    let nextIndex = index;
    while (!currentWordClueDictionaryEntry) {
      nextIndex += 1;
      currentWordClueDictionaryEntry = mapGridIndexToClueDictionaryEntry(
        clueDictionary,
        numCols,
        orientation,
        gameGrid,
        nextIndex
      );
    }
    return currentWordClueDictionaryEntry.index;
  }
}

export {
  getFocusedWord,
  isPuzzleFilled,
  centerActiveSquareOnZoom,
  findWordStart,
  findWordEnd,
  isLastClue,
  isLastClueSquare,
};
