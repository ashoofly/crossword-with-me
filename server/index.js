// const dotenv = require('dotenv';
const Debug = require('debug');
const ExpressServer = require('./components/ExpressServer.js');
const DbWorker = require('./components/DbWorker.js');
const WebSocketServer = require('./components/WebSocketServer.js');
const firebaseAdmin = require('./firebase.js');
const AdminDatabaseListener = require('./functions/utils/AdminDatabaseListener.js');

try {
  const debug = Debug('Server');
  const auth = firebaseAdmin.auth();
  const db = firebaseAdmin.database();
  const dbListener = new AdminDatabaseListener(db);
  const dbWorker = new DbWorker(db, auth, dbListener);

  const expressServer = new ExpressServer();
  const io = new WebSocketServer(expressServer.httpServer, dbWorker);
  io.initialize();

  const port = process.env.NODE_ENV === 'development'
    ? process.env.REACT_APP_DEV_SERVER_PORT : process.env.PORT;
  expressServer.httpServer.listen(port);
  debug(`Server listening on port ${port}`);
} catch (error) {
  console.log(error);
}
