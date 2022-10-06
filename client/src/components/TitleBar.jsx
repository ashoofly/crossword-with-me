import { React, memo } from 'react';
import PlayerBox from './PlayerBox';
import Logger from '../utils/Logger';
import useAuthenticatedUser from '../hooks/useAuthenticatedUser';

export default memo((props) => {
  const {
    socket,
    auth,
    gameId,
  } = props;
  const logger = new Logger('TitleBar');
  const [user] = useAuthenticatedUser(auth);

  function handleClick() {
    if (user) {
      socket.emit('get-default-game', user.uid);
    }
  }

  return (
    <div className="title-bar">
      <div></div>
      <h1 className="title-text" onClick={handleClick}>Crossword with Me</h1>
      <PlayerBox 
        auth={auth}
        socket={socket}
        gameId={gameId}
      />
    </div>
  )
});