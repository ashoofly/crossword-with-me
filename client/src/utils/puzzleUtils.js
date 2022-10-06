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
function mapGridIndexToClueDictionaryEntry(clueDictionary, orientation, gameGrid, index) {
  const currentWordStart = findWordStart(index);
  return clueDictionary[orientation][gameGrid[currentWordStart].gridNum];
}

function isLastClueSquare(index) {
  const currentWordClueDictionaryEntry = mapGridIndexToClueDictionaryEntry(index);
  return currentWordClueDictionaryEntry.isLastClue && findWordEnd(index) === index;
}

export function getPrevWord(clueDictionary, orientation, index) {
  const currentWordClueDictionaryEntry = mapGridIndexToClueDictionaryEntry(index);
  const { prevGridNum } = currentWordClueDictionaryEntry;
  if (prevGridNum !== -1) {
    const prevWordStartIndex = clueDictionary[orientation][prevGridNum].index;
    return prevWordStartIndex;
  }
  const currentWordStart = findWordStart(index);
  return currentWordStart;
}

export function getNextWord(clueDictionary, orientation, index) {
  const currentWordClueDictionaryEntry = mapGridIndexToClueDictionaryEntry(index);
  const { nextGridNum } = currentWordClueDictionaryEntry;
  if (nextGridNum !== -1) {
    const nextWordStartIndex = clueDictionary[orientation][nextGridNum].index;
    return nextWordStartIndex;
  }
  const currentWordEnd = findWordEnd(index);
  return currentWordEnd;
}

export {
  getFocusedWord,
  isPuzzleFilled,
  centerActiveSquareOnZoom,
  findWordStart,
  findWordEnd,
  isLastClueSquare,
};
