let gamePlayers = {};  // 게임에 참여 중인 유저
let bullets = [];
let gameInterval = null;

function startGame() {
    gamePlayers = {};

    for (const id in lobbyPlayers) {
        gamePlayers[id] = {
            id,
            x: 100 + Math.random() * 400,
            y: 100 + Math.random() * 400,
            hp: 10,
            alive: true
            kills: lobbyPlayers[id].kills || 0,
            deaths: lobbyPlayers[id].deaths || 0
        };
    }

    io.emit('gameStart', gamePlayers);

    gameInterval = setInterval(() => {
        // 총알 이동
        bullets.forEach(b => {
            b.x += Math.cos(b.angle) * b.speed;
            b.y += Math.sin(b.angle) * b.speed;
        });

        // 충돌 처리
        bullets = bullets.filter(b => {
            for (let id in gamePlayers) {
                let p = gamePlayers[id];
                if (b.from !== id && p.alive) {
                    const dx = b.x - p.x;
                    const dy = b.y - p.y;
                    if (Math.sqrt(dx * dx + dy * dy) < 20) {
                        p.hp--;
    if (p.hp <= 0) {
        p.alive = false;
        p.deaths += 1;
        if (gamePlayers[b.from]) {
            gamePlayers[b.from].kills += 1;
                    }
                }
            }
            return b.x > 0 && b.x < 1920 && b.y > 0 && b.y < 1080;
        });

        io.emit('gameState', { players: gamePlayers, bullets });

        // 승자 1명 남으면
        const alive = Object.values(gamePlayers).filter(p => p.alive);
        if (alive.length === 1) {
            io.emit('gameOver', alive[0].id);
            resetToLobby();
        }

    }, 1000 / 30);
}

function resetToLobby() {
    clearInterval(gameInterval);
    gameStarted = false;
    bullets = [];
    // 모든 유저 ready false로 초기화
for (let id in lobbyPlayers) {
        lobbyPlayers[id].ready = false;

        if (gamePlayers[id]) {
            lobbyPlayers[id].kills = gamePlayers[id].kills;
            lobbyPlayers[id].deaths = gamePlayers[id].deaths;
    }
    io.emit('lobbyUpdate', lobbyPlayers);
}

io.on('connection', socket => {
    // 이전 코드 생략...

    socket.on('move', pos => {
        if (gamePlayers[socket.id] && gamePlayers[socket.id].alive) {
            gamePlayers[socket.id].x = pos.x;
            gamePlayers[socket.id].y = pos.y;
        }
    });

    socket.on('shoot', data => {
        if (gamePlayers[socket.id] && gamePlayers[socket.id].alive) {
            bullets.push({
                x: data.x,
                y: data.y,
                angle: data.angle,
                from: socket.id,
                speed: 6
            });
        }
    });

    socket.on('ready', () => {
        if (lobbyPlayers[socket.id]) {
            lobbyPlayers[socket.id].ready = true;
            io.emit('lobbyUpdate', lobbyPlayers);

            const allReady = Object.values(lobbyPlayers).every(p => p.ready);
            if (allReady && Object.keys(lobbyPlayers).length >= 2) {
                gameStarted = true;
                startGame();
            }
        }
    });
});

