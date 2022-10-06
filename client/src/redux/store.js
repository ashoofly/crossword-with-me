import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { gameReducer } from './slices/gameSlice';
import { povReducer } from './slices/povSlice';

const rootReducer = combineReducers({
  game: gameReducer,
  pov: povReducer,
});

export default preloadedState => (
  configureStore({
    reducer: rootReducer,
    preloadedState,
  })
);
