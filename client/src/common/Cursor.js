import {
  getPrevWord,
  getNextWord,
  findWordStart,
  findWordEnd,
  isLastClueSquare,
} from '../utils/puzzleUtils';

export default class Cursor {
  constructor(squareRefs) {
    this.squareRefs = squareRefs;
  }

  getNextEmptySquare(game, pov, index, overwriteMode = false, previous = false) {
    const {
      clueDictionary,
      numCols,
      numRows,
      gameGrid,
      board,
    } = game;
    const { orientation } = pov.focused;

    // If last square in orientation, remain on square
    if (isLastClueSquare(
      clueDictionary,
      numCols,
      numRows,
      orientation,
      gameGrid,
      index
    )) return index;

    const incrementInterval = orientation === 'across' ? 1 : game.numCols;

    if (overwriteMode) {
      const next = index + incrementInterval;
      // in overwrite mode, just go to the next playable square in the word
      // regardless of whether it is occupied
      if (next < (numCols * numRows)
          && gameGrid[next].isPlayable
          && !board[next].verified) {
        return next;
      }
      return getNextWord(
        clueDictionary,
        numCols,
        numRows,
        orientation,
        gameGrid,
        index
      );
    }
    const currentWordStart = findWordStart(
      gameGrid,
      numCols,
      index,
      orientation
    );
    const currentWordEnd = findWordEnd(
      gameGrid,
      numCols,
      numRows,
      index,
      orientation
    );

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
      const prevWord = getPrevWord(
        clueDictionary,
        numCols,
        orientation,
        gameGrid,
        index
      );
      return this.getNextEmptySquare(game, pov, prevWord, overwriteMode, true);
    }
    const nextWordStart = getNextWord(
      clueDictionary,
      numCols,
      numRows,
      orientation,
      gameGrid,
      index
    );
    return this.getNextEmptySquare(game, pov, nextWordStart, overwriteMode, false);
  }

  jumpToSquare(index, zoomActive, orientation) {
    this.squareRefs[index].current.focus();
    if (zoomActive) {
      this.scrollToWord(orientation, index);
    }
  }

  jumpToPreviousWord(game, pov, focusedSquare) {
    const {
      clueDictionary,
      numCols,
      gameGrid,
    } = game;
    const { focused, zoomActive } = pov;
    const { orientation } = focused;

    const prevWordStart = getPrevWord(
      clueDictionary,
      numCols,
      orientation,
      gameGrid,
      focusedSquare
    );
    const index = this.getNextEmptySquare(game, pov, prevWordStart, false, true);
    this.jumpToSquare(index, zoomActive, orientation);
  }

  jumpToNextWord(game, pov, focusedSquare) {
    const {
      clueDictionary,
      numCols,
      numRows,
      gameGrid,
    } = game;
    const { focused, zoomActive } = pov;
    const { orientation } = focused;

    const nextWordStart = getNextWord(
      clueDictionary,
      numCols,
      numRows,
      orientation,
      gameGrid,
      focusedSquare
    );
    const index = this.getNextEmptySquare(game, pov, nextWordStart, false, false);
    this.jumpToSquare(index, zoomActive, orientation);
  }

  static getPreviousSquare(game, pov) {
    const {
      clueDictionary,
      numCols,
      numRows,
      gameGrid,
    } = game;
    const { focused } = pov;
    const { orientation, square: focusedSquare, word: focusedWord } = focused;

    if (focusedSquare === 0) return 0;

    if (orientation === 'across') {
      let current = focusedSquare - 1;
      while (!gameGrid[current].isPlayable) {
        current -= 1;
      }
      return current;
    } else {
      // orientation: down
      if (focusedSquare > focusedWord[0]) {
        return focusedSquare - numCols;
      } else {
        const prevWord = getPrevWord(
          clueDictionary,
          numCols,
          orientation,
          gameGrid,
          focusedSquare
        );
        const prevWordEndIndex = findWordEnd(
          gameGrid,
          numCols,
          numRows,
          prevWord,
          orientation
        );
        return prevWordEndIndex;
      }
    }
  }

  backspace(game, pov) {
    const { focused, zoomActive } = pov;
    const { orientation, square: focusedSquare, word: focusedWord } = focused;
    const index = Cursor.getPreviousSquare(game, pov);
    this.jumpToSquare(index, zoomActive, orientation);
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
