# Live Demo

https://crosswordwith.me

# Screenshots 

#### Views
<table>
 <tr>
  <th>Mobile</th>
  <th>Tablet</th>
  <th>Desktop</th>
  <th>Multiplayer</th>
 </tr>
 <tr>
  <td><img alt="mobile-view" src="./images/mobile.jpeg" width="300"></td>
  <td><img alt="tablet-view" src="./images/tablet.png" width="400"></td>
  <td><img alt="desktop-view" src="./images/desktop.png" width="400"></td>
  <td><img alt="multiplayer-view" src="./images/multiplayer.png" width="400"></td>
 </tr>
  <tr>
 </tr>
</table>

# Architecture
<img alt="crossword-software-architecture-diagram" src="./images/crossword-architecture.png" width="800">

# Tech Stack

* Responsive Design
  * Flexbox & CSS Grid
  * Mobile-first media queries
* Modern React (v18)
  * Functional Components & Hooks
  * React Router
  * MaterialUI 
* Modern Redux
  * Redux Toolkit
* WebSockets
  * socket.io for real-time multi-player collaboration
* Server
  * node.js + Express
* Authentication
  * Google Identity Services + Firebase
* NoSQL Database
  * Firebase Real-Time Database
* Serverless Functions
  * Firebase Scheduled Cloud Functions (to pull and save daily puzzle)
* Heroku  
  * Hosting
  * Staging & Production environments
* DNS
  * Google Domains CNAME and forwarding

## Development Tools
* Create React App
* Chrome React / Redux DevTools
* nodemon
* Firebase Emulator Suite

## Build / Code Quality Tools
* Webpack
* ESLint
* Jest for Tests
  * server-side complete
  * client-side TO DO
  
# To Do 
* Accessibility
  * When tabbing to different word, screen reader reads out number & orientation (e.g., "13 across"), clue, and number of letters
  * If there are already filled in letters, read them aloud (e.g., A B _ D _ ). 
  * Different behavior - no automatic skipping filled in letters. User manually moves within word with arrow keys.
  * Say which square you are on - e.g., "third square"
* If puzzle fetch fails, send message to me
  * Other monitoring
* Alert player when puzzle complete and correct
  * Streaks, scores
* Client-side tests
* Set up test database for test environment
* Allow anonymous players
  * Clear anonymous games from the database every night
* Chat Functionality
  * To discuss game, etc. 
* Display when avatar icons exceed title bar
  * Allow custom colors







