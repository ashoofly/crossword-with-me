import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

const defaultState = {
  loaded: false,
  autocheck: false,
  board: [...Array(225).keys()].map((num) => ({
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
  },
  gameId: 0,
  advanceCursor: 0
};




export const gameSlice = createSlice({
  name: 'game',
  initialState: defaultState,
  reducers: {
    'loadGame': (state, action) => {
      return action.payload;
    },
    'saveBoard': (state, action) => {
      state.savedToDB = false;
    },
    'boardSaved': (state, action) => {
      state.savedToDB = true;
    },
    'resetGame': (state) => {
      state.autocheck = false;
      state.board = [...Array(state.numRows * state.numCols).keys()].map((num) => ({
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
      if (action.payload.advanceCursor) {
        state.advanceCursor = state.advanceCursor + 1;
      }
    },
    'requestCheck': (state, action) => {
      state.board[action.payload.id].check = true
    },
    'requestCheckPuzzle': (state) => {
      state.board = state.board.map(square => {
        return (square.input !== '') ? 
          ({
            ...square,
            check: true
          }) 
          : square
      });
    },
    'requestReveal': (state, action) => {
      state.board[action.payload.id].incorrect = false
      state.board[action.payload.id].partial = false
      state.board[action.payload.id].reveal = true
      state.board[action.payload.id].verified = true
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
  setAutocheck,
  saveBoard,
  boardSaved,
  advanceCursor
} = gameSlice.actions;
export default gameSlice.reducer;