import React from "react";
import { onAuthStateChanged } from "firebase/auth";

export default function useAuthenticatedUser(auth) {
  const [ user, setUser ] = React.useState(null);

  React.useEffect(() => {
    if (auth) {
      onAuthStateChanged(auth, (returnedUser) => {
        if (returnedUser) {
          // User is signed in, see docs for a list of available properties
          // https://firebase.google.com/docs/reference/js/firebase.User
          console.log(returnedUser);
          setUser(returnedUser);
        } else {
          setUser(null);
        }
      });
    } else {
      console.log("auth is null");
    }
  }, [auth]);

  return user;
}