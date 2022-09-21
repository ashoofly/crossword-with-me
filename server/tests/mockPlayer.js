const newPlayer = {
  displayName: 'Best Bud',
  email: 'bestbud@gmail.com',
  id: 'abc123',
  photoURL: 'https://examplephoto.com',
};

const onlyTeamPlayer = {
  displayName: 'Best Bud',
  email: 'bestbud@gmail.com',
  id: 'abc123',
  photoURL: 'https://examplephoto.com',
  games: {
    team: {
      alsdjfasdf: {
        date: '9/15/2022',
        dow: 'Thursday',
        friend: {
          displayName: 'Me My',
          playerId: 'lskafjldf3',
        },
        gameId: 'sflaskdfksjdfad',
      },
    },
  },
};

const ownsMondayGamePlayer = {
  displayName: 'Best Bud',
  email: 'bestbud@gmail.com',
  id: 'abc123',
  photoURL: 'https://examplephoto.com',
  games: {
    owner: {
      Monday: 'alsdkfjalksdjf',
    },
  },
};

module.exports = {
  newPlayer,
  onlyTeamPlayer,
  ownsMondayGamePlayer,
};
