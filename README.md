# Live Demo

https://floating-plains-76141.herokuapp.com/

# Deployments

## Local
```
cd server
npm run dev
cd ../client
npm run dev
```
Go to `localhost:3000` to see UI

## Heroku Local
```
cd client
npm run build-heroku-local
cd ..
npm run heroku-local
```
Go to `localhost:5000` to see UI

## Heroku Staging
```
git push staging master
```
Go to https://evening-inlet-23063.herokuapp.com/ to see UI

## Heroku Production
```
git push production master
```
Go to https://floating-plains-76141.herokuapp.com/ to see UI

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
* Heroku  
  * Hosting

* Jest for Tests
  * React Testing Library


# Managing State

This app uses Redux to keep track of multi-user changes in real-time, and it uses a back-end NoSQL database (Firebase Real-Time Database (RTD)) for persistence so games will be saved beyond browser refresh or restart. 

# TODO

* If puzzle fetch fails, send message
* Allow anonymous players
  * Clear anonymous games from the database every night
* Display when avatar icons exceed title bar




