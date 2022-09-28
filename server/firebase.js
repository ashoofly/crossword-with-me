/**
 * This module mainly exists so that we can mock it in unit tests.
 */
const firebaseAdmin = require('firebase-admin');
const firebaseAppConfig = require('./firebaseConfig');

firebaseAdmin.initializeApp(firebaseAppConfig);

module.exports = firebaseAdmin;
