import {
  getAuth,
  signInWithCredential,
  signOut,
  GoogleAuthProvider,
} from 'firebase/auth';
import Logger from '../common/Logger';

const logger = new Logger('Auth');

function handleCredentialResponse(googleToken, auth, socket) {
  // Build Firebase credential with the Google ID token.
  const credential = GoogleAuthProvider.credential(googleToken);

  // Sign in with credential from the Google user.
  signInWithCredential(auth, credential).then(() => {
    // Send Firebase token to server so player can be added to database if needed
    auth.currentUser.getIdToken(true).then(firebaseToken => {
      socket.emit('user-signed-in', firebaseToken);
    }).catch(error => {
      // Handle error
      logger.log(error);
    });
  }).catch(error => {
    logger.log(error);
  });
}

function initializeAuth(app) {
  if (!app) return;
  const auth = getAuth(app);
  return auth;
}

// Doesn't work for Chrome Incognito browsers, so had to switch to manual Google Identity Platform
// function signin(auth) {
//   if (!auth) return;
//   signInWithRedirect(auth, provider).then(result => {
//     const user = result.user;
//     logger.log("User successfully signed in.");
//     logger.log(user);
//   }).catch((error) => {
//     logger.log(error);
// });
// }

function signout(auth) {
  if (!auth) return;
  signOut(auth).then(() => {
    logger.log('User successfully signed out.');
  }).catch(error => {
    logger.log(error);
  });
}

export {
  initializeAuth,
  signout,
  handleCredentialResponse,
};
