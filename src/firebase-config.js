const config = {
  apiKey: "AIzaSyBovVyThtKoW2jOEyu-P6XroX8QaSj49_s",
  authDomain: "crossword-with-friends.firebaseapp.com",
  projectId: "crossword-with-friends",
  storageBucket: "crossword-with-friends.appspot.com",
  messagingSenderId: "1007347895275",
  appId: "1:1007347895275:web:9524816a1d160cc7ede7ae",
  measurementId: "G-R1N654J64C"
};

export function getFirebaseConfig() {
  if (!config || !config.apiKey) {
    throw new Error('No Firebase configuration object provided.' + '\n' +
    'Add your web app\'s configuration object to firebase-config.js');
  } else {
    return config;
  }
}