import { useState, useEffect, memo, Fragment } from 'react';
import '../styles/colors.css';
import '../styles/Navbar.css';
import Avatar from '@mui/material/Avatar';
import Badge from '@mui/material/Badge';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { signout } from '../auth';
import useAuthenticatedUser from '../hooks/useAuthenticatedUser';
import { useDispatch, useSelector } from "react-redux";
import Tooltip from '@mui/material/Tooltip';
import Logger from '../utils/logger';
import { povSliceActions as povActions } from '../redux/slices/povSlice';


export default memo((props) => {
  // console.log("Render Account component");
  const {
    auth,
    socket,
  } = props;
  const logger = new Logger("PlayerBox");
  const dispatch = useDispatch();
  const [anchorEl, setAnchorEl] = useState(null);
  const [user, initialized] = useAuthenticatedUser(auth);
  // const [meIcon, setMeIcon] = useState(null);
  const [meIconClasses, setMeIconClasses] = useState("avatar-bg");
  const [friendIcons, setFriendIcons] = useState(null);
  // const [signinText, setSigninText] = useState(null);
  const gameId = useSelector(state => state.game.gameId);
  const players = useSelector(state => state.game.players);

  const open = Boolean(anchorEl);

  const handleClick = (e) => {
    setAnchorEl(e.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  }

  // useEffect(() => {
  //   if (!user) return;
  //   // if (user.photoURL) {
  //   setMeIcon(
  //     <Badge color="success" overlap="circular" badgeContent="">
  //       <Tooltip title={`${user.displayName} (me)`}>
  //         <Avatar className={meIconClasses} onClick={handleClick} >
  //           <img className="avatar-img" alt={user.displayName} src={user.photoURL} referrerPolicy="no-referrer" />
  //         </Avatar>
  //       </Tooltip>
  //     </Badge>
  //     );
    // } else {
    //   // use first letter of first name
    //   setMeIcon(
    //     <Badge color="success" variant="dot">
    //       <Tooltip title={`${user.displayName} (me)`}>
    //         <Avatar className="avatar-bg" onClick={handleClick}>
    //           {user.displayName.charAt(0)}
    //         </Avatar>  
    //       </Tooltip>
    //     </Badge>
    //   );
    // }
  //   setSigninText("Sign out");
  // }, [user]);

  useEffect(() => {
    if (!initialized || !user || !players) return;
    let me = players.find(player => player.playerId === user.uid);
    setMeIconClasses(`avatar-bg ${me.color}-border`);
    let friends = players.filter(player => player.playerId !== user.uid);
    if (friends.length > 0) {
      let friendIcons = [];
      friends.forEach(friend => {
        friendIcons.push(
          <Tooltip title={friend.displayName} key={friend.playerId}>
            <Avatar className={`avatar-bg ${friend.color}-border ${friend.online ? '' : "offline"}`} >
              <img className="avatar-img" alt={friend.displayName} src={friend.photoURL} referrerPolicy="no-referrer" />
            </Avatar>
          </Tooltip>
        )
      });
      setFriendIcons(friendIcons);
    } else {
      setFriendIcons(null);
    }
  }, [user, initialized, players]);

  function handleSignout() {
    logger.log(`Send event: leave-game`);
    socket.emit('leave-game', user.uid, gameId);
    signout(auth);
    dispatch(povActions.playerVerified({playerVerified: false}));
  }
  // function handleSignin() {
  //   signin(auth);
  // }
  return (
    <Fragment>
      <div className="player-box">
        {friendIcons}
        {user && <Badge color="success" overlap="circular" badgeContent="">
          <Tooltip title={`${user.displayName} (me)`} enterTouchDelay={0}>
            <Avatar className={meIconClasses} onClick={handleClick} >
              <img className="avatar-img" alt={user.displayName} src={user.photoURL} referrerPolicy="no-referrer" />
            </Avatar>
          </Tooltip>
        </Badge>}
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
        {user && <MenuItem className="displayName">{user.displayName ?? user.email} (me)</MenuItem>}
        <MenuItem onClick={handleSignout}>Sign out</MenuItem>
      </Menu>
    </Fragment>
  )
});

/* 
- blue
- orange
- purple

*/