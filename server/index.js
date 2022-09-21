/* eslint-disable no-console */
/* eslint-disable no-underscore-dangle */
import dotenv from 'dotenv';
import Debug from 'debug';
import HttpServer from './components/HttpServer';
import DbWorker from './components/DbWorker';
import WebSocketServer from './components/WebSocketServer';

const firebaseAdmin = require('./firebase');
const AdminDatabaseListener = require('./functions/utils/AdminDatabaseListener');

try {
  const debug = Debug('Server');

  if (process.env.NODE_ENV === 'development') {
    dotenv.config({ path: '../.env.local' });
  } else if (process.env.NODE_ENV === 'heroku-local') {
    dotenv.config({ path: '../.env.heroku-local' });
  }

  const auth = firebaseAdmin.auth();
  const db = firebaseAdmin.database();
  const dbListener = new AdminDatabaseListener(db);
  const dbWorker = new DbWorker(db, auth, dbListener);

  const httpServer = new HttpServer();
  const io = new WebSocketServer(httpServer, dbWorker);
  io.initialize();

  const port = process.env.NODE_ENV === 'development'
    ? process.env.REACT_APP_DEV_SERVER_PORT : process.env.PORT;
  httpServer.listen(port);
  debug(`Server listening on port ${port}`);
} catch (error) {
  console.log(error);
}
