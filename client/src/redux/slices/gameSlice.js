import { createSlice } from '@reduxjs/toolkit';

const defaultState = {
  loaded: false,
  autocheck: false,
  savedBoardToDB: true,
  board: [...Array(225).keys()].map(num => ({
    initial: true,
    index: num,
    input: '',
    reveal: false,
    check: false,
    verified: false,
    incorrect: false,
    partial: false,
    penciled: false,
    activeWordColors: [],
    activeLetterColors: [],
  })),
  numCols: 15,
  numRows: 15,
  gameGrid: [...Array(225).keys()].map(num => ({
    acrossStart: true,
    answer: 'A',
    downStart: true,
    gridNum: 1,
    circle: false,
    id: num,
    isPlayable: true,
  })),
  title: 'New York Times, hello',
  clueDictionary: {
    across: [
      null,
      {
        answer: 'BOOED',
        clue: '1. Expressed displeasure, as for an opposing team',
        index: 0,
        isLastClue: false,
        nextGridNum: 6,
        prevGridNum: -1,
      },
    ],
    down: [],
  },
  gameId: 0,
  advanceCursor: 0,
  mostRecentAction: {
    initial: true,
    gameId: 0,
    scope: 'word',
    state: {},
    type: 'exampleAction',
  },
  players: [{
    displayName: 'Fred Rogers',
    owner: true,
    playerId: 'abc123',
    currentFocus: {
      orientation: 'across',
      square: 0,
      word: [0, 1, 2, 3, 4],
    },
    color: 'blue',
    online: true,
  }],
};

export const gameSlice = createSlice({
  name: 'game',
  initialState: defaultState,
  reducers: {
    addPlayerToGame: (state, action) => {
      if (action.payload.gameId === state.gameId) {
        if (!state.players.find(player => player.playerId === action.payload.player.playerId)) {
          state.players.push(action.payload.player);
        }
      }
    },
    enteringPlayer: (state, action) => {
      if (action.payload.gameId === state.gameId) {
        state.players = state.players.map(player => (
          action.payload.playerId === player.playerId
            ? { ...player, online: true }
            : player
        ));
      }
    },
    exitingPlayer: (state, action) => {
      if (action.payload.gameId === state.gameId) {
        const playerInfo = state.players.find(p => p.playerId === action.payload.playerId);
        const playerColor = playerInfo.color;
        const playerFocus = playerInfo.currentFocus;

        // remove player highlighted cursor
        if (playerFocus) {
          playerFocus.word.forEach(index => {
            state.board[index].activeWordColors = state.board[index].activeWordColors.filter(
              color => color !== playerColor
            );
            state.board[index].activeLetterColors = state.board[index].activeLetterColors.filter(
              color => color !== playerColor
            );
          });
        }
        state.players = state.players.map(player => (
          action.payload.playerId === player.playerId
            ? { ...player, online: false }
            : player
        ));
      }
    },
    updatePlayerFocus: (state, action) => {
      if (action.payload.gameId === state.gameId) {
        const playerInfo = state.players.find(p => p.playerId === action.payload.playerId);
        if (!playerInfo) return;

        const playerColor = playerInfo.color;
        const playerFocus = playerInfo.currentFocus;

        // remove player's previous highlighted cursor
        if (playerFocus) {
          playerFocus.word.forEach(index => {
            const { activeWordColors } = state.board[index];
            const { activeLetterColors } = state.board[index];

            if (activeWordColors) {
              state.board[index].activeWordColors = activeWordColors.filter(
                color => color !== playerColor
              );
            }
            if (activeLetterColors) {
              state.board[index].activeLetterColors = activeLetterColors.filter(
                color => color !== playerColor
              );
            }
          });
        }

        // add highlight to player's current focus
        action.payload.currentFocus.word.forEach(index => {
          let { activeWordColors } = state.board[index];
          if (!activeWordColors) {
            activeWordColors = [];
          }
          let { activeLetterColors } = state.board[index];
          if (!activeLetterColors) {
            activeLetterColors = [];
          }
          if (index !== action.payload.currentFocus.square) {
            if (!activeWordColors.includes(playerColor)) {
              activeWordColors.push(playerColor);
            }
          } else {
            if (!activeLetterColors.includes(playerColor)) {
              activeLetterColors.push(playerColor);
            }
          }
          state.board[index].activeWordColors = activeWordColors;
          state.board[index].activeLetterColors = activeLetterColors;
        });

        state.players = state.players.map(player => (
          action.payload.playerId === player.playerId
            ? { ...player, currentFocus: action.payload.currentFocus }
            : player
        ));
      }
      if (action.payload.source !== 'external') {
        state.savedBoardToDB = false;
      }
    },
    loadGame: (state, action) => action.payload,
    gameSaved: state => {
      state.savedBoardToDB = true;
    },
    resetGame: (state, action) => {
      if (action.payload.gameId === state.gameId) {
        state.autocheck = false;
        state.board = [...Array(state.numRows * state.numCols).keys()].map(num => ({
          initial: true,
          index: num,
          input: '',
          reveal: false,
          check: false,
          verified: false,
          incorrect: false,
          partial: false,
          penciled: false,
        }));
        if (action.payload.source !== 'external') {
          state.savedBoardToDB = false;
          state.mostRecentAction = {
            gameId: state.gameId,
            type: 'resetGame',
            payload: action.payload,
          };
        }
      }
    },
    toggleAutocheck: (state, action) => {
      if (action.payload.gameId === state.gameId) {
        state.autocheck = !state.autocheck;
        if (action.payload.source !== 'external') {
          state.savedBoardToDB = false;
          state.mostRecentAction = {
            gameId: state.gameId,
            type: 'toggleAutocheck',
            payload: action.payload,
          };
        }
      }
    },
    changeInput: (state, action) => {
      if (action.payload.gameId === state.gameId) {
        state.board[action.payload.id].initial = false;
        state.board[action.payload.id].input = action.payload.value;
        state.board[action.payload.id].penciled = action.payload.penciled;
        state.board[action.payload.id].color = action.payload.color;
        state.board[action.payload.id].check = false;
        state.board[action.payload.id].incorrect = false;
        state.board[action.payload.id].partial = false;

        if (action.payload.source !== 'external') {
          if (action.payload.advanceCursor) {
            state.advanceCursor += 1;
          }
          state.savedBoardToDB = false;
          state.mostRecentAction = {
            gameId: state.gameId,
            type: 'changeInput',
            payload: action.payload,
          };
        }
      }
    },
    requestCheckSquare: (state, action) => {
      if (action.payload.gameId === state.gameId) {
        if (state.board[action.payload.id].input !== '') {
          state.board[action.payload.id].check = true;
        }
        if (action.payload.source !== 'external') {
          state.savedBoardToDB = false;
          state.mostRecentAction = {
            gameId: action.payload.gameId,
            type: 'requestCheckSquare',
            payload: action.payload,
          };
        }
      }
    },
    requestCheckWord: (state, action) => {
      if (action.payload.gameId === state.gameId) {
        action.payload.word.forEach(index => {
          if (state.board[index].input !== '') {
            state.board[index].check = true;
          }
        });
        if (action.payload.source !== 'external') {
          state.savedBoardToDB = false;
          state.mostRecentAction = {
            gameId: action.payload.gameId,
            type: 'requestCheckWord',
            payload: action.payload,
          };
        }
      }
    },
    requestCheckPuzzle: (state, action) => {
      if (action.payload.gameId === state.gameId) {
        state.board = state.board.map(square => (
          (square.input !== '')
            ? ({
              ...square,
              check: true,
            })
            : square
        ));
        if (action.payload.source !== 'external') {
          state.savedBoardToDB = false;
          state.mostRecentAction = {
            gameId: action.payload.gameId,
            type: 'requestCheckPuzzle',
            payload: action.payload,
          };
        }
      }
    },
    requestRevealSquare: (state, action) => {
      if (action.payload.gameId === state.gameId) {
        if (state.board[action.payload.id].input === state.gameGrid[action.payload.id].answer) {
          state.board[action.payload.id].check = true;
        } else {
          state.board[action.payload.id].incorrect = false;
          state.board[action.payload.id].partial = false;
          state.board[action.payload.id].reveal = true;
          state.board[action.payload.id].verified = true;
        }
        if (action.payload.source !== 'external') {
          state.savedBoardToDB = false;
          state.mostRecentAction = {
            gameId: action.payload.gameId,
            type: 'requestRevealSquare',
            payload: action.payload,
          };
        }
      }
    },
    requestRevealWord: (state, action) => {
      if (action.payload.gameId === state.gameId) {
        action.payload.word.forEach(i => {
          if (!state.board[i].reveal && !state.board[i].verified) {
            if (state.board[i].input === state.gameGrid[i].answer) {
              state.board[i].check = true;
            } else {
              state.board[i].incorrect = false;
              state.board[i].partial = false;
              state.board[i].reveal = true;
              state.board[i].verified = true;
            }
          }
        });
        if (action.payload.source !== 'external') {
          state.savedBoardToDB = false;
          state.mostRecentAction = {
            gameId: action.payload.gameId,
            type: 'requestRevealWord',
            payload: action.payload,
          };
        }
      }
    },
    requestRevealPuzzle: (state, action) => {
      if (action.payload.gameId === state.gameId) {
        state.board.forEach((square, i) => {
          if (state.gameGrid[i].isPlayable && !state.board[i].reveal && !state.board[i].verified) {
            if (state.board[i].input === state.gameGrid[i].answer) {
              state.board[i].check = true;
            } else {
              state.board[i].incorrect = false;
              state.board[i].partial = false;
              state.board[i].reveal = true;
              state.board[i].verified = true;
            }
          }
        });
        if (action.payload.source !== 'external') {
          state.savedBoardToDB = false;
          state.mostRecentAction = {
            gameId: action.payload.gameId,
            type: 'requestRevealPuzzle',
            payload: action.payload,
          };
        }
      }
    },
    markVerified: (state, action) => {
      if (action.payload.gameId === state.gameId) {
        state.board[action.payload.id].verified = true;
        state.savedBoardToDB = false;
      }
    },
    markIncorrect: (state, action) => {
      if (action.payload.gameId === state.gameId) {
        state.board[action.payload.id].incorrect = true;
        state.savedBoardToDB = false;
      }
    },
    markPartial: (state, action) => {
      if (action.payload.gameId === state.gameId) {
        state.board[action.payload.id].partial = true;
        state.savedBoardToDB = false;
      }
    },
  },
});

export const gameActions = gameSlice.actions;
export const gameReducer = gameSlice.reducer;
