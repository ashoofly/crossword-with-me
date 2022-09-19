module.exports = {
  root: true,
  env: {
    es6: true,
    node: true,
  },
  parserOptions: {
    ecmaVersion: 13,
  },
  extends: [
    'eslint:recommended',
    'eslint-config-airbnb-base',
  ],
  rules: {
    'max-len': ['error', { code: 105 }],
    'no-console': 'off',
  },
};
