const Debug = require('debug');
const { v4: uuidv4 } = require('uuid');
const PuzzleUtils = require('../functions/utils/PuzzleUtils');
const GameConfig = require('./GameConfig');

module.exports = class DbWorker {
  constructor(db, auth, dbListener) {
    this.db = db;
    this.auth = auth;
    this.dbListener = dbListener;
    this.puzzleUtils = new PuzzleUtils(db);
    this.debug = Debug('DbWorker');
  }

  /**
   * Fetches game from the DB
   * Called when received following Socket event from client:
   * - get-friend-request-name
   * - get-game-by-id
   * @param {string} gameId
   * @returns Promise that can resolve to game object or null if game not in db
   */
  async getGameById(gameId) {
    return this.dbListener.getDbObjectByIdOnce('games', gameId);
  }

  /**
   * Fetches puzzle from the DB
   * @param {string} dow
   * @returns Promise that can resolve to puzzle object or null if puzzle not in db
   */
  async getPuzzleById(dow) {
    return this.dbListener.getDbObjectByIdOnce('puzzles', dow);
  }

  /**
   * Fetches puzzles from the DB
   * @returns Promise that can resolve to puzzle collection or null if no puzzles
   */
  async getPuzzles() {
    return this.dbListener.getDbCollectionOnce('puzzles');
  }

  /**
   * Fetches player from the DB
   * Called when receiving these Socket events from client:
   * - get-friend-request-name
   * - get-game-by-id
   * - get-team-games
   * - verify-player-exists
   * @param {string} playerId
   * @returns Promise that can resolve to player object or null if player not in db
   */
  async getPlayerById(playerId) {
    return this.dbListener.getDbObjectByIdOnce('players', playerId);
  }

  /**
   * Called on receiving 'get-game-by-dow' Socket event from client
   * Fetches or creates game for player based on day-of-the-week
   * @param {String} dow day of week
   * @param {String} playerId Firebase ID
   * @returns Always returns a game
   * @throws Error if player is not found in DB
   */
  async getGameByDow(dow, playerId) {
    const player = await this.getPlayerById(playerId);
    if (player) {
      const playerGames = player.games;
      if (playerGames && playerGames.owner && playerGames.owner[dow]) {
        const gameId = playerGames.owner[dow];
        const currentGame = await this.__getGameIfCurrent(gameId, dow);
        if (currentGame) {
          return currentGame;
        }
      }
      return this.__createGameAndUpdatePlayer(player, dow);
    }
    throw new Error(`Cannot find player ${playerId} in database`);
  }

  /**
   * Called on receiving 'get-default-game' Socket event from client
   * Fetches default game for player
   * @param {String} playerId
   * @returns Always returns a game (if it does not exist, it is created)
   * @throws Error if player is not found in DB
   */
  async getDefaultGame(playerId) {
    const player = await this.getPlayerById(playerId);
    if (player) {
      let dow;
      if (await this.puzzleUtils.isCurrentPuzzleSaved()) {
        dow = PuzzleUtils.getCurrentDOW();
      } else {
        dow = PuzzleUtils.getPreviousDOW();
      }
      return this.getGameByDow(dow, playerId);
    }
    throw new Error(`Cannot find player ${playerId} in database`);
  }

  /**
   * Called on receiving Socket event 'update-player-focus'
   * @param {String} playerId
   * @param {String} gameId
   * @param {Object} currentFocus
   */
  async updatePlayerFocus(playerId, gameId, currentFocus) {
    const players = await this.__getGamePlayers(gameId);
    // TODO: Change db schema so playerId is key
    const index = players.findIndex((player) => player.playerId === playerId);
    if (index === -1) {
      throw new Error(`Cannot find player ${playerId} in game ${gameId}`);
    }
    const playerRef = this.db.ref(`games/${gameId}/players/${index}`);
    playerRef.update({
      currentFocus,
    });
  }

  /**
   * Called on receiving Socket event 'get-puzzle-dates' from client
   */
  async getPuzzleDates() {
    const puzzles = await this.getPuzzles();
    if (puzzles) {
      const dates = {};
      Object.keys(puzzles).forEach((dow) => {
        dates[dow] = puzzles[dow].date;
      });
      return dates;
    }
    throw new Error('No puzzles found in DB');
  }

  /**
   * Called on receiving Socket event 'save-board'
   * @param {String} gameId
   * @param {Object} board
   * @param {Boolean} autocheck
   */
  async saveBoard(gameId, board, autocheck) {
    const gameRef = this.db.ref(`games/${gameId}`);
    gameRef.update({
      board,
      autocheck,
    });
  }

  /**
   * Called on receiving Socket event 'user-signed-in'
   * @param {String} idToken
   * @returns Promise resolved to Firebase user, or rejected if user can't be verified
   */
  async verifyFirebaseClientToken(idToken) {
    const decodedToken = await this.auth.verifyIdToken(idToken);
    const { uid } = decodedToken;
    const user = await this.auth.getUser(uid);
    return user;
  }

  /**
   * Called on receiving Socket event 'user-signed-in'
   * @param {FirebaseUser} user
   * @returns Player object always, newly created if not found in DB
   */
  async findOrCreatePlayer(user) {
    if (!user) return null;
    const player = await this.getPlayerById(user.uid);
    if (player) {
      return player;
    }
    return this.__createNewPlayer(user);
  }

  /**
   * Called on receiving Socket event 'get-game-by-id' if player does not own game
   * @param {Object} player
   * @param {Object} game
   * @returns GamePlayer object if successfully added to game, Null if Player was already part of Game
   */
  async addPlayerToGame(player, game) {
    const { players, gameId } = game;
    // TODO: Change db schema so playerId is key
    if (players.find((p) => p.playerId === player.id)) {
      return null;
    }
    const numCurrentPlayers = players.length;
    const numDefaultColors = GameConfig.defaultPlayerColors.length;
    const playerDefaultColorIndex = numCurrentPlayers % numDefaultColors;
    const addedPlayer = {
      playerId: player.id,
      photoURL: player.photoURL,
      displayName: player.displayName,
      owner: false,
      color: GameConfig.defaultPlayerColors[playerDefaultColorIndex],
      online: true,
    };
    players.push(addedPlayer);
    const gameRef = this.db.ref(`games/${gameId}`);
    await gameRef.update({
      players,
    });
    return addedPlayer;
  }

  /**
   * Called on receiving Socket event 'get-game-by-id' if player does not own game
   * @param {Object} player
   * @param {Object} game
   * @returns Player team games if successfully added game, Null if game was already part of games
   */
  async addGameToPlayer(player, game) {
    const { players, gameId } = game;
    const gameOwner = players[0].playerId;

    // return if player already owns game
    if (gameOwner === player.id) return null;

    let playerGames = player.games;
    if (!playerGames) {
      playerGames = { owner: {}, team: {} };
    }
    let teamGames = playerGames.team;
    if (!teamGames) {
      teamGames = {};
    }
    // return if game already exists in player team game list
    if (teamGames[gameId]) return null;

    // get game owner info for front-end to display
    const ownerId = game.players[0].playerId;
    const owner = await this.getPlayerById(ownerId);

    teamGames[gameId] = {
      gameId,
      friend: {
        displayName: owner.displayName,
        playerId: owner.id,
      },
      dow: game.dow,
      date: game.date,
    };

    playerGames.team = teamGames;

    const playerRef = this.db.ref(`players/${player.id}`);
    await playerRef.update({
      games: playerGames,
    });
    return this.__getPlayerTeamGames(player.id);
  }

  /**
   * Called on receiving Socket event 'leave-game' and when joining any game
   * @param {String} gameId
   * @param {String} playerId
   * @param {Boolean} online
   */
  async updateGameOnlineStatusForPlayer(gameId, playerId, online) {
    const players = await this.__getGamePlayers(gameId);
    if (players) {
      // TODO: Change db schema so playerId is key
      const index = players.findIndex((player) => player.playerId === playerId);
      if (index !== -1) {
        const playerRef = this.db.ref(`games/${gameId}/players/${index}`);
        playerRef.update({
          online,
        });
        if (!online) {
          this.__removeCursorFromBoard(gameId, players[index]);
        }
      }
    }
  }

  /**
   * Called by updateGameOnlineStatusForPlayer() method if player going offline
   * @param {String} gameId
   * @param {Object} player
   */
  async __removeCursorFromBoard(gameId, player) {
    const playerFocus = player.currentFocus;
    if (playerFocus) {
      const game = await this.getGameById(gameId);
      const { board } = game;
      playerFocus.word.forEach((square) => {
        if (board[square].activeWordColors) {
          board[square].activeWordColors = board[square].activeWordColors.filter(
            (color) => color !== player.color,
          );
        }
        if (board[square].activeLetterColors) {
          board[square].activeLetterColors = board[square].activeLetterColors.filter(
            (color) => color !== player.color,
          );
        }
      });
      const gameRef = this.db.ref(`games/${gameId}`);
      gameRef.update({
        board,
      });
    }
  }

  /**
   * Creates player from FirebaseUser and saves to DB
   * @param {FirebaseUser} user
   * @returns newly created player
   */
  async __createNewPlayer(user) {
    if (!user) return null;
    const playerId = user.uid;
    const playerRef = this.db.ref(`players/${playerId}`);
    await playerRef.set({
      id: playerId,
      displayName: user.displayName,
      email: user.email,
      photoURL: user.photoURL,
    });
    return this.getPlayerById(playerId);
  }

  /**
   * Creates new game
   * @param {String} gameId
   * @param {String} dow
   * @param {String} playerId
   * @returns Newly created game if found in ref path after creation
   * @returns null if no game found at ref path
   */
  async __createNewGame(gameId, dow, playerId) {
    const puzzle = await this.getPuzzleById(dow);
    const player = await this.getPlayerById(playerId);
    const numSquares = puzzle.size.rows * puzzle.size.cols;
    const gameRef = this.db.ref(`games/${gameId}`);
    await gameRef.set({
      gameId,
      savedBoardToDB: true,
      autocheck: false,
      advanceCursor: 0,
      // TODO: Need to change this to dictionary instead of indexed array for cleaner code
      players: [{
        playerId: player.id,
        photoURL: player.photoURL,
        displayName: player.displayName,
        owner: true,
        color: GameConfig.defaultPlayerColors[0],
      }],
      board: [...Array(numSquares).keys()].map((num) => ({
        initial: true,
        index: num,
        input: '',
        reveal: false,
        check: false,
        verified: false,
        incorrect: false,
        partial: false,
        penciled: false,
        activeWordColors: [],
        activeLetterColors: [],
      })),
      clueDictionary: puzzle.clueDictionary,
      gameGrid: puzzle.gameGrid,
      copyright: puzzle.copyright,
      date: puzzle.date,
      dow: puzzle.dow,
      editor: puzzle.editor,
      author: puzzle.author,
      hasTitle: puzzle.hastitle,
      title: puzzle.title,
      numRows: puzzle.size.rows,
      numCols: puzzle.size.cols,
    });
    return this.getGameById(gameId);
  }

  /**
   * Returns game for the day-of-the-week if current
   * @param {string} gameId
   * @param {string} dow
   * @returns Game object if game is current, null if Game is not current
   */
  async __getGameIfCurrent(gameId, dow) {
    const currentPuzzle = await this.getPuzzleById(dow);
    const game = await this.getGameById(gameId);
    if (game && game.date === currentPuzzle.date) {
      return game;
    }
    return null;
  }

  /**
   * Creates a new game, saves to database, and updates player games
   * @param {*} player player DB object
   * @param {*} dow day-of-week
   * @returns Newly created game
   * @throws Error if game was not created correctly
   */
  async __createGameAndUpdatePlayer(player, dow) {
    // TODO: Change to playerId for consistency with rest of code.
    const playerId = player.id;

    // create new game
    const gameId = uuidv4();
    const newGame = await this.__createNewGame(gameId, dow, playerId);

    if (newGame) {
      // update player object
      let playerGames = player.games;

      if (!playerGames) {
        playerGames = {};
      }
      let ownerGames = playerGames.owner;
      if (!ownerGames) {
        ownerGames = {};
      }
      ownerGames[dow] = newGame.gameId;
      playerGames.owner = ownerGames;

      const playerRef = this.db.ref(`players/${playerId}`);
      await playerRef.update({
        games: playerGames,
      });
    } else {
      throw new Error(
        `Game ${gameId} was not created correctly. Will not add game to player ${playerId}.`,
      );
    }
    return newGame;
  }

  /**
   * Get players in the game
   * @param {String} gameId
   * @returns GamePlayers object
   */
  async __getGamePlayers(gameId) {
    const game = await this.getGameById(gameId);
    return game.players;
  }

  /**
   * Get team games from player
   * @param {String} playerId
   * @returns TeamGames object from Player
   */
  async __getPlayerTeamGames(playerId) {
    const player = await this.getPlayerById(playerId);
    if (player.games && player.games.team) {
      return player.games.team;
    }
    return null;
  }
};
