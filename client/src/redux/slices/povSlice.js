import { createSlice } from '@reduxjs/toolkit';
import { getFocusedWord } from '../../utils/puzzleUtils';

const defaultState = {
  playerVerified: false,
  defaultFocus: 0,
  rebusActive: false,
  pencilActive: false,
  zoomActive: false,
  focused: {},
  numRows: 0,
  numCols: 0,
  board: [],
  teamGames: [],
};

export const povSlice = createSlice({
  name: 'pov',
  initialState: defaultState,
  reducers: {
    playerVerified: (state, action) => {
      state.playerVerified = action.payload.playerVerified;
    },
    initializePlayerView: (state, action) => {
      const focusedWord = getFocusedWord(
        action.payload.gameGrid,
        action.payload.numCols,
        action.payload.numRows,
        action.payload.focus,
        'across'
      );
      return {
        ...state,
        defaultFocus: action.payload.focus,
        rebusActive: false,
        pencilActive: false,
        zoomActive: false,
        focused: {
          orientation: 'across',
          word: focusedWord,
          square: action.payload.focus,
        },
        numRows: action.payload.numRows,
        numCols: action.payload.numCols,
        board: [...Array(action.payload.numRows * action.payload.numCols).keys()]
          .map(num => ({
            index: num,
            isActiveWord: num !== action.payload.focus && focusedWord.includes(num),
            isActiveSquare: num === action.payload.focus,
            ...action.payload.gameGrid[num],
          })),
      };
    },
    setFocusedSquare: (state, action) => {
      state.focused = {
        ...state.focused,
        square: action.payload.focus,
        word: getFocusedWord(
          state.board,
          state.numCols,
          state.numRows,
          action.payload.focus,
          state.focused.orientation
        ),
      };
    },
    setTeamGames: (state, action) => {
      state.teamGames = Object.values(action.payload.teamGames);
    },
    highlightActiveWord: (state, action) => {
      state.board[action.payload.id].isActiveWord = true;
    },
    highlightActiveSquare: (state, action) => {
      state.board[action.payload.id].isActiveSquare = true;
    },
    toggleOrientation: state => {
      const newOrientation = state.focused.orientation === 'across' ? 'down' : 'across';
      state.focused = {
        ...state.focused,
        orientation: newOrientation,
        word: getFocusedWord(
          state.board,
          state.numCols,
          state.numRows,
          state.focused.square,
          newOrientation
        ),
      };
    },
    toggleZoom: state => {
      state.zoomActive = !state.zoomActive;
    },
    toggleRebus: state => {
      state.rebusActive = !state.rebusActive;
    },
    togglePencil: state => {
      state.pencilActive = !state.pencilActive;
    },
  },
});

export const povActions = povSlice.actions;
export const povReducer = povSlice.reducer;
