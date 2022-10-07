import { 
  getAuth, 
  signInWithCredential, 
  signOut, 
  GoogleAuthProvider 
} from "firebase/auth";
import Logger from "../common/Logger.js";

let auth = null;
let user = null;
const logger = new Logger("Auth");

function handleCredentialResponse(googleToken, auth, socket) {
    // Build Firebase credential with the Google ID token.
  const credential = GoogleAuthProvider.credential(googleToken);

  // Sign in with credential from the Google user.
  signInWithCredential(auth, credential).then(result => {
    user = result.user;
    // Send Firebase token to server so player can be added to database if needed
    auth.currentUser.getIdToken(true).then(function(firebaseToken) {
      socket.emit('user-signed-in', firebaseToken);

    }).catch(function(error) {
      // Handle error
      console.log(error);
    });

  }).catch((error) => {
    console.log(error);
  });
}

function getUser() {
  return user;
}


function initializeAuth(app) {
  if (!app) return;
  auth = getAuth(app);
  return auth;
}

// Doesn't work for Chrome Incognito browsers, so had to switch to manual Google Identity Platform 
// function signin(auth) {
//   if (!auth) return;
//   signInWithRedirect(auth, provider).then(result => {
//     const user = result.user;
//     console.log("User successfully signed in.");
//     console.log(user);
//   }).catch((error) => {
//     console.log(error);
// });
// }

function signout(auth) {
  if (!auth) return;
  signOut(auth).then(() => {
    console.log("User successfully signed out.");
  }).catch((error) => {
    console.log(error);
  });
}

export {
  initializeAuth,
  signout,
  handleCredentialResponse,
  getUser,
};
