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

* If puzzle fetch fails, send message
* Board needs to be able to do more than 15 rows for Sunday puzzles (Boards.css)
* Clear games with last week's puzzle from database after fetching each new puzzle
* Allow anonymous players
  * Clear anonymous games from the database every night


# Study

* import vs require
* how to export modules, const, functions
* async/await vs promise.then



