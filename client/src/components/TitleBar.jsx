import { React, memo } from 'react';
import Socket from 'socket.io-client';
import { Auth } from 'firebase/app';
import PropTypes from 'prop-types';
import PlayerBox from './PlayerBox';
import Logger from '../common/Logger';
import useAuthenticatedUser from '../hooks/useAuthenticatedUser';

const TitleBar = memo(props => {
  const {
    socket,
    auth,
    gameId,
  } = props;
  const logger = new Logger('TitleBar');
  logger.log('Render TitleBar');
  const [user] = useAuthenticatedUser(auth);

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
      />
    </div>
  );
});

TitleBar.propTypes = {
  socket: PropTypes.instanceOf(Socket).isRequired,
  auth: PropTypes.instanceOf(Auth).isRequired,
  gameId: PropTypes.string.isRequired,
};

export default TitleBar;
