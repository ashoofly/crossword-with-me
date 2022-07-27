import { configureStore, combineReducers } from '@reduxjs/toolkit';
import gameReducer from './slices/gameSlice';
import povReducer from './slices/povSlice';

const rootReducer = combineReducers({
  game: gameReducer,
  pov: povReducer
});

export const setupStore = preloadedState => {
  return configureStore({
    reducer: rootReducer,
    preloadedState
  });
}