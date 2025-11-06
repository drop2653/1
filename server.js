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
    players[socket.id] = { id: socket.id, x: 200, y: 200, hp: 10 };

    socket.emit('init', socket.id);

    socket.on('move', pos => {
        if (players[socket.id]) {
            players[socket.id].x = pos.x;
            players[socket.id].y = pos.y;
        }
    });

    socket.on('shoot', bullet => {
        bullets.push({ ...bullet, speed: 6, from: socket.id });
    });

    socket.on('disconnect', () => {
        delete players[socket.id];
    });
});

// 충돌 판정 + 상태 전송
setInterval(() => {
    bullets.forEach((b, i) => {
        b.x += Math.cos(b.angle) * b.speed;
        b.y += Math.sin(b.angle) * b.speed;

        // 충돌 판정
        for (let id in players) {
            const p = players[id];
            if (id !== b.from && p.hp > 0) {
                const dx = b.x - p.x;
                const dy = b.y - p.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 20) {
                    p.hp -= 1;
                    bullets.splice(i, 1);
                    break;
                }
            }
        }
    });

    // 화면 밖 제거
    bullets = bullets.filter(b => b.x >= 0 && b.x <= 1920 && b.y >= 0 && b.y <= 1080);

    io.emit('updatePlayers', players);
    io.emit('updateBullets', bullets);
}, 1000 / 30);

http.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
