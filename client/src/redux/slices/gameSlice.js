import { createSlice } from '@reduxjs/toolkit';

const defaultState = {
  loaded: false,
  autocheck: false,
  savedToDB: true,
  board: [...Array(225).keys()].map((num) => ({
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
    activeLetterColors: []
  })),
  numCols: 15,
  numRows: 15,
  gameGrid: [...Array(225).keys()].map((num) => ({
    "acrossStart": true,
    "answer": "A",
    "downStart": true,
    "gridNum": 1,
    "circle": false,
    "id": 0,
    "isPlayable": true
  })),
  title: "New York Times, hello",
  clueDictionary: {
    across: [
      null,
      {
        "answer": "BOOED",
        "clue": "1. Expressed displeasure, as for an opposing team",
        "index": 0,
        "isLastClue": false,
        "nextGridNum": 6,
        "prevGridNum": -1
      }
    ],
    down: []
  },
  gameId: 0,
  advanceCursor: 0,
  mostRecentAction: {
    initial: true,
    gameId: 0,
    scope: "word",
    state: {},
    type: "exampleAction"
  },
  players: [{
    displayName: "Fred Rogers",
    owner: true,
    playerId: "abc123",
    currentFocus: {
      orientation: "across",
      square: 0,
      word: [0,1,2,3,4]
    },
    color: "blue",
    online: true
  }]
};




export const gameSlice = createSlice({
  name: 'game',
  initialState: defaultState,
  reducers: {
    'enteringPlayer': (state, action) => {
      if (action.payload.gameId === state.gameId) {
        state.players = state.players.map(player => {
          return action.payload.playerId === player.playerId ? 
            {...player, online: true}
            : player;
        });
      }

    },
    'exitingPlayer': (state, action) => {
      if (action.payload.gameId === state.gameId) {
        let playerInfo = state.players.find(player => player.playerId === action.payload.playerId);
        let playerColor = playerInfo.color;
        let playerFocus = playerInfo.currentFocus;

        // remove player highlighted cursor
        if (playerFocus) {
          for (const index of playerFocus.word) {
            state.board[index].activeWordColors = state.board[index].activeWordColors.filter(
              color => color !== playerColor
            )
            state.board[index].activeLetterColors = state.board[index].activeLetterColors.filter(
              color => color !== playerColor
            )
          }
        }

        state.players = state.players.map(player => {
          return action.payload.playerId === player.playerId ? 
            {...player, online: false}
            : player;
        })
      }
    },
    'updatePlayerFocus': (state, action) => {
      if (action.payload.gameId === state.gameId) {
        let playerInfo = state.players.find(player => player.playerId === action.payload.playerId);
        let playerColor = playerInfo.color;
        let playerFocus = playerInfo.currentFocus;
        

        // remove player's previous highlighted cursor
        if (playerFocus) {
          for (const index of playerFocus.word) {

            let activeWordColors = state.board[index].activeWordColors;
            let activeLetterColors = state.board[index].activeLetterColors;

            if (activeWordColors) {
              state.board[index].activeWordColors = activeWordColors.filter(
                color => color !== playerColor
              )
            }
            if (activeLetterColors) {
              state.board[index].activeLetterColors = activeLetterColors.filter(
                color => color !== playerColor
              )
            }
          }
        }

        // add highlight to player's current focus
        for (const index of action.payload.currentFocus.word) {
          let activeWordColors = state.board[index].activeWordColors;
          if (!activeWordColors) {
            activeWordColors = [];
          }
          let activeLetterColors = state.board[index].activeLetterColors;
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
        }
        
        state.players = state.players.map(player => {
          return action.payload.playerId === player.playerId ? 
            {...player, 
              currentFocus: action.payload.currentFocus
            }
            : player;
        })
      }
    },
    'loadGame': (state, action) => {
      return {
        ...action.payload,
        board: action.payload.board.map(square => ({
          ...square,
          activeWordColors: [],
          activeLetterColors: []
        }))
      }
    },
    'loadSquareState': (state, action) => {
      state.board[action.payload.index] = {
        ...action.payload,
      }
    },
    'loadWordState': (state, action) => {
      let word = action.payload.state;
      word.forEach( square => {
        state.board[square.index] = {
          ...square,
        };
      });
    },
    'loadBoardState': (state, action) => {
      state.board = action.payload.state.map(square => ({
          ...square
        })
      );
    },
    'boardSaved': (state, action) => {
      state.savedToDB = true;
    },
    'resetGame': (state, action) => {
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
      if (action.payload.source !== "external") {
        state.savedToDB = false;
        state.mostRecentAction = {
          scope: "game",
          gameId: state.gameId,
          type: "resetGame"
        };
      }
    },
    'toggleAutocheck': (state, action) => {
      state.autocheck = !state.autocheck;
      if (action.payload.source !== "external") {
        state.savedToDB = false;
        state.mostRecentAction = {
          scope: "game",
          type: "toggleAutocheck"
        };
      }
    },
    'changeInput': (state, action) => {
      state.board[action.payload.id].initial = false;
      state.board[action.payload.id].input = action.payload.value;
      state.board[action.payload.id].penciled = action.payload.penciled;
      state.board[action.payload.id].color = action.payload.color;

      if (action.payload.source !== "external") {
        if (action.payload.advanceCursor) {
          state.advanceCursor = state.advanceCursor + 1;
        }
        state.savedToDB = false;
        state.mostRecentAction = {
          gameId: state.gameId,
          scope: "square",
          type: "changeInput",
          state: action.payload
        };
      }
    },
    'requestCheckSquare': (state, action) => {
      if (state.board[action.payload.id].input !== '') {
        state.board[action.payload.id].check = true;
      }
      if (action.payload.source !== "external") {
        state.savedToDB = false;
        state.mostRecentAction = {
          scope: "square",
          type: "requestCheckSquare",
          index: action.payload.id,
        };
      }

    },
    'requestCheckWord': (state, action) => {
      action.payload.word.forEach(index => {
        if (state.board[index].input !== '') {
          state.board[action.payload.id].check = true;
        }
      });
      state.mostRecentAction = {
        scope: "word",
        state: action.payload.word
      };
      state.savedToDB = false;
    },
    'requestCheckPuzzle': (state, action) => {
      state.board = state.board.map(square => {
        return (square.input !== '') ? 
          ({
            ...square,
            check: true,
          }) 
          : square
      });
      state.mostRecentAction = {
        scope: "board",
        state: state.board
      }
      state.savedToDB = false;
    },
    'requestRevealSquare': (state, action) => {
      if (state.board[action.payload.id].input === state.gameGrid[action.payload.id].answer) {
        state.board[action.payload.id].check = true;

      } else {
        state.board[action.payload.id].incorrect = false
        state.board[action.payload.id].partial = false
        state.board[action.payload.id].reveal = true
        state.board[action.payload.id].verified = true
      }
      state.savedToDB = false;

      if (action.payload.source !== "external") {
        state.mostRecentAction = {
          scope: "square",
          type: "requestRevealSquare"
          index: action.payload.id,
        };
      }
    },
    'requestRevealWord': (state, action) => {
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
      state.mostRecentAction = {
        scope: "word",
        state: action.payload.word
      };
      state.savedToDB = false;
    },
    'requestRevealPuzzle': (state, action) => {
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
      state.mostRecentAction = {
        scope: "board",
        state: state.board
      };
      state.savedToDB = false;
    },
    'removeCheck': (state, action) => {
      state.board[action.payload.id].check = false
      state.board[action.payload.id].incorrect = false
      state.board[action.payload.id].partial = false
      state.savedToDB = false;
    },
    'markVerified': (state, action) => {
      state.board[action.payload.id].verified = true
      state.savedToDB = false;
    },
    'markIncorrect': (state, action) => {
      state.board[action.payload.id].incorrect = true
      state.savedToDB = false;
    },
    'markPartial': (state, action) => {
      state.board[action.payload.id].partial = true
      state.savedToDB = false;
    }
  }
})

export const {
  loadGame,
  enteringPlayer,
  exitingPlayer,
  updatePlayerFocus,
  loadSquareState,
  loadWordState,
  loadBoardState,
  resetGame,
  toggleAutocheck,
  changeInput,
  requestCheckSquare,
  requestCheckWord,
  requestCheckPuzzle,
  requestRevealSquare,
  requestRevealWord,
  requestRevealPuzzle,
  removeCheck,
  markBlock,
  markVerified,
  markPartial,
  markIncorrect,
  saveBoard,
  boardSaved,
  advanceCursor
} = gameSlice.actions;
export default gameSlice.reducer;