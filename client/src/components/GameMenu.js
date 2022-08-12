import React from 'react';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import '../styles/common.css';
import "../styles/Navbar.css";
import { useDispatch, useSelector } from 'react-redux';
import useAuthenticatedUser from '../hooks/useAuthenticatedUser';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default React.memo((props) => {
  const { 
    socket,
    auth, 
    gameId
  } = props;
  // console.log("Render game menu");
  const dispatch = useDispatch();
  const game = useSelector(state => state.game);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // const user = useAuthenticatedUser(auth);
  const [user, initialized] = useAuthenticatedUser(auth);

  const [anchorEl, setAnchorEl] = React.useState(null);
  const [menuContent, setMenuContent] = React.useState(null);
  const [menuItems, setMenuItems] = React.useState([]);
  const [puzzleDates, setPuzzleDates] = React.useState(null);
  const [heading, setHeading] = React.useState({__html: "Loading..."});
  const [teamGames, setTeamGames] = React.useState(null);
  const [selectedTeamGameId, setSelectedTeamGameId] = React.useState(null);
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
   React.useEffect(() => {
    if (socket === null) return;
    socket.emit('get-puzzle-dates');

    socket.once('load-puzzle-dates', puzzleDates => {
      setPuzzleDates(puzzleDates);
    });
  }, [socket]);

  React.useEffect(() => {
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

  // React.useEffect(() => {
  //   console.log(`gameMenu Game id: ${gameId}`);
  //   if (socket === null) return;
  //   if (!gameId) {
  //     if (user) {
  //       socket.emit("get-default-game", user.uid);
  //     } else {
  //       socket.emit("get-default-game");
  //     }
  //   }

  // }, [socket, user, gameId]);
  React.useEffect(() => {
    if (socket === null || !initialized) return;
    if (!gameId) {
      if (user) {
        console.log(`Getting default game with ${user.uid}`);
        socket.emit("get-default-game", user.uid);
      } 
    }

  }, [socket, user, initialized, gameId]);

  React.useEffect(() => {
    if (socket === null || user === null || !initialized) return;
    if (user) {
      console.log(`Get team games with ${user.uid}`)
      socket.emit("get-team-games", user.uid);

      socket.once("load-team-games", teamGames => {
        if (teamGames && teamGames.length > 0) {
          // sort alphabetically by display name
          setTeamGames(teamGames);
        }
      });
    }


  }, [socket, user, initialized]);

  React.useEffect(() => {
    if (game.loaded) {
      if (game.players[0] === user.uid) {
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
    if (!teamGames) return;
    let date = new Date(game.date);
    let dow = abbrevDow[game.dow];
    let month = abbrevMonths[date.getMonth()];

    let gameInfo = teamGames.find(teamGame => teamGame.gameId === game.gameId);
    setHeading({__html: `<span class="heading-dow">${gameInfo.friend.displayName.split(' ')[0]}'s</span> <span class="heading-date">${dow} ${month} ${date.getDate()}</span>`});
  }

  const soloGameHeading = <MenuItem className="submenu-heading">My Games</MenuItem>
  const gamesWithFriends = <MenuItem className="submenu-heading">Friends' Games</MenuItem>

  function displayTeamGames() {
    return teamGames.map(game => {
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
    navigate(`/crossword-with-friends?gameId=${game.gameId}`);

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
    if (teamGames) {
      currentMenuItems.unshift([gamesWithFriends, displayTeamGames(), soloGameHeading]);
    }
    setMenuItems(currentMenuItems);
  }

  function handleMenuItemClick(index) {
    handleClose();
    setSelectedTeamGameId(null);
    const dow = weekdays[index];
    if (user) {
      console.log(`[${socket.id}] Looking for game from ` + user.uid);
      socket.emit('get-game-by-dow', dow, user.uid);
    } 
  }
  
  function updateHeading() {
    let date = new Date(game.date);
    let month = abbrevMonths[date.getMonth()];
    setHeading({__html: `<span class="heading-dow">${game.dow}</span> <span class="heading-date">${month} ${date.getDate()}</span>`});
  }
  return (
    <React.Fragment>
      <div className="gameMenu-title" onClick={handleClick}>
        <div dangerouslySetInnerHTML={heading}></div>
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
    </React.Fragment>
  )
});