import { createSlice } from '@reduxjs/toolkit';
import data from "../../api/wednesday";

export const numSquares = data.size.rows * data.size.cols;
const grid = data.grid;

function getSquareRootClasses(index) {
  let squareRootClasses = ['square'];
  if (grid[index] === '.') squareRootClasses.push('block');
  return squareRootClasses;
}


const defaultState = {
  autocheck: false,
  board: [...Array(numSquares).keys()].map( num => ({
    initial: true,
    index: num,
    input: '',
    reveal: false,
    check: false,
    verified: false,
    incorrect: false,
    partial: false,
    penciled: false,
    squareRootClasses: getSquareRootClasses(num),
    squareValueClasses: ['square-value']
  }))
};

function updateClassNames(originalClassNames, conditional, className) {
  if (conditional) {
    if (!originalClassNames.includes(className)) {
      return [...originalClassNames, className];
    } else {
      return originalClassNames;
    }
  } else {
    return originalClassNames.filter (cn => cn !== className);
  }
}

export const gameSlice = createSlice({
  name: 'game',
  initialState: defaultState,
  reducers: {
    'loadGame': (state, action) => {
      return action.payload;
    },
    'resetGame': () => {
      return defaultState;
    },
    'toggleAutocheck': (state) => {
      state.autocheck = !state.autocheck;
    },
    'changeInput': (state, action) => {
        state.board[action.payload.id].initial = false;
        state.board[action.payload.id].source = action.payload.source;
        state.board[action.payload.id].input = action.payload.value;
        state.board[action.payload.id].penciled = action.payload.penciled;
        state.board[action.payload.id].squareValueClasses = updateClassNames(
          state.board[action.payload.id].squareValueClasses,
          action.payload.penciled,
          "penciled-color"
        );
    },
    'requestCheck': (state, action) => {
        state.board[action.payload.id].check = true
    },
    'requestCheckPuzzle': (state) => {
        state.board.map(square => ({
          ...square,
          check: true
        }));
    },
    'requestReveal': (state, action) => {
        state.board[action.payload.id].reveal = true
        state.board[action.payload.id].squareRootClasses = updateClassNames(
          state.board[action.payload.id].squareRootClasses,
          true,
          "revealed-overlay"
        );
    },
    'removeCheck': (state, action) => {
        state.board[action.payload.id].check = false
        state.board[action.payload.id].incorrect = false
        state.board[action.payload.id].partial = false
    },
    'markBlock': (state, action) => {
      state.board[action.payload.id].squareRootClasses = updateClassNames(
        state.board[action.payload.id].squareRootClasses,
        true,
        "block"
      );
    },
    'markVerified': (state, action) => {
      state.board[action.payload.id].verified = true
      state.board[action.payload.id].squareValueClasses = updateClassNames(
        state.board[action.payload.id].squareValueClasses,
        true,
        "verified-color"
      );
    },
    'markIncorrect': (state, action) => {
      state.board[action.payload.id].incorrect = true
    },
    'markPartial': (state, action) => {
      state.board[action.payload.id].partial = true
    },
    'clearPreviousChecks': (state, action) => {
      state.board[action.payload.id].incorrect = false
      state.board[action.payload.id].partial = false
    },
    'setAutocheck': (state, action) => {
      state.autocheck = action.payload.autocheck;
    }
  }
})

export const { 
  loadGame,
  resetGame,
  toggleAutocheck,
  changeInput, 
  requestCheck,
  requestCheckPuzzle, 
  requestReveal, 
  removeCheck, 
  markBlock,
  markVerified,
  markPartial,
  markIncorrect,
  setAutocheck
} = gameSlice.actions;
export default gameSlice.reducer;