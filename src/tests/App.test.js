/* eslint-disable testing-library/no-node-access */
import React from "react";
import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../components/App";

describe("App component", () => {
  // TODO: Need to wrap provider for Redux: https://redux.js.org/usage/writing-tests
  it("renders App", () => {
    const { container } = render(<App />);
    expect(container).toMatchSnapshot();
  })
  it("When user presses key, active square will show key value", () => {
    render(<App />);
    const qButton = document.querySelector('#q');
    const activeSquareValue = document.querySelector('.focused-letter .square-value')
    expect(activeSquareValue.textContent).toMatch('');
    userEvent.click(qButton);
    expect(activeSquareValue.textContent).toMatch('Q');
  });
  // TODO: Why is socket.io infinite looping on receive? 
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











