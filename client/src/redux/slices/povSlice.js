import { createSlice } from '@reduxjs/toolkit';

const defaultState = {
  rebusActive: false,
  pencilActive: false,
  zoomActive: false,
  activeWord: {
    orientation: "across",
    focus: 0,
    start: 0,
    end: 0
  },
  board: [...Array(225).keys()].map(num => ({
    index: num,
    activeWord: false,
    activeLetter: false
  }))
};

export const povSlice = createSlice({
  name: 'pov',
  initialState: defaultState,
  reducers: {
    'initializePlayerView': (state, action) => {
      return {
        rebusActive: false,
        pencilActive: false,
        zoomActive: false,
        activeWord: {
          orientation: "across",
          focus: 0,
          start: 0,
          end: 0
        },
        board: [...Array(action.payload.numSquares).keys()].map(num => ({
          index: num,
          activeWord: false,
          activeLetter: false
        }))
      };
    },
    'setActiveWord': (state, action) => {
      state.activeWord = action.payload;
    },
    'markActiveWord': (state, action) => {
      state.board[action.payload.id].activeWord = true;
    },
    'markActiveLetter': (state, action) => {
      state.board[action.payload.id].activeLetter = true;
    },
    'toggleZoom': (state) => {
      state.zoomActive = !state.zoomActive;
    },
    'toggleRebus': (state, action) => {
      state.rebusActive = !state.rebusActive;
    },
    'togglePencil': (state) => {
      state.pencilActive = !state.pencilActive;
    },
    'clearAllFocus': (state) => {
      state.board = state.board.map(square => ({
        ...square,
        activeWord: false,
        activeLetter: false
      }));
    }
  }
});

export const {
  initializePlayerView,
  markActiveWord,
  markActiveLetter,
  clearAllFocus,
  toggleZoom,
  toggleRebus,
  togglePencil,
  setActiveWord
} = povSlice.actions;
export default povSlice.reducer;