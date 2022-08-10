/* eslint-disable object-curly-spacing */
/* eslint-disable valid-jsdoc */
/* eslint-disable require-jsdoc */
const {ref, get} = require("firebase/database");

const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function getCurrentDOW() {
  const currentDate = new Date();
  return weekdays[currentDate.getDay()];
}

function getPreviousDOW() {
  const yesterday = new Date();
  yesterday.setDate((new Date()).getDate()-1);
  return weekdays[yesterday.getDay()];
}

function isGameCurrent(gameId) {
  // const today = new Date((new Date()).toDateString());
  // return today.getTime() === (new Date(dateString)).getTime();

  

}

async function isCurrentPuzzleSaved(db) {
  const currentDate = new Date();
  const currentDOW = weekdays[currentDate.getDay()];
  console.log(`Looking for current ${currentDOW} puzzle`);

  const snapshot = await get(ref(db, "puzzles/" + currentDOW));
  if (snapshot.exists()) {
    const fetchedPuzzle = snapshot.val();
    const fetchedPuzzleDate = new Date(Date.parse(fetchedPuzzle.date));
    if (currentDate.toDateString() === fetchedPuzzleDate.toDateString()) {
      console.log(`${currentDate.toDateString()} puzzle already downloaded.`);
      return true;
    } else {
      console.log(`Saved ${currentDOW} puzzle is for ${fetchedPuzzleDate.toDateString()}. ` +
                  `New puzzle for ${currentDOW} needed.`);
      return false;
    }
  } else {
    console.log(`No ${currentDOW} puzzle available`);
    return false;
  }
}


/**
 * Sets up clue dictionary, linking the previous and next grid nums for more efficient board
 * navigation later
 * [gridNum as key]: {
 *    clue: ...,
 *    answer: ...,
 *    prevGridNum: ...,
 *    nextGridNum: ...
 * }
 */
function setupClueDictionary(puzzle) {
  const clueDictionary = {
    across: {},
    down: {},
  };
  const clueStartNum = /(^\d+)\./;
  const acrossAnswers = puzzle.answers.across;
  const downAnswers = puzzle.answers.down;

  const orderedGridNumAcross = [];
  puzzle.clues.across.forEach((clue, index) => {
    const m = clueStartNum.exec(clue);
    const key = m[1];
    clueDictionary.across[key] = {
      clue: clue,
      answer: acrossAnswers[index],
    };
    orderedGridNumAcross.push(parseInt(key));
  });
  for (let i = 0; i < orderedGridNumAcross.length; i++) {
    clueDictionary.across[orderedGridNumAcross[i]] = {
      ...clueDictionary.across[orderedGridNumAcross[i]],
      prevGridNum: i === 0 ? -1 : orderedGridNumAcross[i - 1],
      nextGridNum: i + 1 < orderedGridNumAcross.length ? orderedGridNumAcross[i + 1] : -1,
      isLastClue: i + 1 < orderedGridNumAcross.length ? false : true,
    };
  }
  const orderedGridNumDown = [];
  puzzle.clues.down.forEach((clue, index) => {
    const m = clueStartNum.exec(clue);
    const key = m[1];
    clueDictionary.down[key] = {
      clue: clue,
      answer: downAnswers[index],
    };
    orderedGridNumDown.push(parseInt(key));
  });
  for (let i = 0; i < orderedGridNumDown.length; i++) {
    clueDictionary.down[orderedGridNumDown[i]] = {
      ...clueDictionary.down[orderedGridNumDown[i]],
      prevGridNum: i === 0 ? -1 : orderedGridNumDown[i - 1],
      nextGridNum: i + 1 < orderedGridNumDown.length ? orderedGridNumDown[i + 1] : -1,
      isLastClue: i + 1 < orderedGridNumDown.length ? false : true,
    };
  }
  return clueDictionary;
}

/**
 * Sets up state for each square:
 * - marks word starts to facilitate board navigation
 * - populates answer value
 * - populates grid reference number
 * Also updates clue dictionary to include index for each grid number
 *
 * @returns
 */
function createGrid(puzzle, clueDictionary) {
  const numRows = puzzle.size.rows;
  const numCols = puzzle.size.cols;
  const grid = puzzle.grid;
  const gridNums = puzzle.gridnums;
  const initialSquareProps = Array(numRows * numCols);
  grid.forEach((value, index) => {
    initialSquareProps[index] = {
      id: index,
      gridNum: gridNums[index],
      answer: value,
      isPlayable: (value !== ".") ? true : false,
      acrossStart: (value !== "." && (index % numCols === 0 || grid[index - 1] === ".")) ? true : false,
      downStart: (value !== "." && (index < numCols || grid[index - numCols] === ".")) ? true : false,
    };

    if (gridNums[index] !== 0) {
      if (clueDictionary.across[gridNums[index]]) {
        clueDictionary.across[gridNums[index]] = {
          ...clueDictionary.across[gridNums[index]],
          index: index,
        };
      }
      if (clueDictionary.down[gridNums[index]]) {
        clueDictionary.down[gridNums[index]] = {
          ...clueDictionary.down[gridNums[index]],
          index: index,
        };
      }
    }
  });
  return initialSquareProps;
}

function setupGameBoard(puzzle) {
  const clueDictionary = setupClueDictionary(puzzle);
  const grid = createGrid(puzzle, clueDictionary);
  return { grid, clueDictionary };
}


module.exports = {
  weekdays,
  getCurrentDOW,
  getPreviousDOW,
  isCurrentPuzzleSaved,
  setupGameBoard,
  isGameCurrent
};
