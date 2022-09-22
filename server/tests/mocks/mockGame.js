const GameConfig = require('../../components/GameConfig');
const puzzle = require('./mockPuzzle');
const { newPlayer: player } = require('./mockPlayer');

module.exports = {
  gameId: 'e27dd721-a9fd-4f95-97ae-b4bfa939e7df',
  savedBoardToDB: true,
  autocheck: false,
  advanceCursor: 0,
  players: [{
    playerId: player.id,
    photoURL: player.photoURL,
    displayName: player.displayName,
    owner: true,
    color: GameConfig.defaultPlayerColors[0],
  }],
  board: [...Array(puzzle.size.rows * puzzle.size.cols).keys()].map((num) => ({
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
};
