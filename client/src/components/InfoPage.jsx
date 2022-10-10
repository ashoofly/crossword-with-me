import { React, memo, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import Dialog from '@mui/material/Dialog';
import '../styles/InfoPage.css';
import { useSelector } from 'react-redux';
import GitHubIcon from '@mui/icons-material/GitHub';
import Logger from '../common/Logger';

const InfoPage = memo(props => {
  const {
    open,
    handleClose,
  } = props;
  const game = useSelector(state => state.game);
  const [logger, setLogger] = useState(null);

  useEffect(() => {
    setLogger(new Logger('InfoPage'));
  }, []);

  useEffect(() => {
    if (!logger) return;
    logger.log('Rendering InfoPage component');
  }, [logger]);

  function getTitle() {
    if (game.hasTitle) {
      return game.title;
    } else {
      return `${game.dow}, ${game.date}`;
    }
  }

  return (
    <Dialog
      onClose={handleClose}
      open={open}
      className="info-page"
    >
      <header>
        <h1>{getTitle()}</h1>
        {game.hasTitle && (
          <h2>
            {game.dow}
            ,
            {game.date}
          </h2>
        )}
        <h3>
          { 'By ' }
          {game.author}
        </h3>
        <h4>
          { 'Edited by ' }
          {game.editor}
        </h4>
        <small>
          &copy;
          {game.copyright}
        </small>
      </header>
      <h3>Crossword with Me</h3>
      <ul>
        <li>
          { 'Crossword with Me keeps the ' }
          <b>current week</b>
          { ' of New York Times crossword puzzles for you to play with friends.' }
        </li>
        <li>
          { 'To add a friend to a game, choose ' }
          <b>&apos;Phone a Friend&apos;</b>
          { ' from the Hint menu.' }
        </li>
        <li>
          { 'Only the person who started the game is ' }
          <b>allowed to reveal or check</b>
          { ' answers.' }
        </li>
        <li>
          <b>Anybody can add</b>
          { ' a person to the game. They must sign in to play.' }
        </li>
        <li>
          { 'You can ' }
          <b>start your own game</b>
          { ' for every day of the week by choosing from the dropdown menu.' }
        </li>
      </ul>
      <h3>What is Rebus?</h3>
      <p>Activate the &quot;rebus&quot; button to input multiple characters in a square.</p>
      <p>
        If you see a yellow (instead of the typical red) slash when checking your puzzle,
        it means you got the square partially correct (which can happen on a rebus square).
      </p>
      <h3>What is the pencil for?</h3>
      <p>
        Activate the &quot;pencil&quot; to tentatively mark in squares you&apos;re not sure about.
      </p>
      <h3>Keyboard Shortcuts</h3>
      <ul>
        <li>
          <b>Tab</b>
          { ' or ' }
          <b>Shift + Right Arrow</b>
          { ' to go to next word' }
        </li>
        <li>
          <b>Shift + Left Arrow</b>
          { ' to go to previous word' }
        </li>
        <li>
          <b>Space bar</b>
          { ' toggles clue orientation' }
        </li>
      </ul>
      <h3>Mobile Tips</h3>
      <ul>
        <li>
          When dragging board around in zoomed-in mode,
          best to do it from the center of the screen
          to avoid triggering the automatic browser swipe navigation.
        </li>
      </ul>
      <h3>Thank you</h3>
      <ul>
        <li>
          <i>New York Times</i>
          { ' for not sending me a cease-and-desist letter yet for this multiplayer proof-of-concept' }
        </li>
        <li>
          xword.info for the daily crossword data format
        </li>
        <li>
          { 'Ethan Schoonover for the ' }
          <a href="https://ethanschoonover.com/solarized/">Solarized</a>
          { ' color scheme' }
        </li>
      </ul>
      <h3>Contact</h3>
      <p>
        Please report any issues to:
        <a href="https://github.com/ashoofly/crossword-with-friends/issues" target="_blank" rel="noreferrer">
          <div className="contact">
            <GitHubIcon />
            Crossword with Me
          </div>
        </a>
      </p>
    </Dialog>
  );
});

InfoPage.propTypes = {
  open: PropTypes.bool.isRequired,
  handleClose: PropTypes.func.isRequired,
};

export default InfoPage;
