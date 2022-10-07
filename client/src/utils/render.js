export function setAppLayout(window, isWidescreen) {
  const isTouchDevice = 'ontouchstart' in window;
  const isTablet = isWidescreen && isTouchDevice;
  const { width, height } = window.visualViewport;
  const maxBoardHeightSmallScreen = height * 0.53;
  // TODO: Check is this distinction necessary?
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

export function setBoardLayout(window, isWidescreen, numCols) {
  const boardPadding = 2;
  const isTouchDevice = 'ontouchstart' in window;
  const { height } = window.visualViewport;
  const barHeight = isWidescreen ? (height * 0.1) : (height * 0.08);

  const squareSideLength = !isTouchDevice ?  
    ((height - (3 * barHeight) - 20) / (zoomActive ? 10 : numRows)) 
      : 
      (isWidescreen ? 
        (((window.visualViewport.height * 0.9) - (2 * boardPadding)) / (zoomActive ? 10 : numRows)) 
            : 
        ((window.visualViewport.width - (2 * boardPadding)) / (zoomActive ? 10 : numCols)));
  const boardWidth = squareSideLength * numCols;
  document.documentElement.style.setProperty('--square-side-length', `${squareSideLength}px`);
  document.documentElement.style.setProperty('--board-width', `${boardWidth}px`);
}