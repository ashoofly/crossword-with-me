/* eslint-disable guard-for-in */
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
          console.log(`[puzzleUtils] Saved ${currentDOW} puzzle is for ` +
                      `${fetchedPuzzleDate.toDateString()}. New puzzle for ${currentDOW} needed.`);
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

function getDbObjectPromise(db, collectionType, id) {
  return new Promise((resolve, reject) => {
    getDbObjectById(db, collectionType, id, (successResponse) => {
      resolve(successResponse);
    }, (errorResponse) => {
      reject(errorResponse);
    });
  });
}

function getDbObjectById(db, collectionType, id, successCallback, errorCallback) {
  const objectRef = db.ref(`${collectionType}/${id}`);

  objectRef.once("value", (snapshot) => {
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

  collectionRef.once("value", (snapshot) => {
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
  const circles = puzzle.circles;
  const initialSquareProps = Array(numRows * numCols);
  grid.forEach((value, index) => {
    initialSquareProps[index] = {
      id: index,
      gridNum: gridNums[index],
      circle: circles ? (circles[index] === 1 ? true : false) : false,
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

function saveNewPuzzle(db, puzzle) {
  const { grid, clueDictionary } = setupGameBoard(puzzle);
  console.log("Saving puzzle to Firebase database");
  const puzzleRef = db.ref(`puzzles/${puzzle.dow}`);
  puzzleRef.set({
    ...puzzle,
    gameGrid: grid,
    clueDictionary: clueDictionary,
  });
}

async function resetGameboard(db, dow) {
  const puzzle = await getDbObjectPromise(db, "puzzles", dow);
  saveNewPuzzle(db, puzzle);
}

async function cleanupOldGames(db) {
  const now = new Date();
  const lastWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate()-7);
  const games = await getDbCollectionPromise(db, "games");
  if (games) {
    for (const gameKey of Object.keys(games)) {
      const game = games[gameKey];
      const gameDate = new Date(Date.parse(game.date));
      if (gameDate.getTime() === lastWeek.getTime()) {
        console.log(`Deleting game ${game.gameId}: ${gameDate}`);
        db.ref(`games/${game.gameId}`).remove();

        // remove from player objects too
        const playersRef = db.ref("players");

        // remove from owned games
        const dow = game.dow;
        playersRef.orderByChild(`games/owner/${dow}`).equalTo(game.gameId).once("value", (snapshot) => {
          if (snapshot.exists()) {
            const players = snapshot.val();
            for (const playerId in players) {
              console.log(`Removing players/${playerId}/games/owner/${dow} game: ${game.gameId}`);
              db.ref(`players/${playerId}/games/owner/${dow}`).remove();
            }
          } else {
            console.log(`No player owns ${game.gameId}`);
          }
        });

        // remove from team games
        playersRef.orderByChild(`games/team/${game.gameId}/gameId`).equalTo(game.gameId)
            .once("value", (snapshot) => {
              if (snapshot.exists()) {
                const players = snapshot.val();
                for (const playerId in players) {
                  console.log(`Removing players/${playerId}/games/team/${game.gameId} game`);
                  db.ref(`players/${playerId}/games/team/${game.gameId}`).remove();
                }
              } else {
                console.log(`No team games with gameId ${game.gameId}`);
              }
            });
      }
    }
  } else {
    console.log("No old games to remove.");
  }
}

module.exports = {
  weekdays,
  getCurrentDOW,
  getPreviousDOW,
  isCurrentPuzzleSaved,
  setupGameBoard,
  resetGameboard,
  cleanupOldGames,
};
