/* eslint-disable object-curly-spacing */
/* eslint-disable valid-jsdoc */
/* eslint-disable require-jsdoc */

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

async function isCurrentPuzzleSaved(db) {
  console.log("[puzzleUtils] Checking if current puzzle is saved");
  const currentDate = new Date();
  const currentDOW = weekdays[currentDate.getDay()];
  console.log(`[puzzleUtils] Looking for current ${currentDOW} puzzle`);

  try {
    const puzzles = await getDbCollectionPromise(db, "puzzles");
    if (puzzles) {
      const fetchedPuzzle = puzzles[currentDOW];
      if (fetchedPuzzle) {
        const fetchedPuzzleDate = new Date(Date.parse(fetchedPuzzle.date));
        if (currentDate.toDateString() === fetchedPuzzleDate.toDateString()) {
          console.log(`[puzzleUtils] ${currentDate.toDateString()} puzzle already downloaded.`);
          return true;
        } else {
          console.log(`[puzzleUtils] Saved ${currentDOW} puzzle is for ${fetchedPuzzleDate.toDateString()}. ` +
                      `New puzzle for ${currentDOW} needed.`);
          return false;
        }
      } else {
        console.log(`[puzzleUtils] No ${currentDOW} puzzle available`);
        return false;
      }
    } else {
      console.log("[puzzleUtils] No puzzles found at all");
      return false;
    }
  } catch (error) {
    console.log(error);
    return false;
  }
}

function getDbCollectionPromise(db, collectionType) {
  return new Promise((resolve, reject) => {
    getDbCollection(db, collectionType, (successResponse) => {
      resolve(successResponse);
    }, (errorResponse) => {
      reject(errorResponse);
    });
  });
}

function getDbCollection(db, collectionType, successCallback, errorCallback) {
  const collectionRef = db.ref(`${collectionType}`);

  collectionRef.on("value", (snapshot) => {
    if (snapshot.exists()) {
      successCallback(snapshot.val());
    } else {
      successCallback(null);
    }
  }, (error) => {
    console.log(error);
    errorCallback(error);
  });
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
};
