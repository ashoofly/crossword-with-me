const dotenv = require('dotenv');
const firebaseAdmin = require('firebase-admin');

if (process.env.NODE_ENV === 'development') {
  dotenv.config({ path: '../.env.local' });
} else if (process.env.NODE_ENV === 'heroku-local') {
  dotenv.config({ path: '../.env.heroku-local' });
}

const firebaseServerConfig = JSON.parse(process.env.FIREBASE_SERVER_CONFIG);
const serviceAccount = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS);

const firebaseAppConfig = {
  ...firebaseServerConfig,
  credential: firebaseAdmin.credential.cert(serviceAccount),
};

module.exports = firebaseAppConfig;
