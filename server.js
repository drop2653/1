const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const PORT = process.env.PORT || 3000;

app.use(express.static('public'));

let players = {};
let bullets = [];

io.on('connection', socket => {
    console.log('Connected:', socket.id);
    players[socket.id] = { x: 200, y: 200 };

    socket.emit('init', socket.id);

    socket.on('move', pos => {
        if (players[socket.id]) {
            players[socket.id] = pos;
        }
    });

    socket.on('shoot', bullet => {
        bullets.push({ ...bullet, speed: 6 });
    });

    socket.on('disconnect', () => {
        delete players[socket.id];
    });
});

// 매 30fps로 상태 동기화
setInterval(() => {
    // 총알 이동 처리
    bullets.forEach(b => {
        b.x += Math.cos(b.angle) * b.speed;
        b.y += Math.sin(b.angle) * b.speed;
    });

    // 총알 제한
    bullets = bullets.filter(b => b.x >= 0 && b.x <= 1920 && b.y >= 0 && b.y <= 1080);

    io.emit('updatePlayers', players);
    io.emit('updateBullets', bullets);
}, 1000 / 30);

http.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
