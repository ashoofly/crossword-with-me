import { React, memo, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import PlayerBox from './PlayerBox';
import Logger from '../common/Logger';
import useAuthenticatedUser from '../hooks/useAuthenticatedUser';

const TitleBar = memo(props => {
  const {
    socket,
    auth,
    gameId,
    loggers,
  } = props;
  const [user] = useAuthenticatedUser(auth);

  if (loggers) {
    const { renderLogger } = loggers;
    renderLogger.log('TitleBar');
  }

  function handleClick() {
    if (user) {
      socket.emit('get-default-game', user.uid);
    }
  }

  return (
    <div className="title-bar">
      <div />
      { /* eslint-disable-next-line
          jsx-a11y/click-events-have-key-events,
          jsx-a11y/no-noninteractive-element-interactions */ }
      <h1 className="title-text" onClick={handleClick}>Crossword with Me</h1>
      <PlayerBox
        auth={auth}
        socket={socket}
        gameId={gameId}
        loggers={loggers}
      />
    </div>
  );
});

TitleBar.propTypes = {
  socket: PropTypes.object.isRequired,
  auth: PropTypes.object.isRequired,
  gameId: PropTypes.string.isRequired,
  loggers: PropTypes.object.isRequired,
};

export default TitleBar;
