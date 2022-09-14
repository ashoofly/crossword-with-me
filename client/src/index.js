import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './components/App';
import SignIn from './components/SignIn';
import './styles/index.css';
import { setupStore } from './redux/store';
import { Provider } from 'react-redux';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate
} from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { io } from 'socket.io-client';
import { initializeApp } from "firebase/app";
import { onAuthStateChanged } from "firebase/auth";
import { initializeAuth } from './auth';
import Logger from './utils/logger';

const logger = new Logger("Index");
/**
 * Initialize Socket.io
 */
const socket = process.env.NODE_ENV === "production" ? 
  io() : io(`http://localhost:${process.env.REACT_APP_DEV_SERVER_PORT}`);

socket.on('connect', () => {
  logger.log(`Socket ${socket.id} connected.`)
});
socket.on('disconnect', (reason) => {
  logger.log(`Socket disconnected: ${reason}`);
});
/**
 * Initialize Firebase app
 */
const firebaseAppConfig = JSON.parse(process.env.REACT_APP_FIREBASE_CONFIG);
const app = initializeApp(firebaseAppConfig);
logger.log("Initialized Firebase app");

/**
 * Initialize Firebase auth
 */
const auth = initializeAuth(app);
logger.log("Initialized Firebase authentication");


const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Provider store={setupStore()}>
      <Router>
        <Routes>
          <Route path="/" element={<App socket={socket} auth={auth} />} />
          <Route path="/join-game" element={<SignIn socket={socket} auth={auth} />} />

        </Routes>
      </Router>
    </Provider>
  </React.StrictMode>
);
