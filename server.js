const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const PORT = process.env.PORT || 3000;

app.use(express.static('public'));

let lobbyPlayers = {};          // { socketId: { name, ready } }
let gameStarted = false;

io.on('connection', socket => {
    console.log(`User connected: ${socket.id}`);

    if (Object.keys(lobbyPlayers).length >= 4 || gameStarted) {
        socket.emit('lobbyFull');
        socket.disconnect();
        return;
    }

    // 입장 처리
    lobbyPlayers[socket.id] = { id: socket.id, name: `Player-${socket.id.slice(0, 4)}`, ready: false };
    io.emit('lobbyUpdate', lobbyPlayers);

    // 채팅 메시지
    socket.on('chat', msg => {
        io.emit('chat', { id: socket.id, msg });
    });

    // 준비 버튼
    socket.on('ready', () => {
        if (lobbyPlayers[socket.id]) {
            lobbyPlayers[socket.id].ready = true;
            io.emit('lobbyUpdate', lobbyPlayers);

            // 모든 유저가 준비 완료 시
            const allReady = Object.values(lobbyPlayers).every(p => p.ready);
            if (allReady && Object.keys(lobbyPlayers).length >= 2) {
                gameStarted = true;
                io.emit('gameStart', lobbyPlayers);
            }
        }
    });

    // 연결 종료
    socket.on('disconnect', () => {
        delete lobbyPlayers[socket.id];
        io.emit('lobbyUpdate', lobbyPlayers);
    });
});

http.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
