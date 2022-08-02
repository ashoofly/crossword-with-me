import { createSlice } from '@reduxjs/toolkit';
import { getFocusedWord } from '../../puzzleUtils';

export const povSlice = createSlice({
  name: 'pov',
  initialState: {},
  reducers: {
    'initializePlayerView': (state, action) => {
      return {
        rebusActive: false,
        pencilActive: false,
        zoomActive: false,
        focused: {
          orientation: "across",
          word: [0],
          square: 0,
        },
        numRows: action.payload.numRows,
        numCols: action.payload.numCols,
        board: [...Array(action.payload.numRows * action.payload.numCols).keys()]
          .map(num => ({
            index: num,
            isActiveWord: false,
            isActiveSquare: false,
            ...action.payload.gameGrid[num]
          }))
      };
    },
    'setFocusedSquare': (state, action) => {
      // remove previous focus
      state.focused.word.forEach( index => {
        state.board[index].isActiveSquare = false;
        state.board[index].isActiveWord = false;
      });
      // set new focus
      state.focused = {
        ...state.focused,
        square: action.payload.focus,
        word: getFocusedWord(
          state.board,
          state.numCols,
          state.numRows,
          action.payload.focus, 
          state.focused.orientation
        )
      }
      // highlight new focus
      state.focused.word.forEach( index => {
        if (index === action.payload.focus) {
          state.board[index].isActiveSquare = true;
        } else {
          state.board[index].isActiveWord = true;
        }
      });
    },
    'highlightActiveWord': (state, action) => {
      state.board[action.payload.id].isActiveWord = true;
    },
    'highlightActiveSquare': (state, action) => {
      state.board[action.payload.id].isActiveSquare = true;
    },
    'toggleOrientation': (state) => {
      let newOrientation = state.focused.orientation === "across" ? "down" : "across";
      // remove previous focus
      state.focused.word.forEach( index => {
        state.board[index].isActiveSquare = false;
        state.board[index].isActiveWord = false;
      });
      // toggle orientation & set new focus
      state.focused = {
        ...state.focused, 
        orientation: newOrientation,
        word: getFocusedWord(
          state.board,
          state.numCols,
          state.numRows,
          state.focused.square, 
          newOrientation
        )
      };
      // highlight new focus
      state.focused.word.forEach( index => {
        if (index === state.focused.square) {
          state.board[index].isActiveSquare = true;
        } else {
          state.board[index].isActiveWord = true;
        }
      });
    },
    'toggleZoom': (state) => {
      state.zoomActive = !state.zoomActive;
    },
    'toggleRebus': (state, action) => {
      state.rebusActive = !state.rebusActive;
    },
    'togglePencil': (state) => {
      state.pencilActive = !state.pencilActive;
    }
  }
});

export const {
  initializePlayerView,
  setFocusedSquare,
  toggleZoom,
  toggleRebus,
  togglePencil,
  toggleOrientation
} = povSlice.actions;
export default povSlice.reducer;