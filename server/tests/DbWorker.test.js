/* eslint-disable arrow-body-style */
// const admin = require('firebase-admin');
const AdminDatabaseListener = require('../functions/utils/AdminDatabaseListener');
const DbWorker = require('../components/DbWorker');
const mockPuzzle = require('./mocks/mockPuzzle');
const { newPlayer, addedPlayer, onlyTeamPlayer, ownsMondayGamePlayer, ownsFridayGamePlayer, playerNoGames, playerDifTeamGame } = require('./mocks/mockPlayer');
const mockGame = require('./mocks/mockGame');
const mockGamePlayers = require('./mocks/mockGamePlayers');
const mockPlayerFocus = require('./mocks/mockPlayerFocus');
const mockPuzzles = require('./mocks/mockPuzzles');
const mockMultiplayerGame = require('./mocks/mockMultiplayerGame');
const firebaseAdmin = require('../firebase');
const PuzzleUtils = require('../functions/utils/PuzzleUtils');
const { expect, describe, test } = require('@jest/globals');

jest.mock('../functions/utils/AdminDatabaseListener');
jest.mock('../firebase', () => {
  const set = jest.fn();
  const update = jest.fn();
  const verifyIdToken = jest.fn();
  const getUser = jest.fn();

  return {
    database: jest.fn(() => ({
      ref: jest.fn(() => ({
        set,
        update,
      })),
    })),
    auth: jest.fn(() => ({
      verifyIdToken,
      getUser,
    })),
  };
});

describe('database worker functionality', () => {
  let mockDbListener, dbWorker, db, auth;

  function setListenerToReturnMockDbObjects() {
    mockDbListener.getDbObjectByIdOnce.mockImplementation((collection, id) => {
      if (collection === 'puzzles' && id === mockPuzzle.dow) {
        return Promise.resolve(mockPuzzle);
      }
      if (collection === 'players' && id === newPlayer.id) {
        return Promise.resolve(newPlayer);
      }
      if (collection === 'games' ** id === mockGame.gameId) {
        return Promise.resolve(mockGame);
      }
      return Promise.resolve(null);
    });
  }

  beforeEach(() => {
    db = firebaseAdmin.database();
    auth = firebaseAdmin.auth();
    mockDbListener = new AdminDatabaseListener();
    setListenerToReturnMockDbObjects();
    dbWorker = new DbWorker(db, auth, mockDbListener);
  });

  afterEach(() => {
    jest.clearAllMocks().restoreAllMocks();
  });

  describe('getXbyId', () => {
    test('If game exists in database, DbWorker returns game', async () => {
      mockDbListener.getDbObjectByIdOnce.mockResolvedValue(Promise.resolve({ gameId: 1234 }));
      expect(await dbWorker.getGameById('1234')).toStrictEqual({ gameId: 1234 });
    });

    test('If game is not found in db, DbWorker returns null', async () => {
      mockDbListener.getDbObjectByIdOnce.mockResolvedValue(Promise.resolve(null));
      expect(await dbWorker.getGameById('456')).toStrictEqual(null);
    });
  });

  describe('getGameByDow', () => {
    let createGameSpy;

    beforeEach(() => {
      createGameSpy = jest.spyOn(dbWorker, '__createGameAndUpdatePlayer').mockImplementation(() => {});
    });

    test('If playerId not found in db, throw error', async () => {
      expect.assertions(1);
      jest.spyOn(dbWorker, 'getPlayerById').mockImplementation(() => null);
      try {
        await dbWorker.getGameByDow(mockPuzzle.dow, 'nonExistentPlayerId');
      } catch (e) {
        expect(e).toStrictEqual(new Error('Cannot find player nonExistentPlayerId in database'));
      }
    });
    test('If player does not own any games, create new game and return', async () => {
      jest.spyOn(dbWorker, 'getPlayerById').mockImplementation(() => onlyTeamPlayer);
      await dbWorker.getGameByDow(mockPuzzle.dow, onlyTeamPlayer.id);
      expect(createGameSpy).toHaveBeenCalledWith(onlyTeamPlayer, mockPuzzle.dow);
    });
    test('If player does not own game for specific dow, create new game and return', async () => {
      jest.spyOn(dbWorker, 'getPlayerById').mockImplementation(() => ownsMondayGamePlayer);
      await dbWorker.getGameByDow(mockPuzzle.dow, ownsMondayGamePlayer.id);
      expect(createGameSpy).toHaveBeenCalledWith(ownsMondayGamePlayer, mockPuzzle.dow);
    });
    test('If game found is not current, create new game and return', async () => {
      jest.spyOn(dbWorker, 'getPlayerById').mockImplementation(() => ownsFridayGamePlayer);
      jest.spyOn(dbWorker, '__getGameIfCurrent').mockImplementation(() => null);
      await dbWorker.getGameByDow(mockPuzzle.dow, ownsFridayGamePlayer.id);
      expect(createGameSpy).toHaveBeenCalledWith(ownsFridayGamePlayer, mockPuzzle.dow);
    });
    test('If player has dow game, and game found is current, return game', async () => {
      jest.spyOn(dbWorker, 'getPlayerById').mockImplementation(() => ownsFridayGamePlayer);
      jest.spyOn(dbWorker, '__getGameIfCurrent').mockImplementation(() => mockGame);
      const actualGame = await dbWorker.getGameByDow(mockPuzzle.dow, ownsFridayGamePlayer.id);
      expect(actualGame).toStrictEqual(mockGame);
    });
  });

  describe('getDefaultGame', () => {
    let currentDOWSpy, previousDOWSpy, getGameByDowSpy;
    beforeEach(() => {
      currentDOWSpy = jest.spyOn(PuzzleUtils, 'getCurrentDOW').mockImplementation(() => 'Friday');
      previousDOWSpy = jest.spyOn(PuzzleUtils, 'getPreviousDOW').mockImplementation(() => 'Thursday');
      getGameByDowSpy = jest.spyOn(dbWorker, 'getGameByDow').mockImplementation(() => {});
    });
    test('If player not found in DB, throw error', async () => {
      expect.assertions(1);
      jest.spyOn(dbWorker, 'getPlayerById').mockImplementation(() => null);
      try {
        await dbWorker.getDefaultGame('nonExistentPlayerId');
      } catch (e) {
        expect(e).toStrictEqual(new Error('Cannot find player nonExistentPlayerId in database'));
      }
    });
    test('If current puzzle is saved, return game for today\'s date', async () => {
      jest.spyOn(dbWorker.puzzleUtils, 'isCurrentPuzzleSaved').mockImplementation(() => true);
      await dbWorker.getDefaultGame(newPlayer.id);
      expect(currentDOWSpy).toHaveBeenCalled();
      expect(getGameByDowSpy).toHaveBeenCalledWith('Friday', newPlayer.id);
    });

    test('If current puzzle is not saved, return game for yesterday\'s date', async () => {
      jest.spyOn(dbWorker.puzzleUtils, 'isCurrentPuzzleSaved').mockImplementation(() => false);
      await dbWorker.getDefaultGame(newPlayer.id);
      expect(previousDOWSpy).toHaveBeenCalled();
      expect(getGameByDowSpy).toHaveBeenCalledWith('Thursday', newPlayer.id);
    });
  });

  describe('updatePlayerFocus', () => {
    test('If playerid not found in game players list, throw error', async () => {
      expect.assertions(1);
      jest.spyOn(dbWorker, '__getGamePlayers').mockImplementation(() => mockGamePlayers);
      try {
        await dbWorker.updatePlayerFocus('nothere', mockGame.gameId, mockPlayerFocus);
      } catch (e) {
        expect(e).toStrictEqual(new Error(`Cannot find player nothere in game ${mockGame.gameId}`));
      }
    });
    test('Happy path: update game in DB with new player focus', async () => {
      jest.spyOn(dbWorker, '__getGamePlayers').mockImplementation(() => mockGamePlayers);
      await dbWorker.updatePlayerFocus('cde345', mockGame.gameId, mockPlayerFocus);
      const expectedRefPath = `games/${mockGame.gameId}/players/1`;
      expect(db.ref).toHaveBeenCalledWith(expectedRefPath);
      expect(db.ref(expectedRefPath).update).toHaveBeenCalledWith({ currentFocus: mockPlayerFocus });
    });
  });

  describe('getPuzzleDates', () => {
    test('throw error if no puzzles found in db', async () => {
      expect.assertions(1);
      jest.spyOn(dbWorker, 'getPuzzles').mockImplementation(() => null);
      try {
        await dbWorker.getPuzzleDates();
      } catch (e) {
        expect(e).toStrictEqual(new Error('No puzzles found in DB'));
      }
    });
    test('happy path: return map of day-of-week to puzzle dates', async () => {
      jest.spyOn(dbWorker, 'getPuzzles').mockImplementation(() => mockPuzzles);
      const result = await dbWorker.getPuzzleDates();
      expect(result).toStrictEqual({
        Friday: '9/9/2022',
        Monday: '9/19/2022',
        Saturday: '9/17/2022',
        Sunday: '9/18/2022',
        Thursday: '9/15/2022',
        Tuesday: '9/20/2022',
        Wednesday: '9/14/2022',
      });
    });
  });

  describe('saveBoard', () => {
    test('happy path: save board', async () => {
      await dbWorker.saveBoard(mockGame.gameId, { board: true });
      const expectedRefPath = `games/${mockGame.gameId}`;
      expect(db.ref).toHaveBeenCalledWith(expectedRefPath);
      expect(db.ref(expectedRefPath).update).toHaveBeenCalledWith({
        board: { board: true },
      });
    });
  });

  describe('findOrCreatePlayer', () => {
    test('If player found from Firebase user UID, return player', async () => {
      jest.spyOn(dbWorker, 'getPlayerById').mockImplementation(() => newPlayer);
      const result = await dbWorker.findOrCreatePlayer({ uid: newPlayer.id });
      expect(result).toStrictEqual(newPlayer);
    });

    test('If player not found, call __createNewPlayer() with Firebase user as param', async () => {
      const mockFirebaseUser = { uid: newPlayer.id };
      jest.spyOn(dbWorker, 'getPlayerById').mockImplementation(() => null);
      const createPlayerSpy = jest.spyOn(dbWorker, '__createNewPlayer').mockImplementation(() => {});
      await dbWorker.findOrCreatePlayer(mockFirebaseUser);
      expect(createPlayerSpy).toHaveBeenCalledWith(mockFirebaseUser);
    });
  });

  describe('addPlayerToGame', () => {
    test('If player already owns game, return null', async () => {
      const result = await dbWorker.addPlayerToGame({ id: 'abc123' }, mockMultiplayerGame);
      expect(result).toStrictEqual(null);
    });
    test('If player already listed in team game players, return null', async () => {
      const result = await dbWorker.addPlayerToGame({ id: 'cde345' }, mockMultiplayerGame);
      expect(result).toStrictEqual(null);
    });
    test('Update game players correctly in database and return addedPlayer object', async () => {
      const expectedAddedPlayer = {
        playerId: 'xyz987',
        photoURL: 'https://examplephoto2.com',
        displayName: 'Second Pal',
        owner: false,
        color: 'cyan',
        online: true,
      };
      const resultingPlayers = [
        ...mockGamePlayers,
        expectedAddedPlayer,
      ];
      const result = await dbWorker.addPlayerToGame(addedPlayer, mockMultiplayerGame);
      const expectedRefPath = `games/${mockGame.gameId}`;
      expect(db.ref).toHaveBeenCalledWith(expectedRefPath);
      expect(db.ref(expectedRefPath).update).toHaveBeenCalledWith({
        players: resultingPlayers,
      });
      expect(result).toStrictEqual(expectedAddedPlayer);
    });
  });

  describe('addGameToPlayer', () => {
    test('If player is owner of game, return null', async () => {
      const result = await dbWorker.addGameToPlayer({ id: 'abc123' }, mockMultiplayerGame);
      expect(result).toStrictEqual(null);
    });

    test('If game is already in player team game list, return null', async () => {
      const result = await dbWorker.addGameToPlayer(onlyTeamPlayer, mockMultiplayerGame);
      expect(result).toStrictEqual(null);
    });

    test('If player does not have any games, correctly update player & return team games', async () => {
      jest.spyOn(dbWorker, 'getPlayerById').mockImplementation(() => newPlayer);
      const getTeamGamesSpy = jest.spyOn(dbWorker, '__getPlayerTeamGames').mockImplementation(() => {});
      await dbWorker.addGameToPlayer(playerNoGames, mockMultiplayerGame);
      const expectedRefPath = `players/${playerNoGames.id}`;
      const expectedGames = {
        owner: {},
        team: {
          'e27dd721-a9fd-4f95-97ae-b4bfa939e7df': {
            gameId: 'e27dd721-a9fd-4f95-97ae-b4bfa939e7df',
            friend: {
              displayName: 'Best Bud',
              playerId: 'abc123',
            },
            dow: 'Friday',
            date: '9/9/2022',
          },
        },
      };
      expect(db.ref).toHaveBeenCalledWith(expectedRefPath);
      expect(db.ref(expectedRefPath).update).toHaveBeenCalledWith({
        games: expectedGames,
      });
      expect(getTeamGamesSpy).toHaveBeenCalledWith(playerNoGames.id);
    });

    test('If player does not have any team games, update player & return team games', async () => {
      jest.spyOn(dbWorker, 'getPlayerById').mockImplementation(() => newPlayer);
      const getTeamGamesSpy = jest.spyOn(dbWorker, '__getPlayerTeamGames').mockImplementation(() => {});
      await dbWorker.addGameToPlayer(ownsMondayGamePlayer, mockMultiplayerGame);
      const expectedRefPath = `players/${ownsMondayGamePlayer.id}`;
      const expectedGames = {
        owner: {
          Monday: 'alsdkfjalksdjf',
        },
        team: {
          'e27dd721-a9fd-4f95-97ae-b4bfa939e7df': {
            gameId: 'e27dd721-a9fd-4f95-97ae-b4bfa939e7df',
            friend: {
              displayName: 'Best Bud',
              playerId: 'abc123',
            },
            dow: 'Friday',
            date: '9/9/2022',
          },
        },
      };
      expect(db.ref).toHaveBeenCalledWith(expectedRefPath);
      expect(db.ref(expectedRefPath).update).toHaveBeenCalledWith({
        games: expectedGames,
      });
      expect(getTeamGamesSpy).toHaveBeenCalledWith(ownsMondayGamePlayer.id);
    });

    test('If player does not have specific team game, update player and return team games', async () => {
      jest.spyOn(dbWorker, 'getPlayerById').mockImplementation(() => newPlayer);
      const getTeamGamesSpy = jest.spyOn(dbWorker, '__getPlayerTeamGames').mockImplementation(() => {});
      await dbWorker.addGameToPlayer(playerDifTeamGame, mockMultiplayerGame);
      const expectedRefPath = `players/${playerDifTeamGame.id}`;
      const expectedGames = {
        team: {
          difTeamGame: {
            date: '9/15/2022',
            dow: 'Thursday',
            friend: {
              displayName: 'Me My',
              playerId: 'difTeamGamePlayer',
            },
            gameId: 'difTeamGame',
          },
          'e27dd721-a9fd-4f95-97ae-b4bfa939e7df': {
            gameId: 'e27dd721-a9fd-4f95-97ae-b4bfa939e7df',
            friend: {
              displayName: 'Best Bud',
              playerId: 'abc123',
            },
            dow: 'Friday',
            date: '9/9/2022',
          },
        },
      };
      expect(db.ref).toHaveBeenCalledWith(expectedRefPath);
      expect(db.ref(expectedRefPath).update).toHaveBeenCalledWith({
        games: expectedGames,
      });
      expect(getTeamGamesSpy).toHaveBeenCalledWith(playerDifTeamGame.id);
    });
  });

  describe('updateGameOnlineStatusForPlayer', () => {
    test('Update status to online', async () => {
      jest.spyOn(dbWorker, '__getGamePlayers').mockImplementation(() => mockGamePlayers);
      await dbWorker.updateGameOnlineStatusForPlayer(mockMultiplayerGame.gameId, 'cde345', true);
      const expectedRefPath = `games/${mockMultiplayerGame.gameId}/players/1`;
      expect(db.ref).toHaveBeenCalledWith(expectedRefPath);
      expect(db.ref(expectedRefPath).update).toHaveBeenCalledWith({
        online: true,
      });
    });

    test('Update status to offline', async () => {
      jest.spyOn(dbWorker, '__getGamePlayers').mockImplementation(() => mockGamePlayers);
      const removeCursorSpy = jest.spyOn(dbWorker, '__removeCursorFromBoard')
        .mockImplementation(() => {});
      await dbWorker.updateGameOnlineStatusForPlayer(mockMultiplayerGame.gameId, 'rgf787', false);
      const expectedRefPath = `games/${mockMultiplayerGame.gameId}/players/2`;
      expect(db.ref).toHaveBeenCalledWith(expectedRefPath);
      expect(db.ref(expectedRefPath).update).toHaveBeenCalledWith({
        online: false,
      });
      expect(removeCursorSpy).toHaveBeenCalledWith(mockMultiplayerGame.gameId, mockGamePlayers[2]);
    });
  });

  test('[__getGameIfCurrent] Dbworker returns game if current', async () => {
    mockDbListener.getDbObjectByIdOnce.mockImplementation((collection, id) => {
      if (collection === 'puzzles') {
        return Promise.resolve({ dow: id, date: '09/20/2022' });
      }
      if (collection === 'games') {
        return Promise.resolve({ gameId: id, date: '09/20/2022' });
      }
      return Promise.resolve(null);
    });
    expect(await dbWorker.__getGameIfCurrent('789', 'Tuesday'))
      .toStrictEqual({ gameId: '789', date: '09/20/2022' });
  });

  test('[__getGameIfCurrent] Dbworker returns null if game not current', async () => {
    mockDbListener.getDbObjectByIdOnce.mockImplementation((collection, id) => {
      if (collection === 'puzzles') {
        return Promise.resolve({ dow: id, date: '09/20/2022' });
      }
      if (collection === 'games') {
        return Promise.resolve({ gameId: id, date: '09/13/2022' });
      }
      return Promise.resolve(null);
    });
    expect(await dbWorker.__getGameIfCurrent('789', 'Tuesday'))
      .toStrictEqual(null);
  });

  test('[__createNewGame] Dbworker saves new game at new db ref', async () => {
    await dbWorker.__createNewGame(mockGame.gameId, mockPuzzle.dow, newPlayer.id);
    expect(db.ref).toHaveBeenCalledWith(`games/${mockGame.gameId}`);
    expect(db.ref(`games/${mockGame.gameId}`).set).toHaveBeenCalledWith(mockGame);
  });

  test('[__createGameAndUpdatePlayer] Dbworker adds game to player object '
        + 'after creating player\'s game', async () => {
    const createNewGameMock = jest.spyOn(DbWorker.prototype, '__createNewGame')
      .mockImplementation(() => mockGame);
    await dbWorker.__createGameAndUpdatePlayer(newPlayer, 'Friday');
    expect(createNewGameMock).toHaveBeenCalledWith(expect.any(String), 'Friday', 'abc123');
    expect(db.ref).toHaveBeenCalledWith('players/abc123');
    expect(db.ref('players/abc123').update).toHaveBeenCalledWith({
      games: {
        owner: {
          Friday: mockGame.gameId,
        },
      },
    });
  });

  test('[__createGameAndUpdatePlayer] Dbworker throws error '
       + 'if we can\'t find newly created game', async () => {
    jest.spyOn(DbWorker.prototype, '__createNewGame').mockImplementation(() => null);
    expect.assertions(1);
    try {
      await dbWorker.__createGameAndUpdatePlayer(newPlayer, 'Friday');
    } catch (e) {
      expect(e.message).toMatch(/Will not add game to player/);
    }
  });
});
