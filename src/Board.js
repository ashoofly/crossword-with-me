import React from "react";
import Square from "./Square";
import data from "./data/xwordinfo.json";
export default function Board() {

  const orientations = [
    "across",
    "down"
  ]

  const defaultOrientation = orientations[0];

  const answers = data.grid;
  const gridNums = data.gridnums;
  let acrossDictionary = {};
  let downDictionary = {};

  function parseData() {
    const clueStartNum = /(^\d+)\./;
    const acrossAnswers = data.answers.across;
    const downAnswers = data.answers.down;


    data.clues.across.forEach((clue, index) => {
      const m = clueStartNum.exec(clue);
      const key = m[1];
      acrossDictionary[key] = {
        clue: clue,
        answer: acrossAnswers[index]
      }
    });

    data.clues.down.forEach((clue, index) => {
      const m = clueStartNum.exec(clue);
      const key = m[1];
      downDictionary[key] = {
        clue: clue,
        answer: downAnswers[index]
      }
    });

    console.log(acrossDictionary);
    console.log(downDictionary);
  }

  parseData();



  function addClassList(value, index) {
    let tabIndex = -1;
    let classes = ["square"];
    // mark out block squares not in play
    if (value === '.') {
      classes.push("block");
    }
    // mark word starts for across so we can easily tab to this square
    if (value !== '.' && (index % 15 === 0 || answers[index-1] === '.')) {
      classes.push("ws-across");
      tabIndex = 0; 
    } 
    // mark word starts for down so we can easily tab to this square
    if (value !== '.' && (index < 15 || answers[index-15] === '.')) {
      classes.push("ws-down");
      // if (tabIndex === -1) {
      //   tabIndex = ++runningTabIndex; 
      // }
    } 
    return [classes.join(' '), tabIndex];
  }

  function handleFocus(index) {
    console.log(`Omg I'm in focus!! Index: ${index}`);
  }

  const squares = answers
                    .map((value, index)=> {

                      const [classList, tabIndex] = addClassList(value, index);
                      return (
                        <Square classNames={classList}
                                tabIndex={tabIndex}
                                key={index} 
                                index={index}
                                gridNum={gridNums[index]}
                                grid={answers}
                                value={value}
                                handleFocus={() => handleFocus(index)} />
                      )
                    });

  return (
    <div className="Board">
      {squares}
    </div>
  )
}