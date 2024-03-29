const Debug = require('debug');
const { Server } = require('socket.io');

module.exports = class WebSocketServer {
  constructor(httpServer, dbWorker) {
    this.debug = Debug('WebSocketServer');
    this.dbWorker = dbWorker;
    this.io = new Server(
      httpServer,
      process.env.NODE_ENV === 'development'
        ? {
          cors: {
            origin: process.env.REACT_APP_DEV_CLIENT_SERVER,
            methods: ['GET', 'POST'],
          },
        } : {},
    );
  }

  __leavePreviousGameRooms(socket, playerId) {
    const currentRooms = Array.from(socket.rooms);
    if (currentRooms.length > 1) {
      const prevGameId = currentRooms[1];
      socket.leave(prevGameId);
      this.io.to(prevGameId).emit('player-offline', playerId, prevGameId);
      this.debug(`Sent 'player-offline' event to ${prevGameId} for ${playerId}`);
      this.dbWorker.updateGameOnlineStatusForPlayer(prevGameId, playerId, false);
    }
  }

  async __joinCurrentGameRoom(socket, gameId, playerId) {
    socket.join(gameId);

    const player = await this.dbWorker.getPlayerById(playerId);
    this.io.to(gameId).emit('player-online', playerId, player.displayName, gameId);
    this.debug(`Sent 'player-online' event to ${gameId} for ${playerId}`);
    this.dbWorker.updateGameOnlineStatusForPlayer(gameId, playerId, true);

    // add listeners
    socket.on('disconnect', () => {
      this.io.to(gameId).emit('player-offline', playerId, gameId);
      this.debug(`Sent 'player-offline' event to ${gameId} for ${playerId}`);
      this.dbWorker.updateGameOnlineStatusForPlayer(gameId, playerId, false);
    });
  }

  async __sendGameToClient(socket, game, playerId) {
    const { gameId } = game;
    socket.emit('load-game', game, socket.id);
    this.debug(`Sent 'load-game' to ${socket.id} for ${game.gameId}`);
    this.__leavePreviousGameRooms(socket, playerId);
    this.__joinCurrentGameRoom(socket, gameId, playerId);
  }

  async __updateTeamGame(socket, game, playerId) {
    const player = await this.dbWorker.getPlayerById(playerId);
    const addedPlayer = await this.dbWorker.addPlayerToGame(player, game);
    if (addedPlayer) {
      this.io.to(game.gameId).emit('player-added-to-game', addedPlayer, game.gameId);
      this.debug(`Send 'player-added-to-game' to ${game.gameId} for ${playerId}`);
    }
    const teamGames = await this.dbWorker.addGameToPlayer(player, game);
    if (teamGames) {
      socket.emit('load-team-games', teamGames);
      this.debug(`Sent 'load-team-games' for player ${player.id}`);
    }
  }

  initialize() {
    this.io.on('connection', async (socket) => {
      socket.on('save-board', async (gameId, board, autocheck) => {
        try {
          this.dbWorker.saveBoard(gameId, board, autocheck);
        } catch (e) {
          console.error(e);
        }
      });
      socket.on('get-puzzle-dates', async () => {
        try {
          const puzzleDates = await this.dbWorker.getPuzzleDates();
          socket.emit('load-puzzle-dates', puzzleDates);
          this.debug(`Sent 'load-puzzle-dates' to ${socket.id}`);
        } catch (e) {
          console.error(e);
        }
      });
      socket.on('get-game-by-dow', async (dow, playerId) => {
        try {
          const game = await this.dbWorker.getGameByDow(dow, playerId);
          this.__sendGameToClient(socket, game, playerId);
        } catch (e) {
          console.error(e);
        }
      });
      socket.on('get-default-game', async (playerId) => {
        try {
          const game = await this.dbWorker.getDefaultGame(playerId);
          this.__sendGameToClient(socket, game, playerId);
        } catch (e) {
          console.error(e);
        }
      });
      socket.on('get-friend-request-name', async (gameId) => {
        try {
          const game = await this.dbWorker.getGameById(gameId);
          if (game) {
            const ownerId = game.players[0].playerId;
            const ownerInfo = await this.dbWorker.getPlayerById(ownerId);
            socket.emit('display-friend-request', ownerInfo.displayName);
            this.debug(`Sent 'display-friend-request' for game ${gameId}`);
          } else {
            socket.emit('game-not-found');
          }
        } catch (e) {
          console.error(e);
        }
      });
      socket.on('update-player-focus', (playerId, gameId, currentFocus) => {
        try {
          this.io.to(gameId).emit('update-player-focus', socket.id, playerId, gameId, currentFocus);
          this.debug(`Sent 'update-player-focus' to ${gameId} for player ${playerId}`);
          this.dbWorker.updatePlayerFocus(playerId, gameId, currentFocus);
        } catch (e) {
          console.error(e);
        }
      });
      socket.on('leave-game', async (playerId, gameId) => {
        try {
          socket.leave(gameId);
          this.io.to(gameId).emit('player-offline', playerId, gameId);
          this.debug(`Sent 'player-offline' for ${playerId}`);
          this.dbWorker.updateGameOnlineStatusForPlayer(gameId, playerId, false);
        } catch (e) {
          console.error(e);
        }
      });
      socket.on('send-changes', (action) => {
        try {
          this.io.to(action.gameId).emit('receive-changes', action);
          this.debug(`Sent 'receive-changes' to all clients in game ${action.gameId}`);
        } catch (e) {
          console.error(e);
        }
      });
      socket.on('get-game-by-id', async (gameId, playerId) => {
        try {
          const game = await this.dbWorker.getGameById(gameId);
          if (game) {
            const ownerId = game.players[0].playerId;
            if (playerId !== ownerId) {
              this.__updateTeamGame(socket, game, playerId);
            }
            this.__sendGameToClient(socket, game, playerId);
          } else {
            socket.emit('game-not-found');
            this.debug(`Sent game-not-found event to ${socket.id}`);
          }
        } catch (e) {
          console.error(e);
        }
      });
      socket.on('get-team-games', async (playerId) => {
        try {
          const player = await this.dbWorker.getPlayerById(playerId);
          if (player.games && player.games.team) {
            const teamGames = player.games.team;
            socket.emit('load-team-games', teamGames);
            this.debug(`Sent load-team-games for ${playerId}`);
          }
        } catch (e) {
          console.error(e);
        }
      });
      socket.on('user-signed-in', async (idToken) => {
        let user, player;
        try {
          user = await this.dbWorker.verifyFirebaseClientToken(idToken);
        } catch (e) {
          console.error(e);
          socket.emit('server-auth-error');
          this.debug('Sent server-auth-error');
          return;
        }
        try {
          // add player to db if not added yet
          player = await this.dbWorker.findOrCreatePlayer(user);
          if (player) {
            socket.emit('player-exists', player.id);
            this.debug(`Sent player-exists for ${player.id}`);
          }
        } catch (e) {
          console.error(e);
        }
      });
      socket.on('verify-player-exists', async (playerId) => {
        try {
          const player = await this.dbWorker.getPlayerById(playerId);
          if (player) {
            socket.emit('player-exists', playerId);
            this.debug(`Sent player-exists for ${player.id}`);
          } else {
            socket.emit('player-not-found', playerId);
            this.debug(`Sent player-not-found for ${playerId}`);
          }
        } catch (e) {
          console.error(e);
        }
      });
      this.debug(`Connected to ${socket.id}`);
      const sockets = await this.io.fetchSockets();
      this.debug(`Connected sockets: ${sockets.map((s) => s.id).join(', ')}`);

      socket.on('disconnect', async (reason) => {
        this.debug(`Disconnected from ${socket.id}: ${reason}`);
        const connectedSockets = await this.io.fetchSockets();
        this.debug(`Connected sockets: ${connectedSockets.map((s) => s.id).join(', ')}`);
      });
    });
  }
};
