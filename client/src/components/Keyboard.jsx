import { React, memo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import '../styles/Keyboard.css';
import Button from '@mui/material/Button';
import backspace from '../images/backspace-outline.png';
import povActions from '../redux/slices/povSlice';
import Logger from '../common/Logger';
import Cursor from '../common/Cursor';

const Keyboard = memo(props => {
  const {
    cursor,
    handleKeyDown,
  } = props;
  const logger = new Logger('Keyboard');
  logger.log('Render keyboard');

  const dispatch = useDispatch();
  const pov = useSelector(state => state.pov);
  const { rebusActive } = pov;
  const focus = pov.focused.square;

  const firstRowKeys = ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'];
  const secondRowKeys = ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'];
  const thirdRowKeys = ['rebus', 'z', 'x', 'c', 'v', 'b', 'n', 'm', 'Backspace'];
  const rows = {
    firstRow: firstRowKeys,
    secondRow: secondRowKeys,
    thirdRow: thirdRowKeys,
  };

  const handleRebusButtonClick = useCallback(() => {
    dispatch(povActions.toggleRebus());
    cursor.jumpToSquare(focus);
  }, [cursor, dispatch, focus]);

  const handleClick = useCallback(e => {
    handleKeyDown({
      key: e.target.id,
      preventDefault: () => {},
    });
  }, [handleKeyDown]);

  function displayRow(keys) {
    const tabIndex = -1;
    return keys.map(key => {
      if (key === 'rebus') {
        return (
          <Button
            key={key}
            className={`rebus ${rebusActive ? 'rebus-active' : ''}`}
            onClick={handleRebusButtonClick}
            tabIndex={tabIndex}
          >
            {key.toUpperCase()}
          </Button>
        );
      } else if (key === 'Backspace') {
        return (
          <Button tabIndex={tabIndex} key={key} onClick={handleClick}>
            <img id={key} className="backspace" src={backspace} alt="backspace" />
          </Button>
        );
      } else if (key === 'a') {
        return (
          <Button
            tabIndex={tabIndex}
            key={key}
            id={key}
            className="firstLetter"
            onClick={handleClick}
          >
            {key.toUpperCase()}
          </Button>
        );
      } else {
        return (
          <Button
            tabIndex={tabIndex}
            key={key}
            id={key}
            onClick={handleClick}
          >
            {key.toUpperCase()}
          </Button>
        );
      }
    });
  }

  const keys = Object.entries(rows).map(
    ([row, k]) => (
      <div key={row} className={row}>
        {displayRow(k)}
      </div>
    )
  );

  return (
    <div className="Keyboard">
      {keys}
    </div>
  );
});

Keyboard.propTypes = {
  cursor: PropTypes.instanceOf(Cursor).isRequired,
  handleKeyDown: PropTypes.func.isRequired,
};

export default Keyboard;
