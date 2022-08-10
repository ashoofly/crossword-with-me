import React from "react";
import { onAuthStateChanged } from "firebase/auth";

export default function useAuthenticatedUser(auth) {
  const [ user, setUser ] = React.useState(auth.currentUser);
  const [initialized, setInitialized ] = React.useState(false);

  React.useEffect(() => {
    if (auth) {
      onAuthStateChanged(auth, (returnedUser) => {
        if (!initialized) {
          setInitialized(true);
        }
        if (returnedUser) {
          // User is signed in, see docs for a list of available properties
          // https://firebase.google.com/docs/reference/js/firebase.User
          setUser(returnedUser);
        } else {
          setUser(null);
        }
      });
    } 
  }, [auth]);

  // return user;
  return [user, initialized];
}