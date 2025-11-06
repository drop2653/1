const socket = io();
const lobbyDiv = document.getElementById('lobby');
const gameDiv = document.getElementById('game');
const playersDiv = document.getElementById('players');
const readyBtn = document.getElementById('readyBtn');
const chatBox = document.getElementById('chatBox');
const chatInput = document.getElementById('chatInput');

socket.on('connect', () => {
  lobbyDiv.style.display = 'block';
});

socket.on('lobbyUpdate', (players) => {
  playersDiv.innerHTML = '<strong>접속 중인 플레이어:</strong><br>';
  Object.values(players).forEach(p => {
    const score = ` (${p.kills || 0}K / ${p.deaths || 0}D)`;
    playersDiv.innerHTML += `<div class="${p.ready ? 'ready' : ''}">
      ${p.name} ${p.ready ? '✅' : ''} ${score}
    </div>`;
  });
});

socket.on('chat', ({ id, msg }) => {
  const div = document.createElement('div');
  div.textContent = `${id.slice(0, 4)}: ${msg}`;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
});

socket.on('gameStart', (players) => {
  lobbyDiv.style.display = 'none';
  gameDiv.style.display = 'block';
  // 다음 단계에서 게임 로직 삽입 예정
});

socket.on('lobbyFull', () => {
  alert("대기방이 가득 찼습니다.");
});

readyBtn.addEventListener('click', () => {
  socket.emit('ready');
  readyBtn.disabled = true;
  readyBtn.textContent = '대기 중...';
});

chatInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    const msg = chatInput.value;
    if (msg.trim()) {
      socket.emit('chat', msg);
      chatInput.value = '';
    }
  }
});
// 기존 코드 생략...
let canvas, ctx;
let player = null;
let players = {};
let bullets = [];
let alive = true;
let shotSound = null;

socket.on('gameStart', (serverPlayers) => {
  document.getElementById('lobby').style.display = 'none';
  document.getElementById('game').innerHTML = '<canvas id="canvas"></canvas><audio id="shotSound" src="shot.mp3"></audio>';
  canvas = document.getElementById('canvas');
  ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  shotSound = document.getElementById('shotSound');
  players = serverPlayers;
  player = players[socket.id];
  alive = true;
});

document.addEventListener('keydown', e => {
  if (!alive) return;
  if (!player) return;
  const speed = 4;
  if (e.key === 'w') player.y -= speed;
  if (e.key === 's') player.y += speed;
  if (e.key === 'a') player.x -= speed;
  if (e.key === 'd') player.x += speed;
  socket.emit('move', { x: player.x, y: player.y });
});

document.addEventListener('click', e => {
  if (!alive || !player) return;
  const angle = Math.atan2(e.clientY - player.y, e.clientX - player.x);
  socket.emit('shoot', { x: player.x, y: player.y, angle });
  shotSound.currentTime = 0;
  shotSound.play();
});

socket.on('gameState', (state) => {
  players = state.players;
  bullets = state.bullets;
  if (players[socket.id]) {
    player = players[socket.id];
    alive = player.alive;
  }
});

socket.on('gameOver', winnerId => {
  alert(socket.id === winnerId ? "🎉 YOU WIN!" : "💀 YOU LOSE!");
  location.reload();  // 새로고침으로 로비 복귀
});

function draw() {
  if (!ctx || !player) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let id in players) {
    const p = players[id];
    if (!p) continue;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 20, 0, Math.PI * 2);
    ctx.fillStyle = p.alive ? (id === socket.id ? 'white' : 'red') : 'gray';
    ctx.fill();

    // HP
    ctx.fillStyle = 'lime';
    ctx.fillRect(p.x - 20, p.y - 35, (p.hp / 10) * 40, 6);
    ctx.strokeStyle = 'black';
    ctx.strokeRect(p.x - 20, p.y - 35, 40, 6);
  }

  ctx.fillStyle = 'yellow';
  bullets.forEach(b => {
    ctx.beginPath();
    ctx.arc(b.x, b.y, 5, 0, Math.PI * 2);
    ctx.fill();
  });

  requestAnimationFrame(draw);
}

draw();

