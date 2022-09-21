/* eslint-disable no-underscore-dangle */
import admin from 'firebase-admin';
import dotenv from 'dotenv';
import Debug from 'debug';
import HttpServer from './components/HttpServer';
import DbWorker from './components/DbWorker';
import WebSocketServer from './components/WebSocketServer';

const AdminDatabaseListener = require('./functions/utils/AdminDatabaseListener');

const debug = Debug('Server');

if (process.env.NODE_ENV === 'development') {
  dotenv.config({ path: '../.env.local' });
} else if (process.env.NODE_ENV === 'heroku-local') {
  dotenv.config({ path: '../.env.heroku-local' });
}
const firebaseServerConfig = JSON.parse(process.env.FIREBASE_SERVER_CONFIG);
const serviceAccount = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS);

const firebaseAppConfig = {
  ...firebaseServerConfig,
  credential: admin.credential.cert(serviceAccount),
};

const firebaseApp = admin.initializeApp(firebaseAppConfig);
const auth = admin.auth(firebaseApp);
const db = admin.database(firebaseApp);
const dbListener = new AdminDatabaseListener(db);
const dbWorker = new DbWorker(db, auth, dbListener);

const httpServer = new HttpServer();
const io = new WebSocketServer(httpServer, dbWorker);
io.initialize();

const port = process.env.NODE_ENV === 'development'
  ? process.env.REACT_APP_DEV_SERVER_PORT : process.env.PORT;
httpServer.listen(port);
debug(`Server listening on port ${port}`);
