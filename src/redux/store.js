import { configureStore, combineReducers } from '@reduxjs/toolkit';
import squareReducer from './squareSlice';

const rootReducer = combineReducers({
  square: squareReducer
});


export const setupStore = preloadedState => {
  return configureStore({
    reducer: rootReducer,
    preloadedState
  });
}