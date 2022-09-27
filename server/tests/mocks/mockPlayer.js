const newPlayer = {
  displayName: 'Best Bud',
  email: 'bestbud@gmail.com',
  id: 'abc123',
  photoURL: 'https://examplephoto.com',
};

const addedPlayer = {
  displayName: 'Second Pal',
  email: 'secondPal@gmail.com',
  id: 'xyz987',
  photoURL: 'https://examplephoto2.com',
};

const playerNoGames = {
  id: 'playerNoGames',
};

const playerDifTeamGame = {
  id: 'playerDifTeamGame',
  games: {
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
    },
  },
};

const onlyTeamPlayer = {
  displayName: 'Best Bud',
  email: 'bestbud@gmail.com',
  id: 'rebelplayer123',
  photoURL: 'https://examplephoto.com',
  games: {
    team: {
      'e27dd721-a9fd-4f95-97ae-b4bfa939e7df': {
        date: '9/15/2022',
        dow: 'Thursday',
        friend: {
          displayName: 'Me My',
          playerId: 'lskafjldf3',
        },
        gameId: 'e27dd721-a9fd-4f95-97ae-b4bfa939e7df',
      },
    },
  },
};

const ownsMondayGamePlayer = {
  displayName: 'Best Bud',
  email: 'bestbud@gmail.com',
  id: 'ownsMondayGamePlayer',
  photoURL: 'https://examplephoto.com',
  games: {
    owner: {
      Monday: 'alsdkfjalksdjf',
    },
  },
};

const ownsFridayGamePlayer = {
  displayName: 'Best Bud',
  email: 'bestbud@gmail.com',
  id: 'ownsFridayGamePlayer',
  photoURL: 'https://examplephoto.com',
  games: {
    owner: {
      Friday: 'alsdkfjalksdjf',
    },
  },
};

module.exports = {
  newPlayer,
  addedPlayer,
  onlyTeamPlayer,
  ownsMondayGamePlayer,
  ownsFridayGamePlayer,
  playerNoGames,
  playerDifTeamGame,
};
