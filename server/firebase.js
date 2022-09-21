const firebaseAdmin = require('firebase-admin');

const firebaseServerConfig = JSON.parse(process.env.FIREBASE_SERVER_CONFIG);
const serviceAccount = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS);

const firebaseAppConfig = {
  ...firebaseServerConfig,
  credential: firebaseAdmin.credential.cert(serviceAccount),
};

firebaseAdmin.initializeApp(firebaseAppConfig);

module.exports = firebaseAdmin;
