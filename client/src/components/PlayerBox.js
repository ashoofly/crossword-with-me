import React from 'react';
import '../styles/common.css';
import '../styles/Navbar.css';
import Avatar from '@mui/material/Avatar';
import PersonIcon from '@mui/icons-material/Person';
import Badge from '@mui/material/Badge';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { signin, signout } from '../auth';
import useAuthenticatedUser from '../hooks/useAuthenticatedUser';
import { useSelector } from "react-redux";
import Tooltip from '@mui/material/Tooltip';
import { deepOrange } from '@mui/material/colors';

export default React.memo((props) => {
  // console.log("Render Account component");
  const {
    auth,
    socket,
    gameId
  } = props;

  const [anchorEl, setAnchorEl] = React.useState(null);
  const [user, initialized] = useAuthenticatedUser(auth);
  // const [meIcon, setMeIcon] = React.useState(null);
  const [meIconClasses, setMeIconClasses] = React.useState("avatar-bg");
  const [friendIcons, setFriendIcons] = React.useState(null);
  // const [signinText, setSigninText] = React.useState(null);

  const players = useSelector(state => state.game.players);

  const open = Boolean(anchorEl);

  const handleClick = (e) => {
    setAnchorEl(e.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  }

  // React.useEffect(() => {
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

  React.useEffect(() => {
    if (!initialized || !user || !players) return;
    let me = players.find(player => player.playerId === user.uid);
    setMeIconClasses(`avatar-bg ${me.color}-border`);
    let friends = players.filter(player => player.playerId !== user.uid);
    if (friends.length > 0) {
      let friendIcons = [];
      friends.forEach(friend => {
        friendIcons.push(
          <Tooltip title={friend.displayName} key={friend.playerId}>
            <Avatar sx={{ bgcolor: deepOrange[500] }} className={`avatar-bg ${friend.color}-border ${friend.online ? '' : "offline"}`} >
              <img className="avatar-img" alt={friend.displayName} src={friend.photoURL} referrerPolicy="no-referrer" />
            </Avatar>
          </Tooltip>
        )
      });
      setFriendIcons(friendIcons);
    }
  }, [user, players]);

  function handleSignout() {
    socket.emit('leave-game', user.uid, gameId);
    signout(auth);
  }
  function handleSignin() {
    signin(auth);
  }

  return (
    <React.Fragment>
      <div className="player-box">
        {friendIcons}
        {user && <Badge color="success" overlap="circular" badgeContent="">
          <Tooltip title={`${user.displayName} (me)`}>
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
        <div className="color-choices">
        <div className="color-blob blue"></div>
        <div className="color-blob magenta"></div>

        <div className="color-blob violet"></div>
        <div className="color-blob green"></div>

        <div className="color-blob red"></div>
        <div className="color-blob cyan"></div>

        <div className="color-blob orange"></div>

          <div className="color-blob yellow"></div>
        </div>
        <MenuItem onClick={user ? handleSignout : handleSignin}>Sign out</MenuItem>
      </Menu>
    </React.Fragment>
  )
});

/* 
- blue
- orange
- purple

*/