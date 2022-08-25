import { memo } from "react";
import PlayerBox from './PlayerBox';
import Logger from '../utils/logger';

export default memo((props) => {
  const {
    socket,
    auth,
    gameId,
  } = props;
  const logger = new Logger("TitleBar");

  return (
    <div className="title-bar">
      <div></div>
      <h1>Crossword with Friends</h1>
      <PlayerBox 
        auth={auth}
        socket={socket}
        gameId={gameId}
      />
    </div>
  )
});