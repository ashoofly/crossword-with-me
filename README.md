# Tech Stack

* Modern React (v18)
  * Functional Components & Hooks
  * React Router
  * MaterialUI 
* Modern Redux
  * Redux Toolkit
* Socket.io
  * WebSockets for real-time multi-player collaboration
* Firebase 
  * Authentication (Google sign-in)
  * Real-Time Database (NoSQL)
  * Scheduled Cloud Functions (to pull daily puzzle)
  * Hosting

* Jest for Tests
  * React Testing Library


# Managing State

This app uses Redux to keep track of multi-user changes in real-time, and it uses a back-end NoSQL database (Firebase Real-Time Database (RTD)) for persistence so games will be saved beyond browser refresh or restart. 

# TODO

* If fetch fails, send message
* Board needs to be able to do more than 15 rows for Sunday puzzles (Boards.css)


# Study

* import vs require
* how to export modules, const, functions
* async/await vs promise.then


# Socket notes

When making changes, mapped to redux actions:

Check source: socket.id

scope: game, action: reset
scope: game, action: toggleAutocheck
- resetGame
- toggleAutocheck


scope: square, squareState: overwrite
scope: word, wordState: overwrite
scope: board, boardState: overwrite
- changeInput
- requestCheckSquare
- requestCheckWord
- requestCheckPuzzle
- requestRevealSquare
- requestRevealWord
- requestRevealPuzzle

