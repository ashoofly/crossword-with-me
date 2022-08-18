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
import { getFirebaseConfig } from './firebase-config';
import { initializeApp } from "firebase/app";
import { onAuthStateChanged } from "firebase/auth";
import { initializeAuth } from './auth';

/**
 * Initialize Socket.io
 */
const socket = io("http://localhost:3001");
socket.on('connect', () => {
  console.log(`Socket ${socket.id} connected.`)
});
socket.on('disconnect', (reason) => {
  console.log(`Socket disconnected: ${reason}`);
});
/**
 * Initialize Firebase app
 */
const firebaseAppConfig = getFirebaseConfig();
const app = initializeApp(firebaseAppConfig);
console.log("Initialized Firebase app");

/**
 * Initialize Firebase auth
 */
const auth = initializeAuth(app);
console.log("Initialized Firebase authentication");

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Provider store={setupStore()}>
      <Router>
        <Routes>
          <Route path="/" element={<Navigate replace to={`/crossword-with-friends`} />} />
          <Route path="/crossword-with-friends" element={<App socket={socket} auth={auth} />} />
          <Route path="/crossword-with-friends/join-game" element={<SignIn socket={socket} auth={auth} />} />

        </Routes>
      </Router>
    </Provider>
  </React.StrictMode>
);
