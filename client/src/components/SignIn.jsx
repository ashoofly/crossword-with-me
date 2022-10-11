import { React, useEffect, useState, useMemo, memo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import { useSearchParams, useNavigate } from 'react-router-dom';
import cryptoRandomString from 'crypto-random-string';
import useAuthenticatedUser from '../hooks/useAuthenticatedUser';
import { handleCredentialResponse } from '../utils/auth';
import '../styles/SignIn.css';
import Logger from '../common/Logger';
import { povActions } from '../redux/slices/povSlice';

const SignIn = memo(props => {
  const {
    auth,
    socket,
    loggers,
  } = props;

  const [searchParams, setSearchParams] = useSearchParams();
  const gameId = searchParams.get('gameId');
  const token = searchParams.get('token');

  const navigate = useNavigate();
  const [user, initialized] = useAuthenticatedUser(auth);
  const [friendName, setFriendName] = useState(null);
  const [gameNotFound, setGameNotFound] = useState(false);

  const dispatch = useDispatch();
  const playerVerified = useSelector(state => state.pov.playerVerified);

  if (loggers) {
    const { renderLogger } = loggers;
    renderLogger.log('SignIn');
  }

  useEffect(() => {
    if (!token || !auth) return;

    try {
      if (token) {
        handleCredentialResponse(token, auth, socket);
      }
    } catch (error) {
      if (loggers) loggers.errorLogger.log(error);
    }
  }, [auth, loggers, socket, token]);

  useEffect(() => {
    if (socket === null || !loggers) return;
    const { socketLogger } = loggers;

    function handleDisplayFriendRequest(fname) {
      setFriendName(fname);
    }
    function handleGameNotFound() {
      setGameNotFound(true);
    }

    function handlePlayerVerified(playerId) {
      socketLogger.log(`Received player-exists event for ${playerId}`);
      if (user.uid === playerId) {
        dispatch(povActions.playerVerified({ playerVerified: true }));
      }
    }

    socket.on('display-friend-request', handleDisplayFriendRequest);
    socket.on('game-not-found', handleGameNotFound);
    socket.on('player-exists', handlePlayerVerified);

    // eslint-disable-next-line consistent-return
    return function cleanup() {
      socket.off('display-friend-request', handleDisplayFriendRequest);
      socket.off('game-not-found', handleGameNotFound);
      socket.off('player-exists', handlePlayerVerified);
    };
  }, [dispatch, loggers, socket, user]);

  useEffect(() => {
    function generateNonce() {
      const randomStr = cryptoRandomString({ length: 32 });
      const url = window.location;
      return btoa(`${url}---${randomStr}`);
    }

    if (!initialized || user) return;

    const firebaseAppConfig = JSON.parse(process.env.REACT_APP_FIREBASE_CONFIG);

    /* global google */
    google.accounts.id.initialize({
      client_id: firebaseAppConfig.googleClientId,
      ux_mode: 'redirect',
      login_uri: process.env.REACT_APP_AUTH_URL,
      nonce: generateNonce(),
    });

    google.accounts.id.renderButton(
      document.getElementById('signInDiv'),
      { theme: 'outline', size: 'large' }
    );
  }, [user, initialized]);

  useEffect(() => {
    if (socket === null || !initialized || !gameId || !loggers) return;
    const { socketLogger } = loggers;

    if (!user) {
      socketLogger.log('Send event: get-friend-request-name');
      socket.emit('get-friend-request-name', gameId);
    }

    if (user && gameId) {
      setSearchParams([]);
      navigate(`?gameId=${gameId}`);
    }
  }, [socket, initialized, user, gameId, loggers, setSearchParams, navigate]);

  return (
    <>
      {initialized && !token && !user && !gameNotFound && (
        <div className="join-game">
          <h2 className="join-game-text">
            { ' Please sign in to ' }
            {gameId ? `join ${friendName}'s game:` : 'play Crossword with Me:'}
          </h2>
          <div id="signInDiv" />
        </div>
      )}
      {token && (!user || !playerVerified) && !gameNotFound && (
        <div className="join-game">
          <h1>Signing in...</h1>
        </div>
      )}
      {gameId && gameNotFound && (
        <div className="join-game">
          <p>
            { 'Game ' }
            {gameId}
            { ' not found. Games are rotated every week, so this may have been a game from last week.' }
          </p>
        </div>
      )}
      {user && playerVerified && (
        <div className="join-game">
          <h1>Successfully signed in!</h1>
        </div>
      )}
    </>
  );
});

SignIn.propTypes = {
  socket: PropTypes.object.isRequired,
  auth: PropTypes.object.isRequired,
  loggers: PropTypes.object.isRequired,
};

export default SignIn;
