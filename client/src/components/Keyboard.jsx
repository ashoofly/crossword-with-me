import { memo } from "react";
// import "../styles/App.css";
import "../styles/Keyboard.css";
import Button from '@mui/material/Button';
import backspace from '../images/backspace-outline.png';
import { useDispatch, useSelector } from 'react-redux';
import {
  toggleRebus
} from '../redux/slices/povSlice';
import Logger from '../utils/Logger';

export default memo((props) => {
  // console.log("Render keyboard");

  const { 
    jumpToSquare,
    handleKeyDown
  } = props;
  const logger = new Logger("Keyboard");

  const dispatch = useDispatch();
  const pov = useSelector(state => {
    return state.pov
  });
  const rebusActive = pov.rebusActive;
  const focus = pov.focused.square;

  const firstRowKeys = ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'];
  const secondRowKeys = ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'];
  const thirdRowKeys = ['rebus', 'z', 'x', 'c', 'v', 'b', 'n', 'm', "Backspace"];
  const rows = {
    firstRow: firstRowKeys,
    secondRow: secondRowKeys,
    thirdRow: thirdRowKeys
  };

  function handleRebusButtonClick() {
    dispatch(toggleRebus());
    jumpToSquare(focus);
  }

  function handleClick(e) {
    handleKeyDown({
      key: e.target.id,
      preventDefault: () => {}
    })
  }

  const keys = Object.entries(rows).map( 
    ([row, keys]) => {
      return (
        <div key={row} className={row}>
          {displayRow(keys)}
        </div>
      )
    }
  );

  function displayRow(keys) {
    let tabIndex = -1;
    return keys.map( key => {
        if (key === "rebus") {
          return (<Button 
                    key={key}
                    className={`rebus ${rebusActive ? "rebus-active": ''}`} 
                    onClick={handleRebusButtonClick}
                    tabIndex={tabIndex}>
                      {key.toUpperCase()}
                  </Button>);

        } else if (key === "Backspace") {
          return (<Button tabIndex={tabIndex} key={key}>
                    <img id={key} onClick={handleClick} className="backspace" src={backspace} alt="backspace" />
                  </Button>);

        } else if (key === "a") {
          return <Button tabIndex={tabIndex} key={key} id={key} className="firstLetter" onClick={handleClick}>{key.toUpperCase()}</Button>

        } else {
          return <Button tabIndex={tabIndex} key={key} id={key} onClick={handleClick}>{key.toUpperCase()}</Button> 
        }
    });
  }

  return (
    <div className="Keyboard">
      {keys}
    </div>
  )
});