/**
 * Mobile layout:               Landscape Tablet layout:
 *
 * |<--- W: 100 % ----->|         |<-------- W: 50 % ------->|<-------- W: 50 % ------->|
 * ----------------------         -------------------------------------------------------
 * | Title Bar (H: 8%)  |         | Navbar (H: 10%)          | Title Bar (H: 10%)       |
 * |---------------------         ------------------------------------------------------|
 * | Nav Bar   (H: 8%)  |         | Board  (H: 90%)          | Clue (H: 55%)            |
 * |---------------------         |                          |                          |
 * | Board  (H <= 53%)  |         |                          |                          |
 * | x                  |         |                          |                          |
 * | x                  |         |                          |                          |
 * | x                  |         |                          |                          |
 * | x                  |         |                          |                          |
 * |--------------------|         |                          |--------------------------|
 * | Clue     (H: 10%)  |         |                          | Keyboard (H: 30%)        |
 * |--------------------|         |                          |                          |
 * | Keyboard (H: 23%)  |         |                          |                          |
 * | x                  |         |                          |                          |
 * | x                  |         |                          |                          |
 * ----------------------         -------------------------------------------------------
 *
 * Desktop layout:
 * |<--------------- W: 100% ------------------->|
 * -----------------------------------------------
 * | Title Bar (H: min(80px, 8%))                |
 * |---------------------------------------------|
 * | Nav Bar (H: min(80px, 8%) + 50px)           |
 * |                                             |
 * |---------------------------------------------|
 * | Clue ( H: min(100px, 10%))                   |
 * |                                             |
 * |---------------------------------------------|
 * |      Board (H: Remainder to 100%)           |
 * |     ---------------------------             |
 * |     |x                        |             |
 * |     |x <-- W: max(1000px) --->|             |
 * |     |x                        |             |
 * |     |x                        |             |
 * |     |...                      |             |
 * |     ---------------------------             |
 * -----------------------------------------------
 */

export function setAppLayout(window, isWidescreen) {
  const isTouchDevice = 'ontouchstart' in window;
  const isTablet = isWidescreen && isTouchDevice;
  const { width, height } = window.visualViewport;
  const maxBoardHeightSmallScreen = height * 0.53;
  const barHeight = (isTablet) ? (height * 0.1) : (height * 0.08);
  const clueHeight = height * 0.1;
  const keyboardHeight = isWidescreen ? (height * 0.3) : (height * 0.23);
  const keyboardRowMargin = 2;
  const keyboardMargins = 2 + 3 + 10;
  const keyboardButtonMinHeight = (keyboardHeight - keyboardMargins) / 3;
  document.documentElement.style.setProperty('--app-height', `${height}px`);
  document.documentElement.style.setProperty('--app-width', `${width}px`);
  document.documentElement.style.setProperty('--max-board-height', `${maxBoardHeightSmallScreen}px`);
  document.documentElement.style.setProperty('--clue-height', `${clueHeight}px`);
  document.documentElement.style.setProperty('--board-padding', '2px');
  document.documentElement.style.setProperty('--bar-height', `${barHeight}px`);
  document.documentElement.style.setProperty('--keyboard-height', `${keyboardHeight}px`);
  document.documentElement.style.setProperty('--keyboard-row-margin', `${keyboardRowMargin}px`);
  document.documentElement.style.setProperty('--keyboard-button-min-height', `${keyboardButtonMinHeight}px`);

  if (isWidescreen) {
    const middleSectionHeight = height - (barHeight + keyboardHeight);
    document.documentElement.style.setProperty('--middle-section-height', `${middleSectionHeight}px`);
  }
}

function getSquareSideLength(window, isWidescreen, numCols, numRows, zoomActive) {
  const boardPadding = 2;
  const isTouchDevice = 'ontouchstart' in window;
  const isTablet = isWidescreen && isTouchDevice;
  const { height } = window.visualViewport;
  const barHeight = isTablet ? (height * 0.1) : (height * 0.08);
  const clueHeight = height * 0.1;
  if (!isTouchDevice) {
    /* desktop */
    return (height - (2 * barHeight + clueHeight) - 20) / (zoomActive ? 10 : numRows);
  } else if (isWidescreen) {
    /* landscape tablet */
    return ((window.visualViewport.height * 0.9) - (2 * boardPadding))
      / (zoomActive ? 10 : numRows);
  } else {
    /* mobile */
    return (window.visualViewport.width - (2 * boardPadding)) / (zoomActive ? 10 : numCols);
  }
}

export function setBoardLayout(window, isWidescreen, numCols, numRows, zoomActive) {
  const squareSideLength = getSquareSideLength(window, isWidescreen, numCols, numRows, zoomActive);
  const boardWidth = squareSideLength * numCols;
  document.documentElement.style.setProperty('--square-side-length', `${squareSideLength}px`);
  document.documentElement.style.setProperty('--board-width', `${boardWidth}px`);
}

export function combinePlayerColors(activeWordArray, activeLetterArray) {
  const allColors = [];
  activeWordArray.forEach(color => {
    const cssProperty = `--${color}-focus-word`;
    const cssValue = getComputedStyle(document.documentElement).getPropertyValue(cssProperty);
    const rgbArray = cssValue.replace(/[^\d,]/g, '').split(',').map(val => parseInt(val, 10));
    allColors.push(rgbArray);
  });
  activeLetterArray.forEach(color => {
    const cssProperty = `--${color}-focus-square`;
    const cssValue = getComputedStyle(document.documentElement).getPropertyValue(cssProperty);
    const rgbArray = cssValue.replace(/[^\d,]/g, '').split(',').map(val => parseInt(val, 10));
    allColors.push(rgbArray);
  });
  const minR = Math.min(...allColors.map(rgbVal => rgbVal[0]));
  const minG = Math.min(...allColors.map(rgbVal => rgbVal[1]));
  const minB = Math.min(...allColors.map(rgbVal => rgbVal[2]));
  const minRGB = [minR, minG, minB];

  const maxR = Math.max(...allColors.map(rgbVal => rgbVal[0]));
  const maxG = Math.max(...allColors.map(rgbVal => rgbVal[1]));
  const maxB = Math.max(...allColors.map(rgbVal => rgbVal[2]));
  const maxRGB = [maxR, maxG, maxB];

  const midRGB = [];
  minRGB.forEach((minColorComp, index) => {
    midRGB.push((minColorComp + maxRGB[index]) / 2);
  });
  const combinedColors = `rgb(${midRGB[0]}, ${midRGB[1]}, ${midRGB[2]})`;
  return combinedColors;
}

export function showColorWithRevealedMarker(rgb) {
  return `linear-gradient(to top right, ${rgb} 85%,rgb(211,54,130) 10%) top right/var(--square-side-length) var(--square-side-length) no-repeat`;
}

export function showColorWithVerifiedMarker(rgb) {
  return `linear-gradient(to top right, ${rgb} 85%,rgb(4, 141, 25) 10%) top right/var(--square-side-length) var(--square-side-length) no-repeat`;
}

export function getClassNameAndRgbValue(activeWordColors, activeLetterColors) {
  const activeWordArray = activeWordColors || [];
  const activeLetterArray = activeLetterColors || [];
  let color, type;
  if (activeWordArray.length === 1) {
    [color] = activeWordColors;
    type = 'word';
  } else if (activeLetterArray.length === 1) {
    [color] = activeLetterColors;
    type = 'square';
  }
  const className = `${color}-focus-${type}`;
  const rgbValue = getComputedStyle(document.documentElement).getPropertyValue(`--${className}`);
  return { className, rgbValue };
}
