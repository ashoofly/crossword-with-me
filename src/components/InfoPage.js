import React from "react";
import data from "../api/wednesday";
import Dialog from '@mui/material/Dialog';


export default function InfoPage(props) {

  const { open, handleClose } = props;
  //TODO: Add custom styling.

  return (
    <Dialog onClose={handleClose} open={open}
      className="info-page"
      >
      <h1>{data.title}</h1>
      <h2>By {data.author.toUpperCase()}</h2>
      <h3>Edited by {data.editor.toUpperCase()}</h3>
      <small>	&copy; {data.copyright}</small>
      <h3>What is Rebus?</h3>
      <p>This button is for some tricky puzzles that may have more than one character per square. Activate this button when you need to input more than one letter into a square.</p>
      <p>If you see a yellow (instead of the typical red) slash when checking your puzzle, it means you got the square partially correct (which can happen on a rebus square).</p>
      <h3>Keyboard Shortcuts</h3>
      <ul>
        <li><b>Tab</b> or <b>Shift + Right Arrow</b> to go to next word</li>
        <li><b>Shift + Left Arrow</b> to go to previous word</li>
        <li><b>Space bar</b> toggles clue orientation</li>
      </ul>
    </Dialog>
  )
}