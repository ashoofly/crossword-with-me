const Debug = require('debug');
const { v4: uuidv4 } = require('uuid');
const PuzzleUtils = require('../functions/utils/PuzzleUtils');
const GameConfig = require('./GameConfig');

class DbWorker {
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
   * @returns Promise that can resolve to game object
   * @returns null if game not in db
   */
  async getGameById(gameId) {
    return this.dbListener.getDbObjectByIdOnce('games', gameId);
  }

  /**
   * Fetches puzzle from the DB
   * @param {string} dow
   * @returns Promise that can resolve to puzzle object
   * @returns null if day-of-the-week puzzle not in db
   */
  async getPuzzleById(dow) {
    return this.dbListener.getDbObjectByIdOnce('puzzles', dow);
  }

  /**
   * Fetches player from the DB
   * Called when receiving these Socket events from client:
   * - get-friend-request-name
   * - get-game-by-id
   * - get-team-games
   * - verify-player-exists
   * @param {string} playerId
   * @returns Promise that can resolve to player object
   * @returns null if player not in db
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
      if (playerGames && playerGames.owner && playerGames.owner.dow) {
        const gameId = playerGames.owner.dow;
        const currentGame = await this.getGameIfCurrent(gameId, dow);
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
   */
   async updatePlayerFocus(playerId, gameId, currentFocus) {
    const players = await this.#getGamePlayers(gameId);
    if (players) {
      // TODO: Change db schema so playerId is key
      const index = players.findIndex((player) => player.playerId === playerId);
      const playerRef = this.db.ref(`games/${gameId}/players/${index}`);
      playerRef.update({
        currentFocus,
      });
    }
  }


  /**
   * Called on receiving Socket event 'get-puzzle-dates' from client
   */
   async getPuzzleDates() {
    const puzzles = await this.dbListener.getDbCollectionOnce('puzzles');
    if (puzzles) {
      const dates = {};
      puzzles.forEach((dow) => {
        dates[dow] = puzzles[dow].date;
      });
      return dates;
    }
    this.debug('Nothing at path puzzles/');
    return null;
  }


  /**
   * Called on receiving Socket event 'save-board'
   * @param {*} gameId 
   * @param {*} board 
   */
   async saveBoard(gameId, board) {
    const gameRef = this.db.ref(`games/${gameId}`);
    gameRef.update({
      board,
    });
  }

  const TOO_VAGUELY_NAMED = 1;
  /**** TODO: NOW START THE TOO VAGUELY NAMED FUNCTIONS. CHANGE NAMES. */

  /**
   * Called on Socket event 'user-signed-in'
   * @param {*} firebaseClientToken 
   * @param {*} gameId 
   * @returns 
   */
   async addUserToGame(firebaseClientToken, gameId) {
    try {
      const user = await this.verifyFirebaseClientToken(firebaseClientToken);
      const player = await this.findOrCreatePlayer(user);
      const game = await this.dbListener.getDbObjectByIdOnce('games', gameId);
      this.addPlayerToGame(player, game);
      return player;
    } catch (error) {
      this.debug(error);
      return null;
    }
  }

  /**
   * Called on Socket event 'user-signed-in'
   * @param {*} firebaseClientToken 
   * @returns 
   */
  async addPlayerToDB(firebaseClientToken) {
    const user = await this.verifyFirebaseClientToken(firebaseClientToken);
    try {
      return await this.findOrCreatePlayer(user);
    } catch (error) {
      this.debug(error);
      return null;
    }
  }


  /**
   * Called on receiving Socket event 'get-game-by-id'
   * @param {*} player 
   * @param {*} game 
   * @returns 
   */
   async addPlayerToGame(player, game) {
    let addedPlayer;
    // update game object
    const { players, gameId } = game;
    // TODO: Change db schema so playerId is key
    if (players.find((p) => p.playerId === player.id)) {
      this.debug(`Player ${player.id} already part of game ${gameId}.`);
    } else {
      const numCurrentPlayers = players.length;
      addedPlayer = {
        playerId: player.id,
        photoURL: player.photoURL,
        displayName: player.displayName,
        owner: false,
        color: GameConfig.defaultPlayerColors[numCurrentPlayers],
        online: true,
      };
      players.push(addedPlayer);
      const gameRef = this.db.ref(`games/${gameId}`);
      await gameRef.update({
        players,
      });
      this.debug('Sending player-added-to-game to game room');
    }

    // update player object
    const gameOwner = players[0].playerId;
    if (gameOwner !== player.id) {
      let playerGames = player.games;
      if (!playerGames) {
        playerGames = { owner: {}, team: {} };
      }
      let teamGames = playerGames.team;
      if (!teamGames) {
        teamGames = {};
      }
      if (!teamGames[gameId]) {
        // get game owner for front-end to display
        const ownerId = game.players[0].playerId;
        const owner = await this.dbListener.getDbObjectByIdOnce('players', ownerId);

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

        this.debug(`Adding game ${gameId} to team game list for ${player.id}.`);
        const playerRef = this.db.ref(`players/${player.id}`);
        playerRef.update({
          games: playerGames,
        });
      }
    }
    const teamGames = this.__getPlayerTeamGames(player.id);
    return { teamGames, addedPlayer };
  }

  /**
   * Called on receiving Socket event 'leave-game'
   * @param {*} gameId 
   * @param {*} playerId 
   * @param {*} online 
   */
  async updateGameOnlineStatusForPlayer(gameId, playerId, online) {
    const players = await this.#getGamePlayers(gameId);
    if (players) {
      // TODO: Change db schema so playerId is key
      const index = players.findIndex((player) => player.playerId === playerId);
      if (index !== -1) {
        this.debug(`Updating ${playerId} status for ${gameId} to ${online ? 'online' : 'offline'}`);
        const playerRef = this.db.ref(`games/${gameId}/players/${index}`);
        playerRef.update({
          online,
        });
        if (!online) {
          // remove cursor from board
          const player = players[index];
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
      }
    }
  }

  const PRIVATE_METHODS_START_HERE = 1;

  /**
   * Creates player from FirebaseUser and saves to DB
   * @param {FirebaseUser} user
   * @returns newly created player
   */
  async __createNewPlayer(user) {
    if (!user) return;
    const playerId = user.uid;
    const playerRef = this.db.ref(`players/${playerId}`);
    playerRef.set({
      id: playerId,
      displayName: user.displayName,
      email: user.email,
      photoURL: user.photoURL,
    });
    this.dbListener.getDbObjectByIdOnce('players', playerId);
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
   * @returns Game object if game is current
   * @returns null if Game is not current
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
    const newGame = await this.createNewGame(gameId, dow, playerId);

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

  async __verifyFirebaseClientToken(idToken) {
    try {
      const decodedToken = await this.auth.verifyIdToken(idToken);
      const { uid } = decodedToken;
      const user = await this.auth.getUser(uid);
      return user;
    } catch (error) {
      this.debug(error);
      return null;
    }
  }


  async __findOrCreatePlayer(user) {
    if (user === null) return null;
    const player = await this.dbListener.getDbObjectByIdOnce('players', user.uid);
    if (player) {
      return player;
    }
    return this.createNewPlayer(user);
  }


  async __getGamePlayers(gameId) {
    const game = await this.dbListener.getDbObjectByIdOnce('games', gameId);
    if (game.players) {
      return game.players;
    }
    return null;
  }

  async __getPlayerTeamGames(playerId) {
    const player = await this.dbListener.getDbObjectByIdOnce('players', playerId);
    if (player.games && player.games.team) {
      return player.games.team;
    }
    return null;
  }
}

module.exports = DbWorker;
