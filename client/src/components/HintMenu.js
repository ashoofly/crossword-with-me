import React from 'react';
import lifebuoy from '../images/life-buoy.svg';
import friend from '../images/add-friend.svg';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import '../styles/common.css';
import "../styles/Navbar.css";
import { useDispatch, useSelector } from 'react-redux';
import {
  toggleAutocheck,
  resetGame,
  requestCheckSquare,
  requestCheckWord,
  requestCheckPuzzle,
  requestRevealSquare,
  requestRevealWord,
  requestRevealPuzzle
} from '../redux/slices/gameSlice';
// import { signin } from '../auth';
import useAuthenticatedUser from '../hooks/useAuthenticatedUser';


export default React.memo((props) => {
  const { 
    socket,
    auth,
    gameId
  } = props;
  // console.log("Render hintmenu");
  const dispatch = useDispatch();
  const [user, initialized] = useAuthenticatedUser(auth);
  const autocheck = useSelector(state => state.game.autocheck);
  const focus = useSelector(state => state.pov.focused.square);
  const focusedWord = useSelector(state => state.pov.focused.word);

  const [anchorEl, setAnchorEl] = React.useState(null);
  const [showDetailedMenu, setShowDetailedMenu] = React.useState(false);
  const [menuItems, setMenuItems] = React.useState([]);
  const [openToast, setOpenToast] = React.useState(false);
  const open = Boolean(anchorEl);
  React.useEffect(showMenu, [user, gameId, showDetailedMenu, autocheck, focus]);

  function copyUrlToClipboard() {
    handleClose();
    let shareUrl = `${window.location.origin}/crossword-with-friends?gameId=${gameId}`;
    navigator.clipboard.writeText(shareUrl);
    setOpenToast(true);
  }

  function checkActiveSquare() {
    handleClose();
    dispatch(requestCheckSquare({ id: focus, source: socket.id }));
  };

  function checkActiveWord() {
    handleClose();
    dispatch(requestCheckWord({ word: focusedWord }));
  }

  function checkPuzzle() {
    handleClose();
    dispatch(requestCheckPuzzle());
  }

  function revealSquare() {
    handleClose();
    dispatch(requestRevealSquare({ source: socket.id, id: focus }));
  }

  function revealWord() {
    handleClose();
    dispatch(requestRevealWord({ word: focusedWord }));
  }

  function revealPuzzle() {
    handleClose();
    dispatch(requestRevealPuzzle());
  }

  function clearPuzzle() {
    handleClose();
    dispatch(resetGame({source: socket.id}));

  };

  function handleAutocheck() {
    handleClose();
    dispatch(toggleAutocheck({source: socket.id}));
  }

  // function handleSignin() {
  //   signin(auth);
  // }

  const mainHintMenuItems = [
    // {
    //   id: -1,
    //   text: 'Sign in to phone a friend',
    //   onClick: handleSignin,
    //   icon: {
    //     "className": "phone-a-friend",
    //     "src": friend,
    //     "alt": "add-a-friend-icon"
    //   },
    //   style: {
    //     "color": "#08992e"
    //   },
    //   hide: user ? true : false
    // },  
    {
      id: 0,
      text: 'Phone a Friend',
      onClick: copyUrlToClipboard,
      icon: {
        "className": "phone-a-friend",
        "src": friend,
        "alt": "add-a-friend-icon"
      },
      style: {
        "color": "#08992e"
      },
      hide: user ? false : true
    },  
    {
      id: 1,
      text: `Turn ${autocheck ? "OFF" : "ON"} Autocheck`,
      onClick: handleAutocheck
    },
    {
      id: 2,
      text: "Check Square",
      onClick: checkActiveSquare,
      disabled: autocheck ? true : false
    },
    {
      id: 3,
      text: "Check Word",
      onClick: checkActiveWord,
      disabled: autocheck ? true : false
    },
    {
      id: 4,
      text: "Check Puzzle",
      onClick: checkPuzzle,
      disabled: autocheck ? true : false
    },
    {
      id: 5,
      text: "Reveal / Clear...",
      onClick: goToRevealMenu
    }
  ];
  const revealMenuItems = [
    {
      id: 1,
      text: "Reveal Square",
      onClick: revealSquare
    },
    {
      id: 2,
      text: "Reveal Word",
      onClick: revealWord
    },
    {
      id: 3,
      text: "Reveal Puzzle",
      onClick: revealPuzzle
    },
    {
      id: 4,
      text: "Clear Puzzle",
      onClick: clearPuzzle,
      style: {
        color: "rgb(220,50,47)"
      }
    }
  ];

  const handleClick = (e) => {
    setAnchorEl(e.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
    setShowDetailedMenu(false);
  }

  function goToRevealMenu() {
    setShowDetailedMenu(true);
  }

  function showMenu() {
    let currentMenu;
    if (showDetailedMenu) {
      currentMenu = revealMenuItems;
    } else {
      currentMenu = mainHintMenuItems;
    }
    const currentMenuItems = currentMenu.filter(menuItem => !menuItem.hide).map(menuItem => {
      return (
        <MenuItem
          key={menuItem.id}
          onClick={menuItem.onClick}
          disabled={menuItem.disabled ?? false}
          style={menuItem.style ?? {}}>
          {menuItem.icon && <img className={menuItem.icon.className} src={menuItem.icon.src} alt={menuItem.icon.alt} />} 
            {menuItem.text}
        </MenuItem>
      )
    });
    setMenuItems(currentMenuItems);
  }

  return (
    <React.Fragment>
      <div className="icon-round-bg">
        <img onClick={handleClick} className="hint-icon" src={lifebuoy} alt="check_puzzle" />
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
        {menuItems}
      </Menu>
      <Snackbar
        open={openToast}
        onClose={() => setOpenToast(false)}
        autoHideDuration={2000}
      >
        <Alert 
          onClose={() => setOpenToast(false)} 
          severity="success" 
          sx={{ width: '100%' }}
        >
          Link copied to clipboard!
        </Alert>
      </Snackbar>
    </React.Fragment>
  )
});