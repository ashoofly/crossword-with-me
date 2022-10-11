/* eslint-disable no-console */
const logOnly = [
  // 'Render',
  'Socket',
  'Focus',
  'Error',
  'Auth',
  'Index',
  'Debug',
  // 'App',
  // 'Board',
  // 'Clue',
  // 'GameMenu',
  // 'HintMenu',
  // 'InfoPage',
  // 'Keyboard',
  // 'Navbar',
  // 'PlayerBox',
  // 'SignIn',
  // 'Square',
  // 'TitleBar',
];

export default class Logger {
  constructor(name) {
    this.name = name;
    this.logLevel = process.env.NODE_ENV === 'production' ? 'warn' : 'log';
    this.log = (logOnly.includes(this.name) && this.logLevel === 'log')
      ? console.log.bind(window.console, `[${name}]`) : (() => {});
  }
}
