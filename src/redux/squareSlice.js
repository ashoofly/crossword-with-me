import { createSlice, current } from '@reduxjs/toolkit';
import data from "../api/wednesday";

export const numSquares = data.size.rows * data.size.cols;

export const squareSlice = createSlice({
  name: 'square',
  initialState: Array(numSquares).fill({
    input: '',
    reveal: false,
    check: false,
    verified: false,
    incorrect: false,
    partial: false,
    classNames: ["square"]
  }),
  reducers: {
    'changeInput': (state, action) => {
        state[action.payload.id].input = action.payload.value
    },
    'requestCheck': (state, action) => {
        state[action.payload.id].request = true
    },
    'requestReveal': (state, action) => {
        state[action.payload.id].reveal = true
    },
    'removeCheck': (state, action) => {
        state[action.payload.id].request = false
    },
    'removeReveal': (state, action) => {
        state[action.payload.id].reveal = false
    },
    'markVerified': (state, action) => {
      state[action.payload.id].verified = true
    },
    'markIncorrect': (state, action) => {
      state[action.payload.id].incorrect = true
    },
    'markPartial': (state, action) => {
      state[action.payload.id].partial = true
    },
    'clearPreviousChecks': (state, action) => {
      state[action.payload.id].incorrect = false
      state[action.payload.id].partial = false
    },
    'addClass': (state, action) => {
      state[action.payload.id].classNames.push(action.payload.className);
    },
    'removeClass': (state, action) => {
      state[action.payload.id].classNames = state[action.payload.id].classNames.filter(cn => cn !== action.payload.className);
    }
  }
})

export const { 
  changeInput, 
  requestCheck, 
  requestReveal, 
  removeCheck, 
  removeReveal 
} = squareSlice.actions;
export default squareSlice.reducer;