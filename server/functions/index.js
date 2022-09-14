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

async function saveNewPuzzle(puzzle) {
  try {
    const { grid, clueDictionary } = setupGameBoard(puzzle);
    console.log("Saving puzzle to Firebase database");
    const puzzleRef = db.ref(`puzzles/${puzzle.dow}`);
    await puzzleRef.set({
      ...puzzle,
      gameGrid: grid,
      clueDictionary: clueDictionary,
    });
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
}

exports.fetchNewPuzzle = functions
    .runWith({
      memory: "512MB",
    })
    .pubsub.schedule("5 20 * * *").timeZone("America/Denver")
    .onRun(async (context) => {
      console.log("Fetching new puzzle");
      if (!(await isCurrentPuzzleSaved(db))) {
        const saved = await saveNewPuzzle(await fetchCurrentPuzzle());
        if (saved) {
          console.log("Cleaning up old games..");
          cleanupOldGames(db);
        } else {
          console.log("Error saving new puzzle, so not cleaning up old games.");
        }
      }
    });
