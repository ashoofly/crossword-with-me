import React from "react";
import Button from '@mui/material/Button';

import '../styles/common.css';
import '../styles/App.css';
import { getFirebaseConfig } from '../firebase-config';
import { initializeApp } from "firebase/app";
import { initializeAuth } from '../auth';
import useAuthenticatedUser from '../hooks/useAuthenticatedUser';
import { io } from 'socket.io-client';
import { useLocation, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  changeInput,
  loadGame,
  removeCheck,
  boardSaved,
  loadSquareState,
  loadWordState,
  loadBoardState,
  toggleAutocheck,
  resetGame
} from '../redux/slices/gameSlice';
import {
  initializePlayerView,
  toggleRebus,
  toggleOrientation
} from '../redux/slices/povSlice';
import { signin, handleCredentialResponse } from '../auth';
import { useNavigate } from 'react-router-dom';
import cryptoRandomString from 'crypto-random-string';

// http://localhost:3000/crossword-with-friends/join-game?gameId=ec06077c-1312-4c5b-af21-f9c7090a0a57

// A custom hook that builds on useLocation to parse
// the query string for you.
// function useQuery() {
//   const url = useLocation();
//   return React.useMemo(() => new URLSearchParams(url.search), [url]);
// }

export default function JoinGame(props) {
  const {
    auth, 
    socket
  } = props;
  
  const [searchParams, setSearchParams] = useSearchParams();
  console.log("JoinGame Auth:");
  console.log(auth);
  let gameId = searchParams.get('gameId');
  let token = searchParams.get('token');
  if (token) {
    handleCredentialResponse(token, auth, socket, gameId);
  }
  const navigate = useNavigate();
  const [user, initialized] = useAuthenticatedUser(auth);
  const firebaseAppConfig = getFirebaseConfig();

  const [friendName, setFriendName] = React.useState(null);
  const [gameNotFound, setGameNotFound] = React.useState(false);

  function createNonce() {
    let randomStr = cryptoRandomString({length: 32});
    let url = window.location;
    return btoa(`${url}---${randomStr}`);
  }

  React.useEffect(() => {
    if (!initialized || user) return;
    /* global google */
    google.accounts.id.initialize({
      client_id: firebaseAppConfig.googleClientId,
      // callback: res => handleCredentialResponse(res, auth),
      ux_mode: "redirect",
      login_uri: "http://localhost:3002/auth",
      nonce: createNonce()
    });

    google.accounts.id.renderButton(
      document.getElementById("signInDiv"),
      {theme: "outline", size: "large"}
    );
    }, [user, initialized]);

  React.useEffect(() => {
    if (socket === null || !initialized || !gameId) return;

    if (!user) {
      socket.emit("get-friend-request-name", gameId);

      socket.on('display-friend-request', friendName => {
        setFriendName(friendName);
      });
  
      socket.on('game-not-found', () => {
        setGameNotFound(true);
      });
    }


  }, [socket, initialized, user, gameId]);

  // React.useEffect(() => {
  //   if (token) {
  //     handleCredentialResponse(token, auth);
  //   }
  // }, [token, auth]);


  React.useEffect(() => {
    if (socket === null) return;
    if (user && gameId) {
      setSearchParams([]);
      console.log("NAVIGATING TO APP COMPONENT");
      navigate(`/crossword-with-friends?gameId=${gameId}`);
    }
  }, [socket, user, gameId]);



  return (
    <React.Fragment>
      {initialized && !token && !user && !gameNotFound && <div className="join-game">
        <h1>Please sign in to {gameId ? `join ${friendName}'s game:` : `play Crossword with Friends!`}</h1>
        <div id="signInDiv"></div>
      </div>
      }
      {token && !user && !gameNotFound && <div className="join-game">
        <h1>Signing in...</h1>
      </div>
      }
      {gameId && gameNotFound && <div className="join-game">
        <p>Game {gameId} not found. Games are rotated every week, so this may have been a game from last week.</p>
      </div>
      }
      {user && <div className="join-game">
        <h1>Successfully signed in!</h1>
      </div>
      }
    </React.Fragment>
  )

}