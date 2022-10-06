import { getPrevWord, findWordStart, findWordEnd, getNextWord, isLastClueSquare } from './puzzleUtils';
import { scrollToWord } from './Layout';

export default class Cursor {
  constructor(game, squareRefs) {
    this.game = game;
    this.squareRefs = squareRefs;
  }

  getNextEmptySquare(board, orientation, index, overwriteMode, previous) {
    // If last square in orientation, remain on square
    if (isLastClueSquare(index)) return index;

    const incrementInterval = orientation === 'across' ? 1 : this.game.numCols;

    if (overwriteMode) {
      const next = index + incrementInterval;
      // in overwrite mode, just go to the next playable square in the word
      // regardless of whether it is occupied
      if (next < (this.game.numCols * this.game.numRows)
          && this.game.gameGrid[next].isPlayable
          && !board[next].verified) {
        return next;
      }
      return getNextWord(index);
    }
    const currentWordStart = findWordStart(index);
    const currentWordEnd = findWordEnd(index);

    // Start at current square and go to next empty letter in word
    for (let i = index; i <= currentWordEnd; i += incrementInterval) {
      if (!board[i].verified && board[i].input === '') return i;
    }
    // If all filled, go back to any empty letters at the beginning of the word
    for (let i = currentWordStart; i < index; i += incrementInterval) {
      if (!board[i].verified && board[i].input === '') return i;
    }

    // If word is all filled out, find next word
    if (previous) {
      return this.getNextEmptySquare(getPrevWord(index), true);
    }
    return this.getNextEmptySquare(getNextWord(index));
  }

  jumpToSquare(index, zoomActive) {
    this.squareRefs[index].current.focus();
    if (zoomActive) {
      scrollToWord(index);
    }
  }

  jumpToPreviousWord(focusedSquare, orientation) {
    const prevWordStart = getPrevWord(focusedSquare, this.clueDictionary, orientation);
    this.jumpToSquare(this.getNextEmptySquare(prevWordStart, true));
  }

  jumpToNextWord(focusedSquare, orientation) {
    const nextWordStart = getNextWord(focusedSquare, this.clueDictionary, orientation);
    this.jumpToSquare(this.getNextEmptySquare(nextWordStart));
  }

  getPreviousSquare(focusedSquare, focusedWord, orientation) {
    if (focusedSquare === 0) return 0;

    if (orientation === 'across') {
      let current = focusedSquare - 1;
      while (!this.game.gameGrid[current].isPlayable) {
        current -= 1;
      }
      return current;
    } else {
      // orientation: down
      if (focusedSquare > focusedWord[0]) {
        return focusedSquare - this.game.numCols;
      } else {
        const prevWordEndIndex = findWordEnd(getPrevWord(focusedSquare));
        return prevWordEndIndex;
      }
    }
  }

  backspace() {
    const index = this.getPreviousSquare();
    this.jumpToSquare(index);
    return index;
  }
}
