import { getAuth, signInWithRedirect, signOut } from "firebase/auth";
import { GoogleAuthProvider } from "firebase/auth";

const provider = new GoogleAuthProvider();

function initializeAuth(app) {
  if (!app) return;
  const auth = getAuth(app);
  console.log("Set up Firebase authentication");
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
  signout
};