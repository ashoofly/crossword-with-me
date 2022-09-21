/* eslint-disable no-undef */
const { test } = require('@jest/globals');
const admin = require('firebase-admin');
// jest.mock('firebase-admin');
// const admin = require('firebase-admin');
const AdminDatabaseListener = require('../functions/utils/AdminDatabaseListener');
const DbWorker = require('./DbWorker');
const mockPuzzle = require('../tests/mockPuzzle');
const mockPlayer = require('../tests/mockPlayer');
const mockGame = require('../tests/mockGame');

jest.mock('../functions/utils/AdminDatabaseListener');

// admin.initializeApp.mockResolvedValue(jest.fn());
// admin.auth.mockResolvedValue(jest.fn());
// admin.database.mockResolvedValue(jest.fn());
// let db;
// let auth;
// eslint-disable-next-line one-var, one-var-declaration-per-line
let mockDbListener, dbWorker, db;

beforeEach(() => {
  // const app = admin.initializeApp();
  // auth = admin.auth(app);
  // db = admin.database(app);
  db = jest.fn();
  mockDbListener = new AdminDatabaseListener();
  dbWorker = new DbWorker(db, jest.fn(), mockDbListener);
});

test('If game exists in database, DbWorker returns game', async () => {
  mockDbListener.getDbObjectByIdOnce.mockResolvedValue(Promise.resolve({ gameId: 1234 }));
  expect(await dbWorker.getGameById('1234')).toStrictEqual({ gameId: 1234 });
});

test('If game is not found in db, DbWorker returns null', async () => {
  mockDbListener.getDbObjectByIdOnce.mockResolvedValue(Promise.resolve(null));
  expect(await dbWorker.getGameById('456')).toStrictEqual(null);
});

test('Dbworker returns game if current', async () => {
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

test('Dbworker returns null if game not current', async () => {
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

test('Dbworker saves new game at new db ref', async () => {
  // eslint-disable-next-line no-unused-vars
  mockDbListener.getDbObjectByIdOnce.mockImplementation((collection, id) => {
    if (collection === 'puzzles') {
      return Promise.resolve(mockPuzzle);
    }
    if (collection === 'player') {
      return Promise.resolve(mockPlayer);
    }
    return Promise.resolve(null);
  });
  const mockRef = jest.spyOn(admin.Database.prototype, 'ref');
  const mockRefSetSpy = jest.spyOn(admin.database.Reference.prototype, 'set');
  await dbWorker.createNewGame('Tuesday', 'abc123');
  expect(mockRefSetSpy).toHaveBeenCalledWith(mockGame);
});
