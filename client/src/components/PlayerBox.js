import React from 'react';
import '../styles/common.css';
import '../styles/Navbar.css';
import Avatar from '@mui/material/Avatar';
import PersonIcon from '@mui/icons-material/Person';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { signin, signout } from '../auth';
import useAuthenticatedUser from '../hooks/useAuthenticatedUser';
import { useSelector } from "react-redux";

export default React.memo((props) => {
  // console.log("Render Account component");
  const {
    auth
  } = props;

  const [anchorEl, setAnchorEl] = React.useState(null);
  const [user, initialized] = useAuthenticatedUser(auth);
  const [meIcon, setMeIcon] = React.useState(null);
  const [signinText, setSigninText] = React.useState(null);

  const players = useSelector(state => state.game.players);

  const open = Boolean(anchorEl);

  const handleClick = (e) => {
    setAnchorEl(e.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  }

  React.useEffect(() => {
    if (!user) return;
    if (user.photoURL) {
      setMeIcon(
        <Avatar className="avatar-bg" onClick={handleClick} >
          <img className="avatar-img" alt={user.displayName} src={user.photoURL} referrerPolicy="no-referrer" />
        </Avatar>
        );
    } else {
      // use first letter of first name
      setMeIcon(
        <Avatar className="avatar-bg" onClick={handleClick}>
          {user.displayName.charAt(0)}
        </Avatar>
      );
    }
    setSigninText("Sign out");
  }, [user]);

  React.useEffect(() => {
    if (!user || !players) return;
    let friends = players.filter(player => player !== user.uid);
    if (friends.length > 0) {
      let friendIcons = [];
      friends.forEach(friend => {
        
      });
    }
  }, [user, players]);

  function handleSignout() {
    signout(auth);
  }
  function handleSignin() {
    signin(auth);
  }

  return (
    <React.Fragment>
      <div className="player-box">
        {meIcon}
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
        <MenuItem onClick={user ? handleSignout : handleSignin}>{signinText}</MenuItem>
      </Menu>
    </React.Fragment>
  )
});