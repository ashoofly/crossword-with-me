import { memo } from "react";
import Dialog from '@mui/material/Dialog';
import '../styles/common.css';
import '../styles/InfoPage.css';
import { useSelector } from 'react-redux';


export default memo((props) => {
  // console.log("Render info page");
  const { open, handleClose } = props;
  const game = useSelector(state => {
    return state.game
  });


  function getTitle() {
    if (game.hasTitle) {
      return game.title;
    } else {
      const sourceAndDateRegex = /([A-Za-z\s]+), (.+)/;
      const [ original, source, dailyTitle ] = sourceAndDateRegex.exec(game.title);
      return dailyTitle;
    }
  }

  return (
    <Dialog onClose={handleClose} open={open}
      className="info-page">
      <header>
        <h1>{getTitle()}</h1>
        <h3>By {game.author}</h3>
        <h4>Edited by {game.editor}</h4>
        <small>	&copy; {game.copyright}</small>
      </header>
      <h3>Mobile Tips</h3>
      <ul>
        <li>When dragging board around in zoomed-in mode, best to do it from the center of the screen to avoid triggering the automatic browser swipe navigation.</li>
      </ul>
      <h3>Keyboard Shortcuts</h3>
      <ul>
        <li><b>Tab</b> or <b>Shift + Right Arrow</b> to go to next word</li>
        <li><b>Shift + Left Arrow</b> to go to previous word</li>
        <li><b>Space bar</b> toggles clue orientation</li>
      </ul>
      <h3>What is Rebus?</h3>
      <p>Activate the "rebus" button to input multiple characters in a square.</p>
      <p>If you see a yellow (instead of the typical red) slash when checking your puzzle, it means you got the square partially correct (which can happen on a rebus square).</p>
      <h3>What is the pencil for?</h3>
      <p>Activate the "pencil" to tentatively mark in squares you're not sure about.</p>
      <h3>Thank you</h3>
      <ul>
        <li><a href="https://www.xwordinfo.com/">xword.info</a> for the daily crossword data</li>
        <li>Ethan Schoonover for the <a href="https://ethanschoonover.com/solarized/">Solarized</a> color scheme</li>
      </ul>
    </Dialog>
  )
});