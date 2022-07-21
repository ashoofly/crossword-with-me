import { createSlice } from '@reduxjs/toolkit';
import data from "../../api/wednesday";

export const numSquares = data.size.rows * data.size.cols;
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
  board: [...Array(numSquares).keys()].map(num => ({
    index: num,
    playerViewClasses: []
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
    return originalClassNames.filter(cn => cn !== className);
  }
}


export const playerSlice = createSlice({
  name: 'player',
  initialState: defaultState,
  reducers: {
    'setActiveWord': (state, action) => {
      state.activeWord = action.payload;
    },
    'markActiveWord': (state, action) => {
      state.board[action.payload.id].playerViewClasses = updateClassNames(
        state.board[action.payload.id].playerViewClasses,
        true,
        "focused-word"
      );
    },
    'markActiveLetter': (state, action) => {
      state.board[action.payload.id].playerViewClasses = updateClassNames(
        state.board[action.payload.id].playerViewClasses,
        true,
        "focused-letter"
      );
    },
    'toggleZoom': (state) => {
      state.zoomActive = !state.zoomActive;
      state.board.map(square => ({
        ...square,
        squareRootClasses: updateClassNames(
          square.playerViewClasses,
          state.zoomActive,
          "zoomed"
        )
      }));
    },
    'toggleRebus': (state, action) => {
      state.rebusActive = !state.rebusActive;
      state.board[action.payload.id].playerViewClasses = updateClassNames(
        state.board[action.payload.id].playerViewClasses,
        state.rebusActive,
        "rebus-square"
      );
    },
    'togglePencil': (state) => {
      state.pencilActive = !state.pencilActive;
    },
    'clearAllFocus': (state) => {
      state.board = state.board.map(square => ({
        ...square,
        playerViewClasses: square.playerViewClasses.filter(cn => cn !== 'focused-letter' && cn !== 'focused-word')
      }));
    }
  }
});

export const {
  markActiveWord,
  markActiveLetter,
  clearAllFocus,
  toggleZoom,
  toggleRebus,
  togglePencil,
  setActiveWord
} = playerSlice.actions;
export default playerSlice.reducer;