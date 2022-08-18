import { useEffect, useState, Fragment } from "react";
import { useSearchParams, useNavigate } from 'react-router-dom';
import useAuthenticatedUser from '../hooks/useAuthenticatedUser';
import { handleCredentialResponse } from '../auth';
import cryptoRandomString from 'crypto-random-string';
import { getFirebaseConfig } from '../firebase-config';
import '../styles/common.css';
import '../styles/App.css';

export default function JoinGame(props) {
  const {
    auth, 
    socket
  } = props;
  
  const [searchParams, setSearchParams] = useSearchParams();
  let gameId = searchParams.get('gameId');
  let token = searchParams.get('token');
  if (token) {
    handleCredentialResponse(token, auth, socket, gameId);
  }

  const navigate = useNavigate();
  const [user, initialized] = useAuthenticatedUser(auth);
  const [friendName, setFriendName] = useState(null);
  const [gameNotFound, setGameNotFound] = useState(false);

  useEffect(() => {
    if (socket === null) return;

    function handleDisplayFriendRequest(friendName) {
      setFriendName(friendName);
    }
    function handleGameNotFound() {
      setGameNotFound(true);
    }
    socket.on('display-friend-request', handleDisplayFriendRequest);
    socket.on('game-not-found', handleGameNotFound);

    return function cleanup() {
      socket.off('display-friend-request', handleDisplayFriendRequest);
      socket.off('game-not-found', handleGameNotFound);      
    }

  }, [socket])

  useEffect(() => {
    if (!initialized || user) return;
    /* global google */
    google.accounts.id.initialize({
      client_id: getFirebaseConfig().googleClientId,
      ux_mode: "redirect",
      login_uri: "http://localhost:3002/auth",
      nonce: () => {
        let randomStr = cryptoRandomString({length: 32});
        let url = window.location;
        return btoa(`${url}---${randomStr}`);
      }
    });

    google.accounts.id.renderButton(
      document.getElementById("signInDiv"),
      {theme: "outline", size: "large"}
    );
    }, [user, initialized]);

  useEffect(() => {
    if (socket === null || !initialized || !gameId) return;

    if (!user) {
      socket.emit("get-friend-request-name", gameId);
    }

    if (user && gameId) {
      setSearchParams([]);
      navigate(`/crossword-with-friends?gameId=${gameId}`);
    }

  }, [socket, initialized, user, gameId]);


  return (
    <Fragment>
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
    </Fragment>
  )

}