import React from "react";
import '../styles/common.css';
import "../styles/Square.css";
import { useSelector } from 'react-redux';


export default function Square(props) {

  const { 
    id,
    isPlayableSquare,
    autocheck,
    goToNextSquareAfterInput, 
    squareRef, 
    gridNum, 
    answer, 
    handleFocus, 
    handleMouseDown, 
    userInput, 
    handleKeyDown,
    markSquare,
    classNames,
    squareMarked,
    checkRequest,
    focused,
    rebusActive,
    resetRebus,
    zoomActive,
    handleRerender,
    socket
   } = props;


   const reduxSquareState = useSelector(state => {
    return state.square[id]
   });


  function displaySquare() {
    if (!isPlayableSquare) return;
    if (squareMarked.revealed) {
      setSquareText(answer);
    } else {    
      setSquareText(reduxSquareState.input);
    }
  }

  let [squareText, setSquareText] = React.useState('');
  let [squareValueClasses, setSquareValueClasses] = React.useState(["square-value"]);
  let [squareRootClasses, setSquareRootClasses] = React.useState(classNames);

  React.useEffect(displaySquare, [userInput, squareMarked]);
  React.useEffect(goToNextSquareAfterInput, [userInput, rebusActive]);
  React.useEffect(checkAnswer, [autocheck, userInput, checkRequest]);
  React.useEffect(markCheckedSquare, [userInput, autocheck, squareMarked]);

//TODO: Currently infinite loop
  // React.useEffect(() => {
  //   if (socket === null) return;
  //   const handler = (state) => {
  //     console.log(state);
  //     if (state.id === id) {
  //       console.log("Found ID");
  //       setSquareText(state.input); 
  //     }
  //   }
  //   socket.on("receive-changes", handler);

  //   return () => {
  //     socket.off("receive-changes", handler)
  //   }
    
  // }, []);

  React.useEffect(() => {
    if (socket === null) return;
    socket.emit("send-changes", reduxSquareState);

  }, [reduxSquareState]);



  function markCheckedSquare() {
    setSquareValueClasses( prevState => {
      if (squareMarked.verified) {
        if (!prevState.includes("verified-overlay")) {
          return [...prevState, "verified-overlay"];
        }
      } else {
        if (prevState.includes("verified-overlay")) {
          return prevState.filter( cn => cn !== "verified-overlay");
        }
      } 
      if (squareMarked.penciled) {
        if (!prevState.includes("penciled-overlay")) {
          return [...prevState, "penciled-overlay"];
        }
      } else {
        if (prevState.includes("penciled-overlay")) {
          return prevState.filter( cn => cn !== "penciled-overlay");
        }
      }         
      return prevState;
    })
  };


  function checkAnswer() {
    if (shouldCheckAnswer()) {
      if (verifyLetter()) {
        markSquare(id, verifyLetter());
      }
    }
  }

  function shouldCheckAnswer() {
    return autocheck || checkRequest;
  }


  function verifyLetter() {
    if (!isPlayableSquare || userInput === '') return;
    if (userInput === answer) {
      return "verified";

    } else if (answer.length > 1) {
      // rebus
      if (userInput.length >= 1 && userInput.charAt(0) === answer.charAt(0)) {
        return "partial";
      } else {
        return "incorrect";
      }
    } else {
      return "incorrect";
    }
  }

  function log() {
    console.log(`Index: ${id}. Check request: ${checkRequest}`);
    console.log(squareMarked);
  }

  function updateClassNames(originalClassNames, conditional, className) {
    if (conditional) {
      if (!originalClassNames.includes(className)) {
        return [...originalClassNames, className];
      } else {
        return originalClassNames;
      }
    } else {
      return originalClassNames.filter (cn => cn !== className);
    }
  }

  React.useEffect(() => {
    setSquareRootClasses(() => {
      let revealedStatus = updateClassNames(classNames, squareMarked.revealed, "revealed-overlay");
      let rebusStatus = updateClassNames(revealedStatus, focused && rebusActive, "rebus-square");
      let zoomStatus = updateClassNames(rebusStatus, zoomActive, "zoomed");
      let finalClassNames = zoomStatus;
      return finalClassNames;
    });
  }, [squareMarked, classNames, rebusActive, focused, zoomActive]);

  React.useEffect(() => {
    if (zoomActive) {
        handleRerender();
    }
  }, [zoomActive, squareRootClasses]);

  return (
    <div 
        id={id}
        tabIndex="0"
        ref={squareRef} 
        onKeyDown={handleKeyDown} 
        onFocus={handleFocus}
        onMouseDown={handleMouseDown} 
        className={squareRootClasses.join(" ")} 
        onClick={log}
        // onBlur={resetRebus}
    >
      {(squareMarked.incorrect || (shouldCheckAnswer() && verifyLetter() === "incorrect")) && <div className="wrong-answer-overlay"></div>}
      {(squareMarked.partial || (shouldCheckAnswer() && verifyLetter() === "partial")) && <div className="partially-correct-overlay"></div>}

      <div className="square-gridnum">{gridNum !== 0 && gridNum}</div>
      {isPlayableSquare && squareMarked.revealed && <div className="revealed-marker"></div>}
      <div className={squareValueClasses.join(' ')}>{squareText}</div>
    </div>
  )
} 