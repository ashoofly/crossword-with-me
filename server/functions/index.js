/* eslint-disable require-jsdoc */
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const puppeteer = require("puppeteer");
const {ref, set, get} = require("firebase/database");

admin.initializeApp();
const db = admin.database();

const dow = ["Sunday", "Monday", "Tuesday", "Wednesday",
  "Thursday", "Friday", "Saturday"];

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
  console.log(JSON.parse(value));
  browser.close();
  return JSON.parse(value);
}

async function isCurrentPuzzleSaved() {
  const currentDate = new Date();
  console.log(currentDate);
  const currentDOW = dow[currentDate.getDay()];
  console.log(`Looking for current ${currentDOW} puzzle`);

  const snapshot = await get(ref(db, "puzzles/" + currentDOW.toLowerCase()));
  if (snapshot.exists()) {
    const fetchedPuzzle = snapshot.val();
    const fetchedPuzzleDate = new Date(Date.parse(fetchedPuzzle.date));
    if (currentDate.toDateString() === fetchedPuzzleDate.toDateString()) {
      console.log(`${currentDate.toDateString()} puzzle already downloaded.`);
      return true;
    } else {
      console.log(`Saved ${currentDOW} puzzle is for ${fetchedPuzzleDate.toDateString()}. 
      New puzzle for ${currentDOW} needed.`);
      return false;
    }
  } else {
    console.log(`No ${currentDOW} puzzle available`);
    return false;
  }
}

function saveNewPuzzle(puzzle) {
  console.log("Saving puzzle to Firebase database");
  set(ref(db, "puzzles/" + puzzle.dow.toLowerCase()), puzzle);
}

exports.fetchNewPuzzle = functions
    .runWith({
      memory: "512MB",
    })
    .pubsub.schedule("5 20 * * *").timeZone("America/Denver")
    .onRun(async (context) => {
      console.log("Fetching new puzzle");
      if (!(await isCurrentPuzzleSaved())) {
        saveNewPuzzle(await fetchCurrentPuzzle());
      }
    });


