import React from 'react';
import lifebuoy from '../images/life-buoy.svg';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import '../styles/common.css';
import "../styles/Navbar.css";
import { useDispatch, useSelector } from 'react-redux';
import {
  toggleAutocheck,
  resetGame,
  requestCheck,
  requestCheckPuzzle,
  requestReveal,
  removeCheck
} from '../redux/slices/gameSlice';


export default function HintMenu(props) {
  const dispatch = useDispatch();

  /**
   * Get game state
   */
  const game = useSelector(state => {
    return state.game
  });
  const board = game.board;
  const autocheck = game.autocheck;

  /**
   * Get puzzle state
   */
  const grid = game.gameGrid;
  const numCols = game.numCols;

  /**
   * Get player state
   */
  const pov = useSelector(state => {
    return state.pov
  });
  const activeWord = pov.activeWord;
  const orientation = pov.orientation;
  const focus = pov.focus;
  const wordHighlight = pov.wordHighlight;


  function checkActiveSquare() {
    if (board[focus].input !== '') {
      dispatch(requestCheck({ id: focus }));
    }
  }

  function checkActiveWord() {
    wordHighlight.forEach( index => {
      if (board[index].input !== '') {
        dispatch(requestCheck({ id: index }));
      }
    });
  }

  function revealSquare() {
      if (board[focus].input === grid[focus].answer) {
        checkActiveSquare();
      } else {
        dispatch(requestReveal({ id: focus }));
      }
  }

  function revealWord() {
      wordHighlight.forEach( i => {
        if (!board[i].reveal && !board[i].verified) {
          if (board[i].input === grid[i].answer) {
            dispatch(requestCheck({ id: i }));
          } else {
            dispatch(requestReveal({ id: i }));
          }
        }
      });
  }

  function isPlayableSquare(index) {
    return grid[index].answer !== '.';
  }

  function revealPuzzle() {
      board.forEach((square, i) => {
        if (isPlayableSquare(i) && !board[i].reveal && !board[i].verified) {
          if (board[i].input === grid[i].answer) {
            dispatch(requestCheck({ id: i }));
          } else {
            dispatch(removeCheck({ id: i }));
            dispatch(requestReveal({ id: i }));
          }
        }
      });
  }

  function clearPuzzle() {
      dispatch(resetGame());
  };

  const mainHintMenuItems = [
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
      onClick: () => dispatch(requestCheckPuzzle()),
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

  function handleAutocheck() {
    dispatch(toggleAutocheck());
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
    const currentMenuItems = currentMenu.map( menuItem => {
      return (
        <MenuItem 
          key={menuItem.id} 
          onClick={menuItem.onClick}
          disabled={menuItem.disabled ?? false}
          style={menuItem.style ?? {}}>
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
          horizontal: 'center',
        }}
      >
        {menuItems}
      </Menu>
    </React.Fragment>
  )
}