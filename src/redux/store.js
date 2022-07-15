import { configureStore } from '@reduxjs/toolkit';
import squareReducer from './squareSlice';

export default configureStore({
  reducer: {
    square: squareReducer
  }
})