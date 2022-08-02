import React from 'react';
import '../styles/common.css';
import '../styles/Navbar.css';
import Avatar from '@mui/material/Avatar';
import PersonIcon from '@mui/icons-material/Person';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { signin, signout } from '../auth';
import useAuthenticatedUser from '../hooks/useAuthenticatedUser';

export default React.memo((props) => {
  // console.log("Render Account component");
  const {
    auth
  } = props;

  const [anchorEl, setAnchorEl] = React.useState(null);
  const user = useAuthenticatedUser(auth);
  const [avatarIcon, setAvatarIcon] = React.useState(null);
  const [signinText, setSigninText] = React.useState(null);

  const open = Boolean(anchorEl);

  const handleClick = (e) => {
    setAnchorEl(e.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  }

  React.useEffect(() => {
    if (user) {
      if (user.photoURL) {
        setAvatarIcon(
          <Avatar className="avatar-bg" onClick={handleClick} >
            <img className="avatar-img" alt={user.displayName} src={user.photoURL} referrerPolicy="no-referrer" />
          </Avatar>
          );
      } else {
        // use first letter of first name
        setAvatarIcon(
          <Avatar className="avatar-bg" onClick={handleClick}>
            {user.displayName.charAt(0)}
          </Avatar>
        );
      }
      setSigninText("Sign out");
    } else {
      // anonymous icon
      setAvatarIcon(
        <Avatar className="avatar-bg" onClick={handleClick}>
          <PersonIcon sx={{ color: "rgb(6,54,66)" }} />
        </Avatar>
      );
      setSigninText("Sign in to play with friends");
    }
  }, [user]);

  function handleSignout() {
    signout(auth);
  }
  function handleSignin() {
    signin(auth);
  }

  return (
    <React.Fragment>
      {avatarIcon}
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
        {user && <MenuItem className="displayName">{user.displayName ?? user.email}</MenuItem>}
        <MenuItem onClick={user ? handleSignout : handleSignin}>{signinText}</MenuItem>
      </Menu>
    </React.Fragment>
  )
});