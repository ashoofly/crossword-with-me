import { createSlice } from '@reduxjs/toolkit';
import data from "../../api/wednesday";

const numRows = data.size.rows;
const numCols = data.size.cols;
const grid = data.grid;
const gridNums = data.gridnums;
const clues = data.clues;
const answers = data.answers;
let clueDictionary = setupClueDictionary();
let puzzleGrid = createGrid();

/**
 * Sets up clue dictionary, linking the previous and next grid nums for more efficient board navigation later
 * [gridNum as key]: {
 *    clue: ...,
 *    answer: ...,
 *    prevGridNum: ...,
 *    nextGridNum: ...
 * }
 */
function setupClueDictionary() {
  let clueDictionary = {
    across: {},
    down: {}
  };
  const clueStartNum = /(^\d+)\./;
  const acrossAnswers = answers.across;
  const downAnswers = answers.down;

  let orderedGridNumAcross = []
  clues.across.forEach((clue, index) => {
    const m = clueStartNum.exec(clue);
    const key = m[1];
    clueDictionary.across[key] = {
      clue: clue,
      answer: acrossAnswers[index]
    }
    orderedGridNumAcross.push(parseInt(key));
  });
  for (let i = 0; i < orderedGridNumAcross.length; i++) {
    clueDictionary.across[orderedGridNumAcross[i]] = {
      ...clueDictionary.across[orderedGridNumAcross[i]],
      prevGridNum: i === 0 ? -1 : orderedGridNumAcross[i - 1],
      nextGridNum: i + 1 < orderedGridNumAcross.length ? orderedGridNumAcross[i + 1] : -1,
      isLastClue: i + 1 < orderedGridNumAcross.length ? false : true
    }
  }
  let orderedGridNumDown = []
  clues.down.forEach((clue, index) => {
    const m = clueStartNum.exec(clue);
    const key = m[1];
    clueDictionary.down[key] = {
      clue: clue,
      answer: downAnswers[index]
    }
    orderedGridNumDown.push(parseInt(key));
  });
  for (let i = 0; i < orderedGridNumDown.length; i++) {
    clueDictionary.down[orderedGridNumDown[i]] = {
      ...clueDictionary.down[orderedGridNumDown[i]],
      prevGridNum: i === 0 ? -1 : orderedGridNumDown[i - 1],
      nextGridNum: i + 1 < orderedGridNumDown.length ? orderedGridNumDown[i + 1] : -1,
      isLastClue: i + 1 < orderedGridNumDown.length ? false : true
    }
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
function createGrid() {
  let initialSquareProps = Array(numRows * numCols);
  grid.forEach((value, index) => {
    initialSquareProps[index] = {
      id: index,
      gridNum: gridNums[index],
      answer: value,
      acrossStart: (value !== '.' && (index % numCols === 0 || grid[index - 1] === '.')) ? true : false,
      downStart  : (value !== '.' && (index < numCols || grid[index - numCols] === '.')) ? true : false
    };

    if (gridNums[index] !== 0) {
      if (clueDictionary.across[gridNums[index]]) {
        clueDictionary.across[gridNums[index]] = {
          ...clueDictionary.across[gridNums[index]],
          index: index
        }
      }
      if (clueDictionary.down[gridNums[index]]) {
        clueDictionary.down[gridNums[index]] = {
          ...clueDictionary.down[gridNums[index]],
          index: index
        }
      }
    }
  });

  return initialSquareProps;
}


export const puzzleSlice = createSlice({
  name: 'puzzle',
  initialState: {
    clueDictionary: clueDictionary,
    gridNums: gridNums,
    gridInfo: puzzleGrid,
    numCols: numCols,
    numRows: numRows
  },
  reducers: {
    'populateGrid': (state, action) => {
      console.log(action.payload);
      state.grid = createGrid(action.payload.squareRefs);
    },
    'addSquareRefs': (state, action) => {
      state.grid.map( (square, index) => ({
        ...square,
        squareRef: action.payload.squareRefs[index]
      }));
    }  
  }
});

export const {
  populateGrid,
  addSquareRefs
} = puzzleSlice.actions;
export default puzzleSlice.reducer;
