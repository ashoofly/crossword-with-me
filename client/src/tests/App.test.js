/* eslint-disable testing-library/no-node-access */
import React from "react";
import { renderWithProviders } from "./test-utils";
import userEvent from "@testing-library/user-event";
import App from "../components/App";

describe("App component", () => {
  // it("renders App", () => {
  //   const { container } = renderWithProviders(<App />);
  //   expect(container).toMatchSnapshot();
  // });
  it("When user presses key, active square will show key value", () => {
    renderWithProviders(<App />);
    // const qButton = document.querySelector('#q');
    // const activeSquareValue = document.querySelector('.focused-letter .square-value')
    // expect(activeSquareValue.textContent).toMatch('');
    // userEvent.click(qButton);
    // expect(activeSquareValue.textContent).toMatch('Q');
  });
  // it("When user enters letter, automatically advances to next empty square", () => {
  //   renderWithProviders(<App />);
  //   const activeSquare = document.querySelector('.focused-letter')
  //   console.log(activeSquare);


  // });
  it("When user hits backspace, letter is cleared", () => {

  });
  it("When user hits backspace and input is already blank, cursor moves to previous square and clears that letter", () => {

  });
  it("When user clicks Check Square, if input is incorrect, red slash", () => {

  });
  it("When user clicks Check Square, if input is partially incorrect, yellow slash", () => {

  });
  it("When user clicks Check Square, if input correct, verified color", () => {

  });
  it("When pencil is active, input is rendered in 50% opacity", () => {

  });
  it("When user clicks Check Puzzle, entire Puzzle is checked", () => {

  });
  it("When user clicks Clear Puzzle, board goes back to initial state", () => {
    // user input cleared

    // any incorrect check marks cleared

  });
  it("When user clicks on square, the word is highlighted according to active orientation", () => {

  });
  it("When square is clicked again, orientation changes and different word is highlighted and puzzle clue is changed", () => {

  });
  it("When user clicks on clue, orientation changes, clue changes and highlighted active word changes", () => {

  });
  it("When zoom is active, puzzle grid zooms in", () => {

  });
  it("When rebus is active, user can type in multiple characters", () => {});
});

describe("Socket io", () => {
  it("When different browser agent changes crossword, all other browser agents with same game id receive changes", () => {

  });
  it("When different browser agents within same game id change same thing, the most recent one will always persist and be the same for all instances of the game", () => {

  });
  it("When new browser agent signs into game in progress, loads current state", () => {});
  it("Different game ids have different data", () => {});
});


// describe('Square', () => {
//   it("If pencil is active, value will have opacity of 0.5", () => {});
//   it("If autocheck is active, value will be marked verified or incorrect", () => {});
//   it("If receives check request, it will show square as verified or incorrect", () => {});
//   it("If check request and nothing is in square, it will do nothing", () => {});
//   it("When user presses reveal, active squares will reveal the answers and include reveal marker and have verified color", () => {});
//   it("When user presses clear, all squares will be cleared", () => {});
//   it("If incorrect value is deleted, incorrect mark will also be deleted", () => {});
//   it("If user presses key while on verified square, nothing happens to verified square", () => {});
//   it("If rebus is active, more than one character can be entered in square", () => {});
//   it("If multi-character square is partially correct, will be marked in yellow when checked", () => {});
// });

// describe('Board', () => {
//   it("When autocheck is flipped back off, already verified and incorrect markers will stay, but no new ones will be added.", () => {});
//   it("When user clicks 'Check Square', other unaffected squares will not be checked", () => {});
//   it("When user clicks 'Check Word', it will show active word squares as verified or incorrect", () => {});
//   it("When user clicks 'Check Puzzle', it will verify or mark incorrect any written squares", () => {});
// });











