import { useState, useEffect, Fragment, memo } from 'react';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import "../styles/Navbar.css";
import { useDispatch, useSelector } from 'react-redux';
import useAuthenticatedUser from '../hooks/useAuthenticatedUser';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Logger from '../utils/logger';

export default memo((props) => {
  const { 
    socket,
    auth, 
  } = props;
  // console.log("Render game menu");
  const dispatch = useDispatch();
  const game = useSelector(state => state.game);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const logger = new Logger("GameMenu");

  const [user, initialized] = useAuthenticatedUser(auth);
  const teamGames = useSelector(state => state.pov.teamGames);

  const [anchorEl, setAnchorEl] = useState(null);
  const [menuContent, setMenuContent] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [puzzleDates, setPuzzleDates] = useState(null);
  const [heading, setHeading] = useState({__html: "Loading..."});
  const [selectedTeamGameId, setSelectedTeamGameId] = useState(null);
  const open = Boolean(anchorEl);
  const handleClick = (e) => {
    setAnchorEl(e.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  }

  /**
   * Load puzzle dates
   */
   useEffect(() => {
    if (socket === null) return;
    logger.log(`Send event: get-puzzle-dates`);
    socket.emit('get-puzzle-dates');

    socket.once('load-puzzle-dates', puzzleDates => {
      setPuzzleDates(puzzleDates);
    });
  }, [socket]);

  useEffect(() => {
    if (puzzleDates) {
      let menuItemContent = [];
      weekdays.forEach(dow => {
        let date = new Date(puzzleDates[dow]);
        let month = months[date.getMonth()];
        menuItemContent.push({
          "dow": dow,
          "innerHTML": {__html: `<span>${dow}</span><span class="date-subtitle">${month} ${date.getDate()}</span>`}
        });
      });
      setMenuContent(menuItemContent);
    }
  }, [puzzleDates]);


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
  }, [game, menuContent, teamGames, selectedTeamGameId]);

  const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const months = [
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
    'December'
  ];
  const abbrevMonths = [
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
    'Dec'
  ];
  const abbrevDow = {
    "Monday": 'Mon',
    "Tuesday": 'Tues',
    "Wednesday": 'Wed',
    "Thursday": 'Thurs',
    "Friday": 'Fri',
    "Saturday": 'Sat',
    "Sunday": 'Sun'
  }

  function updateTeamGameHeading(game) {
    if (!teamGames || teamGames.length === 0) return;
    let date = new Date(game.date);
    let dow = abbrevDow[game.dow];
    let month = abbrevMonths[date.getMonth()];
    logger.log(teamGames);
    let gameInfo = teamGames.find(teamGame => teamGame.gameId === game.gameId);
    if (gameInfo) {
      setHeading({__html: `<span class="heading-dow">${gameInfo.friend.displayName.split(' ')[0]}'s</span> <span class="heading-date">${dow} ${month} ${date.getDate()}</span>`});
    }
  }

  const soloGameHeading = <MenuItem className="submenu-heading">My Games</MenuItem>
  const gamesWithFriends = <MenuItem className="submenu-heading">Friends' Games</MenuItem>

  function displayTeamGames() {
    // sort team games alphabetically by friend display name, then dow
    const sorted = teamGames.slice().sort((a, b) => (a.friend.displayName > b.friend.displayName) ? 1 
    : (a.friend.displayName === b.friend.displayName) ? 
        ((weekdays.indexOf(a.dow) > weekdays.indexOf(b.dow)) ? 1 : -1) 
        : -1);

    return sorted.map(game => {
      let date = new Date(puzzleDates[game.dow]);
      let month = abbrevMonths[date.getMonth()];
      let dow = abbrevDow[game.dow];

      return (
        <MenuItem
          key={game.gameId}
          onClick={() => handleTeamGameClick(game)}
          className={ selectedTeamGameId === game.gameId ? "focused-menu-item": ""}
        >
          <div dangerouslySetInnerHTML=
            {{__html: `<span>${game.friend.displayName.split(' ')[0]}</span><span class="date-subtitle">${dow} ${month} ${date.getDate()}</span>`}}>
          </div>
        </MenuItem>
      )
    });
  }

  function handleTeamGameClick(game) {
    handleClose();
    setSelectedTeamGameId(game.gameId);
    navigate(`?gameId=${game.gameId}`);

  }


  function showMenu() {
    const currentMenuItems = menuContent.map((menuItem, index) => {
      return (
        <MenuItem
          key={index}
          onClick={() => handleMenuItemClick(index)}
          className={ !selectedTeamGameId && menuItem.dow === game.dow ? "focused-menu-item" : "" }
        >
          <div dangerouslySetInnerHTML={menuItem.innerHTML}></div>
        </MenuItem>
      )
    });
    if (Object.keys(teamGames).length > 0) {
      currentMenuItems.unshift([gamesWithFriends, displayTeamGames(), soloGameHeading]);
    }
    setMenuItems(currentMenuItems);
  }

  function handleMenuItemClick(index) {
    handleClose();
    setSelectedTeamGameId(null);
    const dow = weekdays[index];
    if (user) {
      logger.log(`Send event: get-game-by-dow`);
      socket.emit('get-game-by-dow', dow, user.uid);
    } 
  }
  
  function updateHeading() {
    let date = new Date(game.date);
    let month = abbrevMonths[date.getMonth()];
    setHeading({__html: `<span class="heading-dow">My ${game.dow}</span> <span class="heading-date">${month} ${date.getDate()}</span>`});
  }
  return (
    <Fragment>
      <div 
        className="gameMenu-title" 
        onClick={handleClick}
      >
        <div className="gameMenu-span" dangerouslySetInnerHTML={heading}></div><KeyboardArrowDownIcon className="arrow" />
      </div>
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
    </Fragment>
  )
});