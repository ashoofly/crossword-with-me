const logOnly = [
  "App",
  "Board",
  "Square"
]

export default class Logger {
  constructor(name) {
    this.name = name;
    this.logLevel = process.env.NODE_ENV === "production" ? "warn" : "log";
    this.log = (logOnly.includes(this.name) && this.logLevel === "log") ? 
      console.log.bind(window.console, `[${name}]`) : (() => {});
  }
}