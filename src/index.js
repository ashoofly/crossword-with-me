import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './components/App';
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

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Provider store={setupStore()}>
      <Router>
        <Routes>
          <Route path="/" element={<Navigate replace to={`/crossword-with-friends/${uuidv4()}`} />} />
          <Route path="/crossword-with-friends/:id" element={<App />} />
        </Routes>
      </Router>
    </Provider>
  </React.StrictMode>
);
