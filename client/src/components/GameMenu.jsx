import { React, useState, useEffect, useCallback, useMemo, memo } from 'react';
import PropTypes from 'prop-types';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import '../styles/Navbar.css';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import useAuthenticatedUser from '../hooks/useAuthenticatedUser';
import Logger from '../common/Logger';

const GameMenu = memo(props => {
  const {
    socket,
    auth,
    loggers,
  } = props;

  const game = useSelector(state => state.game);
  const navigate = useNavigate();

  const [user] = useAuthenticatedUser(auth);
  const teamGames = useSelector(state => state.pov.teamGames);

  const [anchorEl, setAnchorEl] = useState(null);
  const [menuContent, setMenuContent] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [puzzleDates, setPuzzleDates] = useState(null);
  const [heading, setHeading] = useState({ __html: 'Loading...' });
  const [selectedTeamGameId, setSelectedTeamGameId] = useState(null);
  const open = Boolean(anchorEl);

  if (loggers) {
    const { renderLogger } = loggers;
    renderLogger.log('GameMenu');
  }

  const handleClick = e => {
    setAnchorEl(e.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const weekdays = useMemo(() => [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday'], []);
  const months = useMemo(() => [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ], []);
  const abbrevMonths = useMemo(() => [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'June',
    'July',
    'Aug',
    'Sept',
    'Oct',
    'Nov',
    'Dec',
  ], []);
  const abbrevDow = useMemo(() => ({
    Monday: 'Mon',
    Tuesday: 'Tues',
    Wednesday: 'Wed',
    Thursday: 'Thurs',
    Friday: 'Fri',
    Saturday: 'Sat',
    Sunday: 'Sun',
  }), []);

  const handleTeamGameClick = useCallback(tg => {
    handleClose();
    setSelectedTeamGameId(tg.gameId);
    navigate(`?gameId=${tg.gameId}`);
  }, [navigate]);

  const updateTeamGameHeading = useCallback(tg => {
    if (!teamGames || teamGames.length === 0) return;
    const date = new Date(tg.date);
    const dow = abbrevDow[tg.dow];
    const month = abbrevMonths[date.getMonth()];
    const gameInfo = teamGames.find(teamGame => teamGame.gameId === tg.gameId);
    if (gameInfo) {
      setHeading({ __html: `<span class="heading-dow">${gameInfo.friend.displayName.split(' ')[0]}'s</span> <span class="heading-date">${dow} ${month} ${date.getDate()}</span>` });
    }
  }, [abbrevDow, abbrevMonths, teamGames]);

  const soloGameHeading = useMemo(() => <MenuItem className="submenu-heading">My Games</MenuItem>, []);
  const gamesWithFriends = useMemo(() => <MenuItem className="submenu-heading">Friends&apos; Games</MenuItem>, []);

  const sortFriendsFunc = useCallback((a, b) => {
    // sort team games alphabetically by friend display name
    if (a.friend.displayName > b.friend.displayName) {
      return 1;
    } else if (a.friend.displayName === b.friend.displayName) {
      // then sort by dow
      if (weekdays.indexOf(a.dow) > weekdays.indexOf(b.dow)) {
        return 1;
      } else {
        return -1;
      }
    } else {
      return -1;
    }
  }, [weekdays]);

  const displayTeamGames = useCallback(() => {
    const sorted = teamGames.slice().sort(sortFriendsFunc);

    return sorted.map(g => {
      const date = new Date(puzzleDates[g.dow]);
      const month = abbrevMonths[date.getMonth()];
      const dow = abbrevDow[g.dow];

      return (
        <MenuItem
          key={g.gameId}
          onClick={() => handleTeamGameClick(g)}
          className={selectedTeamGameId === g.gameId ? 'focused-menu-item' : ''}
        >
          { /* eslint-disable-next-line react/no-danger */ }
          <div dangerouslySetInnerHTML={{
            __html: `<span>${g.friend.displayName.split(' ')[0]}</span><span class="date-subtitle">${dow} ${month} ${date.getDate()}</span>`,
          }}
          />
        </MenuItem>
      );
    });
  }, [abbrevDow, abbrevMonths, handleTeamGameClick, puzzleDates,
    selectedTeamGameId, sortFriendsFunc, teamGames]);

  const handleMenuItemClick = useCallback(index => {
    handleClose();
    setSelectedTeamGameId(null);
    const dow = weekdays[index];
    if (user) {
      if (loggers) loggers.socketLogger.log('Send event: get-game-by-dow');
      socket.emit('get-game-by-dow', dow, user.uid);
    }
  }, [socket, user, weekdays, loggers]);

  const showMenu = useCallback(() => {
    const currentMenuItems = menuContent.map((menuItem, index) => (
      <MenuItem
        key={menuItem.dow}
        onClick={() => handleMenuItemClick(index)}
        className={!selectedTeamGameId && menuItem.dow === game.dow ? 'focused-menu-item' : ''}
      >
        { /* eslint-disable-next-line react/no-danger */ }
        <div dangerouslySetInnerHTML={menuItem.innerHTML} />
      </MenuItem>
    ));
    if (Object.keys(teamGames).length > 0) {
      currentMenuItems.unshift([gamesWithFriends, displayTeamGames(), soloGameHeading]);
    }
    setMenuItems(currentMenuItems);
  }, [displayTeamGames, game.dow, gamesWithFriends, handleMenuItemClick, menuContent,
    selectedTeamGameId, soloGameHeading, teamGames]);

  const updateHeading = useCallback(() => {
    const date = new Date(game.date);
    const month = abbrevMonths[date.getMonth()];
    setHeading({ __html: `<span class="heading-dow">My ${game.dow}</span> <span class="heading-date">${month} ${date.getDate()}</span>` });
  }, [abbrevMonths, game.date, game.dow]);

  /**
   * Load puzzle dates
   */
  useEffect(() => {
    if (socket === null || !loggers) return;
    const { socketLogger } = loggers;

    socketLogger.log('Send event: get-puzzle-dates');
    socket.emit('get-puzzle-dates');

    socket.once('load-puzzle-dates', pDates => {
      setPuzzleDates(pDates);
    });
  }, [socket, loggers]);

  useEffect(() => {
    if (puzzleDates) {
      const menuItemContent = [];
      weekdays.forEach(dow => {
        const date = new Date(puzzleDates[dow]);
        const month = months[date.getMonth()];
        menuItemContent.push({
          dow,
          innerHTML: { __html: `<span>${dow}</span><span class="date-subtitle">${month} ${date.getDate()}</span>` },
        });
      });
      setMenuContent(menuItemContent);
    }
  }, [months, puzzleDates, weekdays]);

  useEffect(() => {
    if (game.loaded) {
      if (game.players[0].playerId === user.uid) {
        updateHeading();
      } else {
        setSelectedTeamGameId(game.gameId);
        updateTeamGameHeading(game);
      }
    }
    if (menuContent) {
      showMenu();
    }
  }, [game, menuContent, teamGames, selectedTeamGameId, user.uid,
    updateHeading, updateTeamGameHeading, showMenu]);

  return (
    <>
      <button
        type="button"
        className="gameMenu-title"
        onClick={handleClick}
      >
        { /* eslint-disable-next-line react/no-danger */ }
        <div className="gameMenu-span" dangerouslySetInnerHTML={heading} />
        <KeyboardArrowDownIcon className="arrow" />
      </button>
      <Menu
        className="menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
      >
        {menuItems}
      </Menu>
    </>
  );
});

GameMenu.propTypes = {
  socket: PropTypes.object.isRequired,
  auth: PropTypes.object.isRequired,
  loggers: PropTypes.object.isRequired,
};

export default GameMenu;
