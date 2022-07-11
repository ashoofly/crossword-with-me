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

  function handleRebusButtonClick() {
    setRebusActive(prevState => !prevState);
    jumpToSquare(activeWord.focus);
  }

  function isRebusButtonDisabled() {
    return false;
  }

  function handleClick(e) {
    handleKeyDown({
      key: e.target.id,
      preventDefault: () => {}
    })
  }

  return (
    <div className="Keyboard">
      <div className="first-row">
        <Button id="q" onClick={handleClick}>Q</Button>
        <Button>W</Button>
        <Button>E</Button>
        <Button>R</Button>
        <Button>T</Button>
        <Button>Y</Button>
        <Button>U</Button>
        <Button>I</Button>
        <Button>O</Button>
        <Button>P</Button>
      </div>
      <div className="second-row">
        <Button className="first-letter">A</Button>
        <Button>S</Button>
        <Button>D</Button>
        <Button>F</Button>
        <Button>G</Button>
        <Button>H</Button>
        <Button>J</Button>
        <Button>K</Button>
        <Button>L</Button>
      </div>
      <div className="third-row">
        <Button className={`rebus ${rebusActive ? "rebus-active": ''}`} variant="contained" onClick={handleRebusButtonClick} disabled={isRebusButtonDisabled()}>Rebus</Button>
        <Button>Z</Button>
        <Button>X</Button>
        <Button>C</Button>
        <Button>V</Button>
        <Button>B</Button>
        <Button>N</Button>
        <Button>M</Button>
        <Button><img className="backspace" src={backspace} alt="backspace" /></Button>
      </div>
    </div>
  )
}