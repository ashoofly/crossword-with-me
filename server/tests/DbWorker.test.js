/* eslint-disable no-underscore-dangle */
/* eslint-disable arrow-body-style */
/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
// const { test, jest } = require('@jest/globals');
// const admin = require('firebase-admin');
const { test, expect } = require('@jest/globals');
const AdminDatabaseListener = require('../functions/utils/AdminDatabaseListener');
const DbWorker = require('../components/DbWorker');
const mockPuzzle = require('./mocks/mockPuzzle');
const { newPlayer, onlyTeamPlayer, ownsMondayGamePlayer } = require('./mocks/mockPlayer');
const mockGame = require('./mocks/mockGame');
const firebaseAdmin = require('../firebase');

jest.mock('../functions/utils/AdminDatabaseListener');
jest.mock('../firebase', () => {
  const set = jest.fn();
  const update = jest.fn();

  return {
    database: jest.fn(() => ({
      ref: jest.fn(() => ({
        set,
        update,
      })),
    })),
  };
});

// eslint-disable-next-line one-var, one-var-declaration-per-line
let mockDbListener, dbWorker, db;
const mockGameId = 'e27dd721-a9fd-4f95-97ae-b4bfa939e7df';

function setListenerToReturnMockDbObjects() {
  mockDbListener.getDbObjectByIdOnce.mockImplementation((collection, id) => {
    if (collection === 'puzzles' && id === 'Friday') {
      return Promise.resolve(mockPuzzle);
    }
    if (collection === 'players' && id === 'abc123') {
      return Promise.resolve(newPlayer);
    }
    if (collection === 'games' ** id === mockGameId) {
      return Promise.resolve(mockGame);
    }
    return Promise.resolve(null);
  });
}

beforeEach(() => {
  db = firebaseAdmin.database();
  mockDbListener = new AdminDatabaseListener();
  dbWorker = new DbWorker(db, jest.fn(), mockDbListener);
});

test('[getGameById] If game exists in database, DbWorker returns game', async () => {
  mockDbListener.getDbObjectByIdOnce.mockResolvedValue(Promise.resolve({ gameId: 1234 }));
  expect(await dbWorker.getGameById('1234')).toStrictEqual({ gameId: 1234 });
});

test('[getGameById] If game is not found in db, DbWorker returns null', async () => {
  mockDbListener.getDbObjectByIdOnce.mockResolvedValue(Promise.resolve(null));
  expect(await dbWorker.getGameById('456')).toStrictEqual(null);
});

test('[getGameIfCurrent] Dbworker returns game if current', async () => {
  mockDbListener.getDbObjectByIdOnce.mockImplementation((collection, id) => {
    if (collection === 'puzzles') {
      return Promise.resolve({ dow: id, date: '09/20/2022' });
    }
    if (collection === 'games') {
      return Promise.resolve({ gameId: id, date: '09/20/2022' });
    }
    return Promise.resolve(null);
  });
  expect(await dbWorker.getGameIfCurrent('789', 'Tuesday'))
    .toStrictEqual({ gameId: '789', date: '09/20/2022' });
});

test('[getGameIfCurrent] Dbworker returns null if game not current', async () => {
  mockDbListener.getDbObjectByIdOnce.mockImplementation((collection, id) => {
    if (collection === 'puzzles') {
      return Promise.resolve({ dow: id, date: '09/20/2022' });
    }
    if (collection === 'games') {
      return Promise.resolve({ gameId: id, date: '09/13/2022' });
    }
    return Promise.resolve(null);
  });
  expect(await dbWorker.getGameIfCurrent('789', 'Tuesday'))
    .toStrictEqual(null);
});

test('[createNewGame] Dbworker saves new game at new db ref', async () => {
  setListenerToReturnMockDbObjects();
  await dbWorker.createNewGame(mockGameId, 'Friday', 'abc123');
  expect(db.ref).toHaveBeenCalledWith(`games/${mockGameId}`);
  expect(db.ref(`games/${mockGameId}`).set).toHaveBeenCalledWith(mockGame);
});

test('[__createGameAndUpdatePlayer] Dbworker adds game to player object '
      + 'after creating player\'s game', async () => {
  const createNewGameMock = jest.spyOn(DbWorker.prototype, 'createNewGame')
    .mockImplementation(() => mockGame);
  await dbWorker.__createGameAndUpdatePlayer(newPlayer, 'Friday');
  expect(createNewGameMock).toHaveBeenCalledWith(expect.any(String), 'Friday', 'abc123');
  expect(db.ref).toHaveBeenCalledWith('players/abc123');
  expect(db.ref('players/abc123').update).toHaveBeenCalledWith({
    games: {
      owner: {
        Friday: mockGameId,
      },
    },
  });
});

test('[__createGameAndUpdatePlayer] Dbworker throws error '
     + 'if we can\'t find newly created game', async () => {
  jest.spyOn(DbWorker.prototype, 'createNewGame').mockImplementation(() => null);
  expect.assertions(1);
  try {
    await dbWorker.createGameAndUpdatePlayer(newPlayer, 'Friday');
  } catch (e) {
    expect(e.message).toMatch(/Will not add game to player/);
  }
});

test('[findOrCreateGame] If player does not have any games when fetching game'
   + ' by day-of-the-week, we create one', () => {

});

test('[findOrCreateGame] If player only has team games when fetching own game by day-of-the-week,'
   + ' we create game for player', () => {

});

test('[findOrCreateGame] If player owns game for different dow but not specific one,'
   + ' create new game', () => {

});

test('[findOrCreateGame] If player already has current game for day-of-the-week,'
   + ' return existing game', () => {

});

test('[findOrCreateGame] If player has game for dow, but it is not current,'
   + ' create new game to replace old one', () => {

});

test('[findOrCreateGame] If player ID not found in db when searching for game by dow,'
   + ' throw Error', () => {

});

test('[getDefaultGame] If current puzzle is saved, return game for today\'s date', () => {

});

test('[getDefaultGame] If current puzzle is not saved, return game for yesterday\'s date', () => {

});

test('[getDefaultGame] If player not found in DB, throw error', () => {

});