import { createSlice } from '@reduxjs/toolkit';

const defaultState = {
  loaded: false,
  autocheck: false,
  board: [...Array(225).keys()].map( (num) => ({
    initial: true,
    index: num,
    input: '',
    reveal: false,
    check: false,
    verified: false,
    incorrect: false,
    partial: false,
    penciled: false
  })),
  numCols: 15,
  numRows: 15,
  gameGrid: [...Array(225).keys()].map((num) => ({
    id: num,
    gridNum: 0,
    answer: '.'
  })),
  title: "New York Times, hello",
  clueDictionary: {
    across: {

    },
    down: {

    }
  }
};


export const gameSlice = createSlice({
  name: 'game',
  initialState: defaultState,
  reducers: {
    'loadGame': (state, action) => {
      return action.payload;
    },
    'resetGame': (state) => {
      state.autocheck = false;
      state.board = [...Array(state.numRows * state.numCols).keys()].map( (num) => ({
        initial: true,
        index: num,
        input: '',
        reveal: false,
        check: false,
        verified: false,
        incorrect: false,
        partial: false,
        penciled: false
      }));
    },
    'toggleAutocheck': (state) => {
      state.autocheck = !state.autocheck;
    },
    'changeInput': (state, action) => {
        state.board[action.payload.id].initial = false;
        state.board[action.payload.id].source = action.payload.source;
        state.board[action.payload.id].input = action.payload.value;
        state.board[action.payload.id].penciled = action.payload.penciled;
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
    },
    'removeCheck': (state, action) => {
        state.board[action.payload.id].check = false
        state.board[action.payload.id].incorrect = false
        state.board[action.payload.id].partial = false
    },
    'markVerified': (state, action) => {
      state.board[action.payload.id].verified = true
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