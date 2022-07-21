import { configureStore, combineReducers } from '@reduxjs/toolkit';
import gameReducer from './slices/gameSlice';
import puzzleReducer from './slices/puzzleSlice';
import playerReducer from './slices/playerSlice';

const rootReducer = combineReducers({
  game: gameReducer,
  puzzle: puzzleReducer,
  player: playerReducer
});

export const setupStore = preloadedState => {
  return configureStore({
    reducer: rootReducer,
    preloadedState
  });
}