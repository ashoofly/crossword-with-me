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

  initialize() {
    async function sendGame(socket, game, playerId) {
      const player = await this.dbWorker.getDbObjectById('players', playerId);

      if (player) {
        const { gameId } = game;
        socket.emit('load-game', game, socket.id);

        // leave any previous game rooms
        const currentRooms = Array.from(socket.rooms);
        if (currentRooms.length > 1) {
          const prevGameId = currentRooms[1];
          socket.leave(prevGameId);
          this.io.to(prevGameId).emit('player-offline', playerId, prevGameId);
          this.dbWorker.updateGameOnlineStatusForPlayer(prevGameId, playerId, false);
        }

        // join current game room
        socket.join(gameId);
        this.io.to(gameId).emit('player-online', playerId, player.displayName, gameId);
        this.dbWorker.updateGameOnlineStatusForPlayer(gameId, playerId, true);

        // add listeners
        socket.on('disconnect', () => {
          this.debug(`Send disconnect event to room ${gameId}`);
          this.io.to(gameId).emit('player-offline', playerId, gameId);
          this.dbWorker.updateGameOnlineStatusForPlayer(gameId, playerId, false);
        });
      }
    }

    this.io.on('connection', async (socket) => {
      socket.on('save-board', async (gameId, board) => {
        this.dbWorker.saveBoard(gameId, board);
      });
      socket.on('get-puzzle-dates', async () => {
        const puzzleDates = await this.dbWorker.getPuzzleDates();
        socket.emit('load-puzzle-dates', puzzleDates);
      });
      socket.on('get-game-by-dow', async (dow, playerId) => {
        const game = await this.dbWorker.findOrCreateGame(dow, playerId);
        sendGame(socket, game, playerId);
      });
      socket.on('get-default-game', async (playerId) => {
        const game = await this.dbWorker.getDefaultGame(playerId);
        sendGame(socket, game, playerId);
      });
      socket.on('get-friend-request-name', async (gameId) => {
        const game = await this.dbWorker.getDbObjectById('games', gameId);
        if (game) {
          if (game.players) {
            const ownerId = game.players[0].playerId;
            if (ownerId) {
              const ownerInfo = await this.dbWorker.getDbObjectById('players', ownerId);
              if (ownerInfo) {
                socket.emit('display-friend-request', ownerInfo.displayName);
              }
            }
          } else {
            socket.emit('game-not-found');
          }
        } else {
          socket.emit('game-not-found');
        }
      });
      socket.on('update-player-focus', (playerId, gameId, currentFocus) => {
        this.io.to(gameId).emit('load-player-cursor-change', socket.id, playerId, gameId, currentFocus);
        this.dbWorker.updatePlayerFocus(playerId, gameId, currentFocus);
      });
      socket.on('leave-game', async (playerId, gameId) => {
        socket.leave(gameId);
        this.io.to(gameId).emit('player-offline', playerId, gameId);
        this.dbWorker.updateGameOnlineStatusForPlayer(gameId, playerId, false);
      });
      socket.on('send-changes', (action) => {
        this.io.to(action.gameId).emit('receive-changes', action);
      });
      socket.on('get-game-by-id', async (gameId, playerId) => {
        const game = await this.dbWorker.getDbObjectById('games', gameId);
        if (game) {
          if (game.players) {
            const ownerId = game.players[0].playerId;
            if (playerId === ownerId) {
              sendGame(socket, game, playerId);
            } else {
              const player = await this.dbWorker.getDbObjectById('players', playerId);
              if (player) {
                const { teamGames, addedPlayer } = await this.dbWorker.addPlayerToGame(player, game);
                if (addedPlayer) {
                  this.io.to(game.gameId).emit('player-added-to-game', addedPlayer, game.gameId);
                }
                socket.emit('load-team-games', teamGames);
                sendGame(socket, game, playerId);
              }
            }
          } else {
            // anonymous game
            socket.emit('game-not-found');
          }
        }
      });
      socket.on('get-team-games', async (playerId) => {
        const player = await this.dbWorker.getDbObjectById('players', playerId);
        if (player) {
          const playerGames = player.games;
          if (playerGames) {
            const teamGames = playerGames.team;
            socket.emit('load-team-games', teamGames);
          }
        }
      });
      socket.on('user-signed-in', async (idToken, gameId) => {
        this.debug('Received user-signed-in event');
        let player = null;
        if (gameId) {
          // add user to game if not already added
          this.debug(`Adding user to ${gameId} if not already added`);
          player = await this.dbWorker.addUserToGame(idToken, gameId);
          // TODO: Check this change.
          this.io.to(gameId).emit('player-added-to-game', player, gameId);
        } else {
          // add player to db if not already added
          this.debug('Adding player to db if not already added');
          player = await this.dbWorker.addPlayerToDB(idToken);
        }
        if (player) {
          this.debug(`Send player-exists event for ${player.id}`);
          socket.emit('player-exists', player.id);
        }
      });
      socket.on('verify-player-exists', async (playerId) => {
        this.debug(`Received verify-player-exists event for ${playerId}`);
        const player = await this.dbWorker.getDbObjectById('players', playerId);
        if (player) {
          this.debug(`Send player-exists event for ${playerId}`);
          socket.emit('player-exists', playerId);
        } else {
          this.debug(`Send player-not-found event for ${playerId}`);
          socket.emit('player-not-found', playerId);
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
