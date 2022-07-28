import { createSlice } from '@reduxjs/toolkit';

const defaultState = {
  rebusActive: false,
  pencilActive: false,
  zoomActive: false,
  orientation: "across",
  wordHighlight: [0],
  focus: 0,
  board: [...Array(225).keys()].map(num => ({
    index: num,
    isActiveWord: false,
    isActiveLetter: false
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
        orientation: "across",
        wordHighlight: [0],
        focus: 0,
        board: [...Array(action.payload.numSquares).keys()].map(num => ({
          index: num,
          isActiveWord: false,
          isActiveLetter: false
        }))
      };
    },
    'removeWordHighlight': (state, action) => {
      state.wordHighlight.forEach( index => {
        state.board[index].isActiveLetter = false;
        state.board[index].isActiveWord = false;
      });
    },
    'saveWordHighlight': (state, action) => {
      state.wordHighlight = action.payload.word;
    },
    'setFocus': (state, action) => {
      state.focus = action.payload.focus;
    },
    'markActiveWord': (state, action) => {
      state.board[action.payload.id].isActiveWord = true;
    },
    'markActiveLetter': (state, action) => {
      state.board[action.payload.id].isActiveLetter = true;
    },
    'toggleOrientation': (state) => {
      state.orientation = state.orientation === "across" ? "down" : "across";
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
  resetActiveWord,
  removeWordHighlight,
  setFocus,
  saveWordHighlight,
  toggleOrientation
} = povSlice.actions;
export default povSlice.reducer;