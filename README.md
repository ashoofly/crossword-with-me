# Tech Stack

* Modern React (v18)
  * Functional Components
  * React Router
  * MaterialUI 
* Modern Redux
  * Redux Toolkit
* Socket.io
  * WebSockets for real-time multi-player collaboration
* Firebase 
  * Authentication
    * Google Sign-in
  * Real-Time Database (NoSQL)
  * Hosting

* Jest for Tests
  * React Testing Library


# Managing State

This app uses Redux to keep track of multi-user changes in real-time, and it saves every 1 second to a back-end NoSQL database (Firebase Real-Time Database (RTD)) for persistence so games will be saved beyond browser refresh or restart. 