const express = require('express');
const app = express();
const http = require('http').Server(app);
const PORT = process.env.PORT || 3000;
const io = require('socket.io')(http);

app.use(express.static('public'));

let players = {};

io.on('connection', socket => {
    console.log('User connected:', socket.id);
    
    if (Object.keys(players).length < 2) {
        players[socket.id] = {
            id: socket.id,
            x: 0,
            y: 0
        };
        socket.emit('currentPlayers', players);
        socket.broadcast.emit('newPlayer', players[socket.id]);
    }

    socket.on('shoot', (data) => {
        socket.broadcast.emit('enemyShot', data);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        delete players[socket.id];
        io.emit('playerDisconnected', socket.id);
    });
});

http.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});