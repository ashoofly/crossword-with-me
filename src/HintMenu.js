import React from 'react';
import lifebuoy from './images/life-buoy.svg';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';

export default function HintMenu(props) {

  const {
    autocheck,
    setAutocheck
  } = props;

  const mainHintMenuItems = [
    {
      id: 1,
      text: `Turn ${autocheck ? "OFF" : "ON"} Autocheck`,
      onClick: toggleAutocheck
    },
    {
      id: 2,
      text: "Check Square",
      onClick: checkSquare,
      classNames: autocheck ? 'disabled' : ''
    },
    {
      id: 3,
      text: "Check Word",
      onClick: checkWord,
      classNames: autocheck ? 'disabled' : ''
    },
    {
      id: 4,
      text: "Check Puzzle",
      onClick: checkPuzzle,
      classNames: autocheck ? 'disabled' : ''
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
        color: "red"
      }
    }
  ];

  const [anchorEl, setAnchorEl] = React.useState(null);
  const [showDetailedMenu, setShowDetailedMenu] = React.useState(false);
  const [menuItems, setMenuItems] = React.useState([]);
  const open = Boolean(anchorEl);
  React.useEffect(showMenu, [showDetailedMenu, autocheck]);


  const handleClick = (e) => {
    setAnchorEl(e.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
    setShowDetailedMenu(false);
  }

  function toggleAutocheck() {
    setAutocheck( prevState => !prevState);
  }

  function checkSquare() {}
  function checkWord() {}
  function checkPuzzle() {}
  function goToRevealMenu() {
    setShowDetailedMenu(true);
  }
  function revealSquare() {}
  function revealWord() {}
  function revealPuzzle() {}
  function clearPuzzle() {}

  function showMenu() {
    let currentMenu;
    if (showDetailedMenu) {
      currentMenu = revealMenuItems;
    } else {
      currentMenu = mainHintMenuItems;
    }
    const currentMenuItems = currentMenu.map( menuItem => {
      return (
        <MenuItem 
          key={menuItem.id} 
          onClick={menuItem.onClick}
          //TODO: This does not work, you need to override it like this: https://mui.com/material-ui/customization/theme-components/
          className={menuItem.classNames ?? ''}
          style={menuItem.style ?? {}}>
            {menuItem.text}
        </MenuItem>
      )
    });
    setMenuItems(currentMenuItems);
  }

  return (
    <div>
      <img onClick={handleClick} className="check-puzzle" src={lifebuoy} alt="check_puzzle" />
      <Menu
        id="hint-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
      >
        {menuItems}
      </Menu>
    </div>
  )
}