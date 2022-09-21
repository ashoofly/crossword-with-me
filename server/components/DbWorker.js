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
   * @param {string} playerId
   * @returns Promise that can resolve to player object
   * @returns null if player not in db
   */
  async getPlayerById(playerId) {
    return this.dbListener.getDbObjectByIdOnce('players', playerId);
  }

  /**
   * Returns game for the day-of-the-week if current
   * @param {string} gameId
   * @param {string} dow
   * @returns Game object if game is current
   * @returns null if Game is not current
   */
  async getGameIfCurrent(gameId, dow) {
    const currentPuzzle = await this.getPuzzleById(dow);
    const game = await this.getGameById(gameId);
    if (game && game.date === currentPuzzle.date) {
      return game;
    }
    return null;
  }

  /**
   * Creates new game
   * @param {String} gameId
   * @param {String} dow
   * @param {String} playerId
   * @returns Newly created game if found in ref path after creation
   * @returns null if no game found at ref path
   */
  async createNewGame(gameId, dow, playerId) {
    const puzzle = await this.getPuzzleById(dow);
    const player = await this.getPlayerById(playerId);
    const numSquares = puzzle.size.rows * puzzle.size.cols;
    console.log(this.db);
    const gameRef = this.db.ref(`games/${gameId}`);
    await gameRef.set({
      gameId,
      savedBoardToDB: true,
      autocheck: false,
      advanceCursor: 0,
      // TODO: Need to change this to dictionary instead of index for cleaner code
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
   * Fetches or creates game for player based on day-of-the-week
   * @param {String} dow day of week
   * @param {String} playerId Firebase ID
   * @returns Always returns a game
   */
  async findOrCreateGame(dow, playerId) {
    if (playerId) {
      // find player game
      const player = await this.dbListener.getPlayerById(playerId);
      if (player) {
        const playerGames = player.games;
        if (playerGames && playerGames.owner && playerGames.owner.dow) {
          const gameId = playerGames.owner.dow;
          const currentGame = await this.getGameIfCurrent(gameId, dow);
          if (currentGame) {
            return currentGame;
          }
        }
        return this.createGameAndUpdatePlayer(player, dow);
      }
      this.debug('Cannot find player in database');
      return null;
    }
    this.debug('No playerId given. Will not create game.');
    return null;
  }

  /**
   * Fetches default game for player
   * @param {String} playerId
   * @returns Always returns a game (if it does not exist, it is created)
   */
  async getDefaultGame(playerId) {
    try {
      const player = await this.getPlayerById(playerId);
      if (player) {
        let dow;
        if (await this.puzzleUtils.isCurrentPuzzleSaved()) {
          dow = PuzzleUtils.getCurrentDOW();
        } else {
          dow = PuzzleUtils.getPreviousDOW();
        }
        return this.findOrCreateGame(dow, playerId);
      }
      return null;
    } catch (error) {
      this.debug(error);
      return null;
    }
  }


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
    const teamGames = this.#getPlayerTeamGames(player.id);
    return { teamGames, addedPlayer };
  }

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

  async verifyFirebaseClientToken(idToken) {
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

  async addPlayerToDB(firebaseClientToken) {
    const user = await this.verifyFirebaseClientToken(firebaseClientToken);
    try {
      return await this.findOrCreatePlayer(user);
    } catch (error) {
      this.debug(error);
      return null;
    }
  }

  async createNewPlayer(user) {
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

  async createGameAndUpdatePlayer(player, dow) {
    const playerId = player.id;

    // create new game
    const gameId = uuidv4();
    const newGame = await this.createNewGame(gameId, dow, playerId);

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
    playerRef.update({
      games: playerGames,
    });
    return newGame;
  }

  async findOrCreatePlayer(user) {
    if (user === null) return null;
    const player = await this.dbListener.getDbObjectByIdOnce('players', user.uid);
    if (player) {
      return player;
    }
    return this.createNewPlayer(user);
  }

  async updateGame(gameId, board) {
    const gameRef = this.db.ref(`games/${gameId}`);
    gameRef.update({
      board,
    });
  }

  async #getGamePlayers(gameId) {
    const game = await this.dbListener.getDbObjectByIdOnce('games', gameId);
    if (game.players) {
      return game.players;
    }
    return null;
  }

  async #getPlayerTeamGames(playerId) {
    const player = await this.dbListener.getDbObjectByIdOnce('players', playerId);
    if (player.games && player.games.team) {
      return player.games.team;
    }
    return null;
  }
}

module.exports = DbWorker;
