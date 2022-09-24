const Debug = require('debug');
const { Server } = require('socket.io');

class WebSocketServer {
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
      this.dbWorker.updateGameOnlineStatusForPlayer(prevGameId, playerId, false);
    }
  }

  async __joinCurrentGameRoom(socket, gameId, playerId) {
    socket.join(gameId);

    const player = await this.dbWorker.getPlayerById(playerId);
    this.io.to(gameId).emit('player-online', playerId, player.displayName, gameId);
    this.dbWorker.updateGameOnlineStatusForPlayer(gameId, playerId, true);

    // add listeners
    socket.on('disconnect', () => {
      this.io.to(gameId).emit('player-offline', playerId, gameId);
      this.dbWorker.updateGameOnlineStatusForPlayer(gameId, playerId, false);
    });
  }

  async __sendGameToClient(socket, game, playerId) {
    const { gameId } = game;
    socket.emit('load-game', game, socket.id);
    this.__leavePreviousGameRooms(socket, playerId);
    this.__joinCurrentGameRoom(socket, gameId, playerId);
  }

  initialize() {
    this.io.on('connection', async (socket) => {
      socket.on('save-board', async (gameId, board) => {
        try {
          this.dbWorker.saveBoard(gameId, board);
        } catch (e) {
          console.error(e);
        }
      });
      socket.on('get-puzzle-dates', async () => {
        try {
          const puzzleDates = await this.dbWorker.getPuzzleDates();
          socket.emit('load-puzzle-dates', puzzleDates);
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
          this.dbWorker.updatePlayerFocus(playerId, gameId, currentFocus);
        } catch (e) {
          console.error(e);
        }
      });
      socket.on('leave-game', async (playerId, gameId) => {
        try {
          socket.leave(gameId);
          this.io.to(gameId).emit('player-offline', playerId, gameId);
          this.dbWorker.updateGameOnlineStatusForPlayer(gameId, playerId, false);
        } catch (e) {
          console.error(e);
        }
      });
      socket.on('send-changes', (action) => {
        try {
          this.io.to(action.gameId).emit('receive-changes', action);
        } catch (e) {
          console.error(e);
        }
      });
      socket.on('get-game-by-id', async (gameId, playerId) => {
        try {
          const game = await this.dbWorker.getGameById(gameId);
          if (game) {
            const ownerId = game.players[0].playerId;
            if (playerId === ownerId) {
              this.__sendGameToClient(socket, game, playerId);
            } else {
              const player = await this.dbWorker.getPlayerById(playerId);
              const { teamGames, addedPlayer } = await this.dbWorker.addPlayerToGame(player, game);
              if (addedPlayer) {
                this.io.to(game.gameId).emit('player-added-to-game', addedPlayer, game.gameId);
                socket.emit('load-team-games', teamGames);
              }
              this.__sendGameToClient(socket, game, playerId);
            }
          } else {
            socket.emit('game-not-found');
          }
        } catch (e) {
          console.error(e);
        }
      });
      socket.on('get-team-games', async (playerId) => {
        try {
          const player = await this.dbWorker.getPlayerById(playerId);
          const teamGames = player.games.team;
          socket.emit('load-team-games', teamGames);
        } catch (e) {
          console.error(e);
        }
      });
      socket.on('user-signed-in', async (idToken, gameId) => {
        try {
          let player = null;
          if (gameId) {
            // add user to game if not already added
            player = await this.dbWorker.addUserToGame(idToken, gameId);
            // TODO: Check this change.
            this.io.to(gameId).emit('player-added-to-game', player, gameId);
          } else {
            // add player to db if not already added
            player = await this.dbWorker.addPlayerToDB(idToken);
          }
          if (player) {
            socket.emit('player-exists', player.id);
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
          } else {
            socket.emit('player-not-found', playerId);
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
}

module.exports = WebSocketServer;
