module.exports = {
  "root": true,
  "env": {
    es6: true,
    node: true,
  },
  "parserOptions": {
    "ecmaVersion": 9,
  },
  "extends": [
    "eslint:recommended",
    "google",
  ],
  "rules": {
    "quotes": ["error", "double"],
    "max-len": ["error", {"code": 105}],
  },
};
