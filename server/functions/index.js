/* eslint-disable object-curly-spacing */
/* eslint-disable require-jsdoc */
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const puppeteer = require("puppeteer");
const { isCurrentPuzzleSaved, setupGameBoard, cleanupOldGames } = require("./puzzleUtils");

admin.initializeApp();
const db = admin.database();

async function fetchCurrentPuzzle() {
  console.log("Scraping xwordinfo page for current puzzle...");
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto("https://www.xwordinfo.com/JSON/");
  await Promise.all([
    page.waitForNavigation(),
    page.click("[href='Data.ashx?format=text']"),
  ]);
  const element = await page.waitForSelector("body > pre");
  const value = await element.evaluate((el) => el.textContent);
  browser.close();
  return JSON.parse(value);
}

function saveNewPuzzle(puzzle) {
  const { grid, clueDictionary } = setupGameBoard(puzzle);
  console.log("Saving puzzle to Firebase database");
  const puzzleRef = db.ref(`puzzles/${puzzle.dow}`);
  puzzleRef.set({
    ...puzzle,
    gameGrid: grid,
    clueDictionary: clueDictionary,
  });
}

exports.fetchNewPuzzle = functions
    .runWith({
      memory: "512MB",
    })
    .pubsub.schedule("5 20 * * *").timeZone("America/Denver")
    .onRun(async (context) => {
      console.log("Fetching new puzzle");
      if (!(await isCurrentPuzzleSaved(db))) {
        saveNewPuzzle(await fetchCurrentPuzzle());
        cleanupOldGames(db);
      }
    });
