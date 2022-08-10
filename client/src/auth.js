import { getAuth, signInWithRedirect, signInWithCredential, signOut, onAuthStateChanged } from "firebase/auth";
import { GoogleAuthProvider } from "firebase/auth";

const provider = new GoogleAuthProvider();
let user = null;

function handleCredentialResponse(token, auth) {
    // Build Firebase credential with the Google ID token.
  const credential = GoogleAuthProvider.credential(token);

  // Sign in with credential from the Google user.
  signInWithCredential(auth, credential).then(result => {
    const user = result.user;

  }).catch((error) => {
    // Handle Errors here.
    const errorCode = error.code;
    const errorMessage = error.message;
    // The email of the user's account used.
    const email = error.email;
    // The credential that was used.
    const credential = GoogleAuthProvider.credentialFromError(error);
    // ...
    console.log(error);
  });
}

function getUser() {
  return user;
}


function initializeAuth(app) {
  if (!app) return;
  const auth = getAuth(app);
  // if (auth) {
  //   onAuthStateChanged(auth, (returnedUser) => {
  //     if (returnedUser) {
  //       // User is signed in, see docs for a list of available properties
  //       // https://firebase.google.com/docs/reference/js/firebase.User
  //       console.log("Auth state change:");
  //       console.log(returnedUser);
  //       user = returnedUser;
  //     } 
  //   });
  // }
  return auth;
}

function signin(auth) {
  if (!auth) return;
  signInWithRedirect(auth, provider).then(result => {
    const user = result.user;
    console.log("User successfully signed in.");
    console.log(user);
  }).catch((error) => {
    console.log(error);
});
}

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
  signin,
  signout,
  handleCredentialResponse,
  getUser
};