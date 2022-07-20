/* eslint-disable testing-library/no-node-access */
import React from "react";
import { renderWithProviders } from "./test-utils";
import userEvent from "@testing-library/user-event";
import App from "../components/App";

describe("App component", () => {
  it("renders App", () => {
    const { container } = renderWithProviders(<App />);
    expect(container).toMatchSnapshot();
  });
  it("When user presses key, active square will show key value", () => {
    renderWithProviders(<App />);
    const qButton = document.querySelector('#q');
    const activeSquareValue = document.querySelector('.focused-letter .square-value')
    expect(activeSquareValue.textContent).toMatch('');
    userEvent.click(qButton);
    expect(activeSquareValue.textContent).toMatch('Q');
  });
});

describe("Socket io", () => {
  it("When different browser agent changes crossword, all other browser agents with same game id receive changes", () => {

  });
  it("When different browser agents within same game id change same thing, the most recent one will always persist and be the same for all instances of the game", () => {

  });
  it("When new browser agent signs into game in progress, loads current state", () => {});
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











