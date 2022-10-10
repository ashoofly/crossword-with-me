import {
  getPrevWord,
  getNextWord,
  findWordStart,
  findWordEnd,
  isLastClueSquare,
} from '../utils/puzzleUtils';

export default class Cursor {
  constructor(game, squareRefs, overwriteMode, zoomActive) {
    this.game = game;
    this.squareRefs = squareRefs;
    this.overwriteMode = overwriteMode;
    this.zoomActive = zoomActive;
  }

  getNextEmptySquare(orientation, index, previous) {
    // If last square in orientation, remain on square
    if (isLastClueSquare(
      this.game.clueDictionary,
      this.game.numCols,
      this.game.numRows,
      orientation,
      this.game.gameGrid,
      index
    )) return index;

    const incrementInterval = orientation === 'across' ? 1 : this.game.numCols;

    if (this.overwriteMode) {
      const next = index + incrementInterval;
      // in overwrite mode, just go to the next playable square in the word
      // regardless of whether it is occupied
      if (next < (this.game.numCols * this.game.numRows)
          && this.game.gameGrid[next].isPlayable
          && !this.game.board[next].verified) {
        return next;
      }
      return getNextWord(
        this.game.clueDictionary,
        this.game.numCols,
        this.game.numRows,
        orientation,
        this.game.gameGrid,
        index
      );
    }
    const currentWordStart = findWordStart(
      this.game.gameGrid,
      this.game.numCols,
      index,
      orientation
    );
    const currentWordEnd = findWordEnd(
      this.game.gameGrid,
      this.game.numCols,
      this.game.numRows,
      index,
      orientation
    );

    // Start at current square and go to next empty letter in word
    for (let i = index; i <= currentWordEnd; i += incrementInterval) {
      if (!this.game.board[i].verified && this.game.board[i].input === '') return i;
    }
    // If all filled, go back to any empty letters at the beginning of the word
    for (let i = currentWordStart; i < index; i += incrementInterval) {
      if (!this.game.board[i].verified && this.game.board[i].input === '') return i;
    }

    // If word is all filled out, find next word
    if (previous) {
      const prevWord = getPrevWord(
        this.game.clueDictionary,
        this.game.numCols,
        orientation,
        this.game.gameGrid,
        index
      );
      return this.getNextEmptySquare(orientation, prevWord, true);
    }
    const nextWordStart = getNextWord(
      this.game.clueDictionary,
      this.game.numCols,
      this.game.numRows,
      orientation,
      this.game.gameGrid,
      index
    );
    return this.getNextEmptySquare(orientation, nextWordStart);
  }

  jumpToSquare(index, zoomActive, orientation) {
    this.squareRefs[index].current.focus();
    if (zoomActive) {
      this.scrollToWord(orientation, index);
    }
  }

  jumpToPreviousWord(focusedSquare, orientation) {
    const prevWordStart = getPrevWord(
      this.game.clueDictionary,
      this.game.numCols,
      orientation,
      this.game.gameGrid,
      focusedSquare
    );
    const index = this.getNextEmptySquare(orientation, prevWordStart, true);
    this.jumpToSquare(index, this.zoomActive, orientation);
  }

  jumpToNextWord(focusedSquare, orientation) {
    const nextWordStart = getNextWord(
      this.game.clueDictionary,
      this.game.numCols,
      this.game.numRows,
      orientation,
      this.game.gameGrid,
      focusedSquare
    );
    const index = this.getNextEmptySquare(orientation, nextWordStart);
    this.jumpToSquare(index, this.zoomActive, orientation);
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
        const prevWord = getPrevWord(
          this.game.clueDictionary,
          this.game.numCols,
          orientation,
          this.game.gameGrid,
          focusedSquare
        );
        const prevWordEndIndex = findWordEnd(
          this.game.gameGrid,
          this.game.numCols,
          this.game.numRows,
          prevWord,
          orientation
        );
        return prevWordEndIndex;
      }
    }
  }

  backspace(focusedSquare, focusedWord, orientation) {
    const index = this.getPreviousSquare(focusedSquare, focusedWord, orientation);
    this.jumpToSquare(index, this.zoomActive, orientation);
    return index;
  }

  static __nearBottomOfScreen(element) {
    return element.getBoundingClientRect().top > 0.8 * document.querySelector('.Board').getBoundingClientRect().bottom;
  }

  static __getBlockProperty(orientation, firstLetterOfWord) {
    if (orientation === 'across') {
      if (Cursor.__nearBottomOfScreen(firstLetterOfWord)) {
        return 'center';
      } else {
        return 'nearest';
      }
    } else {
      return 'end';
    }
  }

  /**
   * For zoomed-in view (mobile option)
   */
  scrollToWord(orientation, index) {
    const firstLetterOfWord = this.squareRefs[index].current;
    const startBoundary = orientation === 'across'
      ? firstLetterOfWord.getBoundingClientRect().left
      : firstLetterOfWord.getBoundingClientRect().top;
    const wordEnd = findWordEnd(
      this.game.gameGrid,
      this.game.numCols,
      this.game.numRows,
      index,
      orientation
    );
    const lastLetterOfWord = this.squareRefs[wordEnd].current;
    const endBoundary = orientation === 'across'
      ? lastLetterOfWord.getBoundingClientRect().right
      : lastLetterOfWord.getBoundingClientRect().bottom;
    const outOfBounds = orientation === 'across'
      ? window.innerWidth : document.querySelector('.Board').getBoundingClientRect().bottom;
    if (endBoundary > outOfBounds) {
      const lengthOfWord = endBoundary - startBoundary;
      const validBoundaries = orientation === 'across'
        ? window.innerWidth : document.querySelector('.Board').offsetHeight;
      if (lengthOfWord <= validBoundaries) {
        lastLetterOfWord.scrollIntoView({
          behavior: 'smooth',
          block: Cursor.__getBlockProperty(orientation, firstLetterOfWord),
          inline: orientation === 'across' ? 'end' : 'nearest',
        });
      } else {
        firstLetterOfWord.scrollIntoView({
          behavior: 'smooth',
          block: orientation === 'across' ? 'nearest' : 'start',
          inline: orientation === 'across' ? 'start' : 'nearest',
        });
      }
    }
    if (orientation === 'across' && Cursor.__nearBottomOfScreen(firstLetterOfWord)) {
      firstLetterOfWord.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest',
      });
    }
  }
}
