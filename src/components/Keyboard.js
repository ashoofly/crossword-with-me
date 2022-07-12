import React from "react";
import '../styles/common.css';
import "../styles/Keyboard.css";
import Button from '@mui/material/Button';
import backspace from '../images/backspace-outline.png';

export default function Keyboard(props) {

  const { 
    rebusActive,
    setRebusActive,
    activeWord,
    jumpToSquare,
    handleKeyDown
  } = props;

  const firstRowKeys = ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'];
  const secondRowKeys = ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'];
  const thirdRowKeys = ['rebus', 'z', 'x', 'c', 'v', 'b', 'n', 'm', "Backspace"];
  const rows = {
    firstRow: firstRowKeys,
    secondRow: secondRowKeys,
    thirdRow: thirdRowKeys
  };

  function handleRebusButtonClick() {
    setRebusActive(prevState => !prevState);
    jumpToSquare(activeWord.focus);
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
    return keys.map( key => {
        if (key === "rebus") {
          return (<Button 
                    key={key}
                    className={`rebus ${rebusActive ? "rebus-active": ''}`} 
                    onClick={handleRebusButtonClick}>
                      {key.toUpperCase()}
                  </Button>);

        } else if (key === "Backspace") {
          return (<Button key={key}>
                    <img className="backspace" src={backspace} alt="backspace" />
                  </Button>);

        } else if (key === "a") {
          return <Button key={key} id={key} className="firstLetter" onClick={handleClick}>{key.toUpperCase()}</Button>

        } else {
          return <Button key={key} id={key} onClick={handleClick}>{key.toUpperCase()}</Button>
        }
    });
  }

  return (
    <div className="Keyboard">
      {keys}
    </div>
  )
}