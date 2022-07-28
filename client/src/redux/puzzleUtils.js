
export function getFocusedWord(gameGrid, numCols, numRows, index, orientation) {
  const start = findWordStart(gameGrid, numCols, index, orientation);
  const end = findWordEnd(gameGrid, numCols, numRows, index, orientation);
  let incrementInterval = orientation === "across" ? 1 : numCols;
  let focusedWord = [];
  for (let i = start; i <= end; i = (i + incrementInterval)) {
    focusedWord.push(i);
  }
  return focusedWord;
}

export function findWordStart(gameGrid, numCols, index, orientation) {
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

export function findWordEnd(gameGrid, numCols, numRows, index, orientation) {
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
