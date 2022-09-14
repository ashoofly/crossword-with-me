import { memo } from "react";
import Dialog from '@mui/material/Dialog';
import '../styles/InfoPage.css';
import { useSelector } from 'react-redux';
import Logger from '../utils/logger';
import GitHubIcon from '@mui/icons-material/GitHub';

export default memo((props) => {
  // console.log("Render info page");
  const { open, handleClose } = props;
  const game = useSelector(state => {
    return state.game
  });
  const logger = new Logger("InfoPage");


  function getTitle() {
    if (game.hasTitle) {
      return game.title;
    } else {
      return `${game.dow}, ${game.date}`;
    }
  }

  return (
    <Dialog onClose={handleClose} open={open}
      className="info-page">
      <header>
        <h1>{getTitle()}</h1>
        {game.hasTitle && <h2>{game.dow}, {game.date}</h2>}
        <h3>By {game.author}</h3>
        <h4>Edited by {game.editor}</h4>
        <small>	&copy; {game.copyright}</small>
      </header>
      <h3>Crossword Buds</h3>
      <ul>
        <li>Crossword Buds keeps the <b>current week</b> of New York Times crossword puzzles for you to play with friends.</li>
        <li>To add a friend to a game, choose <b>'Phone a Friend'</b> from the Hint menu.</li>
        <li>Only the person who started the game is <b>allowed to reveal or check</b> answers.</li>
        <li><b>Anybody can add</b> a person to the game. They must sign in to play.</li>
        <li>You can <b>start your own game</b> for every day of the week by choosing from the dropdown menu.</li>
      </ul>
      <h3>What is Rebus?</h3>
      <p>Activate the "rebus" button to input multiple characters in a square.</p>
      <p>If you see a yellow (instead of the typical red) slash when checking your puzzle, it means you got the square partially correct (which can happen on a rebus square).</p>
      <h3>What is the pencil for?</h3>
      <p>Activate the "pencil" to tentatively mark in squares you're not sure about.</p>
      <h3>Keyboard Shortcuts</h3>
      <ul>
        <li><b>Tab</b> or <b>Shift + Right Arrow</b> to go to next word</li>
        <li><b>Shift + Left Arrow</b> to go to previous word</li>
        <li><b>Space bar</b> toggles clue orientation</li>
      </ul>
      <h3>Mobile Tips</h3>
      <ul>
        <li>When dragging board around in zoomed-in mode, best to do it from the center of the screen to avoid triggering the automatic browser swipe navigation.</li>
      </ul>
      <h3>Thank you</h3>
      <ul>
        <li><a href="https://www.xwordinfo.com/">xword.info</a> for the daily crossword data</li>
        <li>Ethan Schoonover for the <a href="https://ethanschoonover.com/solarized/">Solarized</a> color scheme</li>
      </ul>
      <h3>Contact</h3>
      <a href="https://github.com/ashoofly" target="_blank" rel="noreferrer"><div className="contact"><GitHubIcon />https://github.com/ashoofly</div></a>
    </Dialog>
  )
});