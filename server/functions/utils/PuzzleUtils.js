const AdminDatabaseListener = require('./AdminDatabaseListener');

class PuzzleUtils {
  constructor(db) {
    this.db = db;
    this.dbListener = new AdminDatabaseListener(db);
  }

  static weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  static getCurrentDOW() {
    const currentDate = new Date();
    return PuzzleUtils.weekdays[currentDate.getDay()];
  }

  static getPreviousDOW() {
    const yesterday = new Date();
    yesterday.setDate((new Date()).getDate() - 1);
    return PuzzleUtils.weekdays[yesterday.getDay()];
  }

  async isCurrentPuzzleSaved() {
    console.log('[puzzleUtils] Checking if current puzzle is saved');
    const currentDate = new Date();
    const currentDOW = PuzzleUtils.weekdays[currentDate.getDay()];
    console.log(`[puzzleUtils] Looking for current ${currentDOW} puzzle`);

    try {
      const puzzles = await this.dbListener.getDbCollectionOnce('puzzles');
      if (puzzles) {
        const fetchedPuzzle = puzzles[currentDOW];
        if (fetchedPuzzle) {
          const fetchedPuzzleDate = new Date(Date.parse(fetchedPuzzle.date));
          if (currentDate.toDateString() === fetchedPuzzleDate.toDateString()) {
            console.log(`[puzzleUtils] ${currentDate.toDateString()} puzzle already downloaded.`);
            return true;
          }
          console.log(`[puzzleUtils] Saved ${currentDOW} puzzle is for `
                      + `${fetchedPuzzleDate.toDateString()}. New puzzle for ${currentDOW} needed.`);
          return false;
        }
        console.log(`[puzzleUtils] No ${currentDOW} puzzle available`);
        return false;
      }
      console.log('[puzzleUtils] No puzzles found at all');
      return false;
    } catch (error) {
      console.log(error);
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
  static setupClueDictionary(puzzle) {
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
        clue,
        answer: acrossAnswers[index],
      };
      orderedGridNumAcross.push(parseInt(key, 10));
    });
    for (let i = 0; i < orderedGridNumAcross.length; i += 1) {
      clueDictionary.across[orderedGridNumAcross[i]] = {
        ...clueDictionary.across[orderedGridNumAcross[i]],
        prevGridNum: i === 0 ? -1 : orderedGridNumAcross[i - 1],
        nextGridNum: (i + 1) < orderedGridNumAcross.length ? orderedGridNumAcross[i + 1] : -1,
        isLastClue: (i + 1) >= orderedGridNumAcross.length,
      };
    }
    const orderedGridNumDown = [];
    puzzle.clues.down.forEach((clue, index) => {
      const m = clueStartNum.exec(clue);
      const key = m[1];
      clueDictionary.down[key] = {
        clue,
        answer: downAnswers[index],
      };
      orderedGridNumDown.push(parseInt(key, 10));
    });
    for (let i = 0; i < orderedGridNumDown.length; i += 1) {
      clueDictionary.down[orderedGridNumDown[i]] = {
        ...clueDictionary.down[orderedGridNumDown[i]],
        prevGridNum: i === 0 ? -1 : orderedGridNumDown[i - 1],
        nextGridNum: (i + 1) < orderedGridNumDown.length ? orderedGridNumDown[i + 1] : -1,
        isLastClue: (i + 1) >= orderedGridNumAcross.length,
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
  static createGrid(puzzle, clueDictionary) {
    const {
      size: { rows: numRows, cols: numCols },
      grid,
      gridnums,
      circles,
    } = puzzle;
    const initialSquareProps = Array(numRows * numCols);
    grid.forEach((value, index) => {
      initialSquareProps[index] = {
        id: index,
        gridNum: gridnums[index],
        circle: circles ? circles[index] === 1 : false,
        answer: value,
        isPlayable: value !== '.',
        acrossStart: value !== '.' && (index % numCols === 0 || grid[index - 1] === '.'),
        downStart: value !== '.' && (index < numCols || grid[index - numCols] === '.'),
      };

      if (gridnums[index] !== 0) {
        if (clueDictionary.across[gridnums[index]]) {
          // eslint-disable-next-line no-param-reassign
          clueDictionary.across[gridnums[index]] = {
            ...clueDictionary.across[gridnums[index]],
            index,
          };
        }
        if (clueDictionary.down[gridnums[index]]) {
          // eslint-disable-next-line no-param-reassign
          clueDictionary.down[gridnums[index]] = {
            ...clueDictionary.down[gridnums[index]],
            index,
          };
        }
      }
    });
    return initialSquareProps;
  }

  static setupGameBoard(puzzle) {
    const clueDictionary = PuzzleUtils.setupClueDictionary(puzzle);
    const grid = PuzzleUtils.createGrid(puzzle, clueDictionary);
    return { grid, clueDictionary };
  }

  async cleanupOldGames() {
    const now = new Date();
    const lastWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
    const games = await this.dbListener.getDbObjectByIdOnce('games');
    if (games) {
      Object.values(games).forEach(async (game) => {
        const gameDate = new Date(Date.parse(game.date));
        if (gameDate.getTime() <= lastWeek.getTime()) {
          game.players.forEach(async (player) => {
            if (player.owner) {
              // remove game from player owner list
              const gameRef = `players/${player.playerId}/games/owner/${game.dow}`;
              const ownedGame = await this.dbListener.getDbObjectByRefOnce(gameRef);
              if (ownedGame && ownedGame === game.gameId) {
                console.log(`Removing ${gameRef}`);
                this.db.ref(gameRef).remove();
              }
            } else {
              // remove game from player team list
              const teamGameRef = `players/${player.playerId}/games/team/${game.gameId}`;
              const teamGame = await this.dbListener.getDbObjectByRefOnce(teamGameRef);
              if (teamGame) {
                console.log(`Removing ${teamGameRef}`);
                this.db.ref(teamGameRef).remove();
              }
            }
          });
          console.log(`Deleting game ${game.gameId}: ${gameDate}`);
          this.db.ref(`games/${game.gameId}`).remove();
        }
      });
    } else {
      console.log('No old games to remove.');
    }
  }
}

module.exports = PuzzleUtils;
