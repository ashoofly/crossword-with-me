const mockGame = require('./mockGame');
const mockGamePlayers = require('./mockGamePlayers');

module.exports = {
  ...mockGame,
  players: mockGamePlayers,
};
