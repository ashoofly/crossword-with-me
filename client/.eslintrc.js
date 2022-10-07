module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  extends: [
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:react-redux/recommended',
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
    'react-redux',
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
    'no-param-reassign': ['error', { props: false }],
    'react-redux/useSelector-prefer-selectors': 'off',
    'one-var': 'off',
    'one-var-declaration-per-line': 'off',
    'consistent-return': 'off',
  },
};
