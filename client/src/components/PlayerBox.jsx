import { React, useState, useEffect, useCallback, useMemo, memo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import Tooltip from '@mui/material/Tooltip';
import '../styles/colors.css';
import '../styles/Navbar.css';
import Avatar from '@mui/material/Avatar';
import Badge from '@mui/material/Badge';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { signout } from '../utils/auth';
import useAuthenticatedUser from '../hooks/useAuthenticatedUser';
import Logger from '../common/Logger';
import { povActions } from '../redux/slices/povSlice';

const PlayerBox = memo(props => {
  const {
    auth,
    socket,
  } = props;
  const [logger, setLogger] = useState(null);

  const dispatch = useDispatch();
  const [anchorEl, setAnchorEl] = useState(null);
  const [user, initialized] = useAuthenticatedUser(auth);
  const [meIconClasses, setMeIconClasses] = useState('avatar-bg');
  const [friendIcons, setFriendIcons] = useState(null);
  const gameId = useSelector(state => state.game.gameId);
  const players = useSelector(state => state.game.players);
  const open = Boolean(anchorEl);

  useEffect(() => {
    setLogger(new Logger('PlayerBox'));
  }, []);

  useEffect(() => {
    if (!logger) return;
    logger.log('Rendering PlayerBox component');
  }, [logger]);

  const handleClick = e => {
    setAnchorEl(e.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  useEffect(() => {
    if (!initialized || !user || !players) return;
    const me = players.find(player => player.playerId === user.uid);
    if (!me) return;
    setMeIconClasses(`avatar-bg ${me.color}-border`);
    const friends = players.filter(player => player.playerId !== user.uid);
    if (friends.length > 0) {
      const icons = [];
      friends.forEach(friend => {
        icons.push(
          <Tooltip title={friend.displayName} key={friend.playerId} enterTouchDelay={0}>
            <Avatar className={`avatar-bg ${friend.color}-border ${friend.online ? '' : 'offline'}`}>
              <img className="avatar-img" alt={friend.displayName} src={friend.photoURL} referrerPolicy="no-referrer" />
            </Avatar>
          </Tooltip>
        );
      });
      setFriendIcons(icons);
    } else {
      setFriendIcons(null);
    }
  }, [user, initialized, players]);

  const handleSignout = useCallback(() => {
    logger.log('Send event: leave-game');
    socket.emit('leave-game', user.uid, gameId);
    signout(auth);
    dispatch(povActions.playerVerified({ playerVerified: false }));
  }, [auth, dispatch, gameId, logger, socket, user.uid]);

  return (
    <>
      <div className="player-box">
        {friendIcons}
        {user && (
          <Badge color="success" overlap="circular" badgeContent="">
            <Tooltip title={`${user.displayName} (me)`}>
              <Avatar className={meIconClasses} onClick={handleClick}>
                <img className="avatar-img" alt={user.displayName} src={user.photoURL} referrerPolicy="no-referrer" />
              </Avatar>
            </Tooltip>
          </Badge>
        )}
      </div>
      <Menu
        className="menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
      >
        {user && (
          <MenuItem className="displayName">
            {user.displayName ?? user.email}
            (me)
          </MenuItem>
        )}
        <MenuItem onClick={handleSignout}>Sign out</MenuItem>
      </Menu>
    </>
  );
});

PlayerBox.propTypes = {
  socket: PropTypes.object.isRequired,
  auth: PropTypes.object.isRequired,
};

export default PlayerBox;
