import { React, useEffect, useState, useCallback, useMemo, memo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import lifebuoy from '../images/life-buoy.svg';
import friend from '../images/add-friend.svg';
import '../styles/Navbar.css';
import { gameActions } from '../redux/slices/gameSlice';
import useAuthenticatedUser from '../hooks/useAuthenticatedUser';
import Logger from '../common/Logger';

const HintMenu = memo(props => {
  const {
    auth,
    loggers,
  } = props;

  const dispatch = useDispatch();
  const [user] = useAuthenticatedUser(auth);
  const autocheck = useSelector(state => state.game.autocheck);
  const focus = useSelector(state => state.pov.focused.square);
  const focusedWord = useSelector(state => state.pov.focused.word);
  const gameId = useSelector(state => state.game.gameId);
  const players = useSelector(state => state.game.players);

  const [anchorEl, setAnchorEl] = useState(null);
  const [showDetailedMenu, setShowDetailedMenu] = useState(false);
  const [menuItems, setMenuItems] = useState([]);
  const [openToast, setOpenToast] = useState(false);
  const open = Boolean(anchorEl);

  if (loggers) {
    const { renderLogger } = loggers;
    renderLogger.log('HintMenu');
  }

  const handleClick = e => {
    setAnchorEl(e.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
    setShowDetailedMenu(false);
  };

  const copyUrlToClipboard = useCallback(() => {
    handleClose();
    const shareUrl = `${window.location.origin}?gameId=${gameId}`;
    navigator.clipboard.writeText(shareUrl);
    setOpenToast(true);
  }, [gameId]);

  function goToRevealMenu() {
    setShowDetailedMenu(true);
  }

  const checkActiveSquare = useCallback(() => {
    handleClose();
    dispatch(gameActions.requestCheckSquare({ gameId, id: focus }));
  }, [dispatch, focus, gameId]);

  const checkActiveWord = useCallback(() => {
    handleClose();
    dispatch(gameActions.requestCheckWord({ gameId, word: focusedWord }));
  }, [dispatch, focusedWord, gameId]);

  const checkPuzzle = useCallback(() => {
    handleClose();
    dispatch(gameActions.requestCheckPuzzle({ gameId }));
  }, [dispatch, gameId]);

  const revealSquare = useCallback(() => {
    handleClose();
    dispatch(gameActions.requestRevealSquare({ gameId, id: focus }));
  }, [dispatch, focus, gameId]);

  const revealWord = useCallback(() => {
    handleClose();
    dispatch(gameActions.requestRevealWord({ gameId, word: focusedWord }));
  }, [dispatch, focusedWord, gameId]);

  const revealPuzzle = useCallback(() => {
    handleClose();
    dispatch(gameActions.requestRevealPuzzle({ gameId }));
  }, [dispatch, gameId]);

  const clearPuzzle = useCallback(() => {
    handleClose();
    dispatch(gameActions.resetGame({ gameId }));
  }, [dispatch, gameId]);

  const handleAutocheck = useCallback(() => {
    handleClose();
    dispatch(gameActions.toggleAutocheck({ gameId }));
  }, [dispatch, gameId]);

  const mainHintMenuItems = useMemo(() => {
    function amOwner() {
      const me = players.find(player => player.playerId === user.uid);
      if (me) {
        return me.owner;
      } else {
        return false;
      }
    }

    return [
      {
        id: 0,
        text: 'Phone a Friend',
        onClick: copyUrlToClipboard,
        icon: {
          className: 'phone-a-friend',
          src: friend,
          alt: 'add-a-friend-icon',
        },
        style: {
          color: '#08992e',
        },
        hide: !user,
      },
      {
        id: -1,
        text: 'Only the owner of the puzzle can reveal/check',
        style: {
          color: 'rgb(220,50,47)',
          fontSize: 12,
          fontWeight: 'bold',
          cursor: 'default',
        },
        hide: amOwner(),
      },
      {
        id: 1,
        text: `Turn ${autocheck ? 'OFF' : 'ON'} Autocheck`,
        onClick: handleAutocheck,
        disabled: !amOwner(),
      },
      {
        id: 2,
        text: 'Check Square',
        onClick: checkActiveSquare,
        disabled: autocheck || !amOwner(),
      },
      {
        id: 3,
        text: 'Check Word',
        onClick: checkActiveWord,
        disabled: autocheck || !amOwner(),
      },
      {
        id: 4,
        text: 'Check Puzzle',
        onClick: checkPuzzle,
        disabled: autocheck || !amOwner(),
      },
      {
        id: 5,
        text: 'Reveal / Clear...',
        onClick: goToRevealMenu,
        disabled: !amOwner(),
      },
    ];
  }, [players, autocheck, checkActiveSquare, checkActiveWord,
    checkPuzzle, copyUrlToClipboard, handleAutocheck, user]);

  const revealMenuItems = useMemo(() => [
    {
      id: 1,
      text: 'Reveal Square',
      onClick: revealSquare,
    },
    {
      id: 2,
      text: 'Reveal Word',
      onClick: revealWord,
    },
    {
      id: 3,
      text: 'Reveal Puzzle',
      onClick: revealPuzzle,
    },
    {
      id: 4,
      text: 'Clear Puzzle',
      onClick: clearPuzzle,
      style: {
        color: 'rgb(220,50,47)',
      },
    },
  ], [clearPuzzle, revealPuzzle, revealSquare, revealWord]);

  function showMenu() {
    let currentMenu;
    if (showDetailedMenu) {
      currentMenu = revealMenuItems;
    } else {
      currentMenu = mainHintMenuItems;
    }
    const currentMenuItems = currentMenu.filter(menuItem => !menuItem.hide).map(menuItem => (
      <MenuItem
        key={menuItem.id}
        onClick={menuItem.onClick}
        disabled={menuItem.disabled ?? false}
        style={menuItem.style ?? {}}
      >
        {menuItem.icon
        && (
          <img
            className={menuItem.icon.className}
            src={menuItem.icon.src}
            alt={menuItem.icon.alt}
          />
        )}
        {menuItem.text}
      </MenuItem>
    ));
    setMenuItems(currentMenuItems);
  }

  useEffect(
    showMenu,
    [user, gameId, showDetailedMenu, autocheck, focus, revealMenuItems, mainHintMenuItems]
  );

  return (
    <>
      <button className="icon-round-bg" type="button" onClick={handleClick}>
        <img className="hint-icon" src={lifebuoy} alt="hint-menu" />
      </button>
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
    </>
  );
});

HintMenu.propTypes = {
  auth: PropTypes.object.isRequired,
  loggers: PropTypes.object.isRequired,
};

export default HintMenu;
