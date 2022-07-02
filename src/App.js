import React from "react";
import Navbar from './Navbar';
import Board from './Board';
import Clue from './Clue';
import Keyboard from './Keyboard';
import './styles.css';
import data from "./data/wednesday.json";



function App() {
  const numRows = data.size.rows;
  const numCols = data.size.cols;
  const answers = data.grid;
  const gridNums = data.gridnums;
  const clues = data.clues;

  const [ orientation, setOrientation ] = React.useState("across");
  const [ showAnswers, setShowAnswers ] = React.useState(false);
  const [ squareProps, setSquareProps ] = React.useState(initializeState());
  const [ activeWord, setActiveWord ] = React.useState({
    focus: 0,
    start: 0,
    end: 0
  });

  /**
   * Methods for child components to use to toggle state
   */
  function toggleOrientation() {
    setOrientation( prevState => prevState === "across" ? "down" : "across");
  }

  function toggleAnswers() {
    setShowAnswers( prevState => !prevState );
  }


  /**
   * Sets up state for each square:
   * - marks word starts to facilitate board navigation
   * - populates answer value
   * - populates grid reference number 
   * @returns 
   */
  function initializeState() {

    let initialSquareProps = Array(numRows * numCols);
    answers.forEach((answer, index) => {
      let classes = ["square"];
      // mark out block squares not in play
      if (answer === '.') {
        classes.push("block");
      }
      // mark word starts for across so we can easily tab to this square
      if (answer !== '.' && (index % numCols === 0 || answers[index-1] === '.')) {
        classes.push("ws-across");
      } 
      // mark word starts for down so we can easily tab to this square
      if (answer !== '.' && (index < numCols || answers[index-numCols] === '.')) {
        classes.push("ws-down");
      } 

      let ref = React.createRef();
      initialSquareProps[index] = {
        id: index,
        classNames: classes,
        gridNum: gridNums[index],
        answer: answers[index],
        userInput: "",
        squareRef: ref
      };
    });
    return initialSquareProps;
  }


  return (
    <div className="App">
      <Navbar toggleAnswers={toggleAnswers} />
      <Board numCols={numCols}
             numRows={numRows}
             gridNums={gridNums}
             orientation={orientation}
             toggleOrientation={toggleOrientation}
             squareProps={squareProps}
             setSquareProps={setSquareProps}
             answers={answers}
             showAnswers={showAnswers}
             activeWord={activeWord}
             setActiveWord={setActiveWord}
             />
      <Clue 
             clues={clues}
             answers={answers}
             gridNums={gridNums}
             toggleOrientation={toggleOrientation}
             orientation={orientation}
             activeWord={activeWord} />
      <Keyboard />
    </div>
  );
}

export default App;
