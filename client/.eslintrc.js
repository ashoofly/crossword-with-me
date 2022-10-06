module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  extends: [
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'airbnb',
  ],
  overrides: [
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: [
    'react',
    'react-hooks',
  ],
  rules: {
    'object-curly-newline': 'off',
    'arrow-parens': ['error', 'as-needed'],
    'no-else-return': 'off',
    'no-lonely-if': 'off',
    'comma-dangle': ['error', {
      functions: 'never',
      objects: 'always-multiline',
      arrays: 'always-multiline',
      imports: 'always-multiline',
      exports: 'always-multiline',
    }],
    'no-underscore-dangle': 'off',
  },
};
