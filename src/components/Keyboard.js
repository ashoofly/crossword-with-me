import React from "react";
import '../styles/common.css';
import "../styles/Keyboard.css";
import Button from '@mui/material/Button';

export default function Keyboard() {
  return (
    <div className="Keyboard">
      <div className="first-row">
        <Button id="keyboard-key">Q</Button>
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
        <Button>A</Button>
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
        <Button>Rebus</Button>
        <Button>Z</Button>
        <Button>X</Button>
        <Button>C</Button>
        <Button>V</Button>
        <Button>B</Button>
        <Button>N</Button>
        <Button>M</Button>
        <Button>BACK</Button>
      </div>
    </div>
  )
}