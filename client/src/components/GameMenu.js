import React from 'react';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import '../styles/common.css';
import "../styles/Navbar.css";
import { useDispatch, useSelector } from 'react-redux';
import useAuthenticatedUser from '../hooks/useAuthenticatedUser';

export default React.memo((props) => {
  const { 
    socket,
    auth, 
    gameId
  } = props;
  // console.log("Render game menu");
  const dispatch = useDispatch();
  const game = useSelector(state => state.game);
  // const user = useAuthenticatedUser(auth);
  const [user, initialized] = useAuthenticatedUser(auth);

  const [anchorEl, setAnchorEl] = React.useState(null);
  const [menuContent, setMenuContent] = React.useState(null);
  const [menuItems, setMenuItems] = React.useState([]);
  const [puzzleDates, setPuzzleDates] = React.useState(null);
  const [heading, setHeading] = React.useState({__html: "Loading..."});
  const [displayTeamGames, setDisplayTeamGames] = React.useState(false);
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
        let capitalizedDay = dow.charAt(0).toUpperCase() + dow.slice(1); //TODO: Remove after db has switched all keys to capitalized
        let month = months[date.getMonth()];
        menuItemContent.push({
          "dow": capitalizedDay,
          "innerHTML": {__html: `<span>${capitalizedDay}</span><span class="date-subtitle">${month} ${date.getDate()}</span>`}
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

      socket.on("load-team-games", teamGames => {
        if (teamGames && teamGames.length > 0) {
          // sort alphabetically by display name
  
          setDisplayTeamGames(true);
        }
      });
    }


  }, [socket, user, initialized]);

  React.useEffect(() => {
    if (game.loaded) {
      updateHeading();
    }
    if (menuContent) {
      showMenu();
    }
  }, [game, menuContent]);

  const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
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

  function updateExampleHeading() {
    handleClose();
    setHeading({__html: `<span class="heading-dow">Allison's</span> <span class="heading-date">Aug 8</span>`});
  }

  const soloGameHeading = <MenuItem className="submenu-heading">My Games</MenuItem>
  const gamesWithFriends = <MenuItem className="submenu-heading">Friends' Games</MenuItem>
  const example = (<MenuItem onClick={updateExampleHeading}>
    <div dangerouslySetInnerHTML=
      {{__html: `<span>Allison</span><span class="date-subtitle">Mon Aug 8</span>`}}>
    </div>
  </MenuItem>);

  function showMenu() {
    const currentMenuItems = menuContent.map((menuItem, index) => {
      return (
        <MenuItem
          key={index}
          onClick={() => handleMenuItemClick(index)}
          className={ menuItem.dow === game.dow ? "focused-menu-item" : "" }
        >
          <div dangerouslySetInnerHTML={menuItem.innerHTML}></div>
        </MenuItem>
      )
    });
    currentMenuItems.unshift([gamesWithFriends, example, soloGameHeading]);
    console.log(currentMenuItems);
    setMenuItems(currentMenuItems);
  }

  function handleMenuItemClick(index) {
    handleClose();
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