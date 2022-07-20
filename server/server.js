const io = require('socket.io')(3001, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

io.on("connection", socket => {
  socket.on('get-game', gameId => {
    const data = ""
    socket.join(gameId);
    socket.emit('load-game', data);
    socket.on('send-changes', squareState => {
      socket.to(gameId).emit("receive-changes", squareState);
    });
  });
  console.log("connected");
});

