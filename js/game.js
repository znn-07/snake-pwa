(function () {
  'use strict';

  const GRID_SIZE = 20;
  const TILE_COUNT = GRID_SIZE * GRID_SIZE;

  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');
  const scoreEl = document.getElementById('score');
  const highScoreEl = document.getElementById('high-score');
  const overlay = document.getElementById('overlay');
  const overlayTitle = document.getElementById('overlay-title');
  const overlayMsg = document.getElementById('overlay-message');
  const restartBtn = document.getElementById('restart-btn');
  const upBtn = document.getElementById('up-btn');
  const downBtn = document.getElementById('down-btn');
  const leftBtn = document.getElementById('left-btn');
  const rightBtn = document.getElementById('right-btn');

  let w, tileSize;
  function resize() {
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    w = rect.width;
    canvas.width = w * dpr;
    canvas.height = w * dpr;
    tileSize = w / GRID_SIZE;
    ctx.scale(dpr, dpr);
  }
  window.addEventListener('resize', resize);

  let snake, direction, nextDirection, food, score, highScore, gameOver, paused, win, gameLoop;

  function init() {
    const mid = Math.floor(GRID_SIZE / 2);
    snake = [
      { x: mid, y: mid },
      { x: mid - 1, y: mid },
      { x: mid - 2, y: mid },
    ];
    direction = { x: 1, y: 0 };
    nextDirection = { x: 1, y: 0 };
    score = 0;
    gameOver = false;
    paused = true;
    win = false;
    highScore = parseInt(localStorage.getItem('snake-high-score') || '0', 10);
    highScoreEl.textContent = highScore;
    spawnFood();
    showOverlay('🐍 貪吃蛇', '按空白鍵或點擊開始');
  }

  function spawnFood() {
    const occupied = new Set(snake.map(s => `${s.x},${s.y}`));
    const free = [];
    for (let i = 0; i < GRID_SIZE; i++) {
      for (let j = 0; j < GRID_SIZE; j++) {
        if (!occupied.has(`${i},${j}`)) free.push({ x: i, y: j });
      }
    }
    if (free.length === 0) {
      win = true;
      gameOver = true;
      showOverlay('🎉 你贏了！', `滿分 ${score} 分！`);
      return;
    }
    food = free[Math.floor(Math.random() * free.length)];
  }

  function showOverlay(title, msg) {
    overlayTitle.textContent = title;
    overlayMsg.textContent = msg;
    overlay.classList.remove('hidden');
  }

  function hideOverlay() {
    overlay.classList.add('hidden');
  }

  function startGame() {
    if (!paused && !gameOver) return;
    if (gameOver) {
      init();
    }
    paused = false;
    gameOver = false;
    hideOverlay();
  }

  function update() {
    if (paused || gameOver) return;

    direction = { ...nextDirection };
    const head = snake[0];
    const nx = head.x + direction.x;
    const ny = head.y + direction.y;

    // wall collision
    if (nx < 0 || nx >= GRID_SIZE || ny < 0 || ny >= GRID_SIZE) {
      endGame();
      return;
    }

    // self collision
    for (let i = 0; i < snake.length; i++) {
      if (snake[i].x === nx && snake[i].y === ny) {
        endGame();
        return;
      }
    }

    snake.unshift({ x: nx, y: ny });

    if (nx === food.x && ny === food.y) {
      score++;
      scoreEl.textContent = score;
      if (score > highScore) {
        highScore = score;
        highScoreEl.textContent = highScore;
        localStorage.setItem('snake-high-score', String(highScore));
      }
      spawnFood();
    } else {
      snake.pop();
    }
  }

  function endGame() {
    gameOver = true;
    if (score > highScore) {
      highScore = score;
      highScoreEl.textContent = highScore;
      localStorage.setItem('snake-high-score', String(highScore));
    }
    showOverlay('💀 遊戲結束', `得分: ${score}  最高: ${highScore}`);
  }

  function draw() {
    ctx.clearRect(0, 0, w, w);

    // grid
    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(i * tileSize, 0);
      ctx.lineTo(i * tileSize, w);
      ctx.stroke();
      ctx.moveTo(0, i * tileSize);
      ctx.lineTo(w, i * tileSize);
      ctx.stroke();
    }

    // food
    ctx.fillStyle = '#e94560';
    const fx = food.x * tileSize + tileSize / 2;
    const fy = food.y * tileSize + tileSize / 2;
    ctx.beginPath();
    ctx.arc(fx, fy, tileSize * 0.4, 0, Math.PI * 2);
    ctx.fill();

    // snake
    snake.forEach((seg, i) => {
      const t = i / snake.length;
      const r = Math.round(30 + t * 70);
      const g = Math.round(200 - t * 100);
      const b = Math.round(80 - t * 40);
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      const pad = 1;
      ctx.beginPath();
      ctx.roundRect(
        seg.x * tileSize + pad,
        seg.y * tileSize + pad,
        tileSize - pad * 2,
        tileSize - pad * 2,
        3
      );
      ctx.fill();
    });
  }

  function gameTick() {
    update();
    draw();
  }

  function loop() {
    gameTick();
    const speed = Math.max(50, 150 - snake.length * 2);
    gameLoop = setTimeout(loop, speed);
  }

  // --- Controls ---
  function setDirection(dx, dy) {
    if (dx === -direction.x && dy === -direction.y) return;
    if (dx === direction.x && dy === direction.y) return;
    nextDirection = { x: dx, y: dy };
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      if (gameOver) {
        init();
        startGame();
      } else {
        startGame();
      }
      return;
    }
    if (paused || gameOver) return;
    switch (e.key) {
      case 'ArrowUp': e.preventDefault(); setDirection(0, -1); break;
      case 'ArrowDown': e.preventDefault(); setDirection(0, 1); break;
      case 'ArrowLeft': e.preventDefault(); setDirection(-1, 0); break;
      case 'ArrowRight': e.preventDefault(); setDirection(1, 0); break;
    }
  });

  canvas.addEventListener('click', () => {
    if (gameOver) {
      init();
      startGame();
    } else {
      startGame();
    }
  });

  restartBtn.addEventListener('click', () => {
    init();
    startGame();
  });

  upBtn.addEventListener('click', () => setDirection(0, -1));
  downBtn.addEventListener('click', () => setDirection(0, 1));
  leftBtn.addEventListener('click', () => setDirection(-1, 0));
  rightBtn.addEventListener('click', () => setDirection(1, 0));

  // touch swipe
  let touchStart = null;
  canvas.addEventListener('touchstart', (e) => {
    const t = e.touches[0];
    touchStart = { x: t.clientX, y: t.clientY };
  }, { passive: true });

  canvas.addEventListener('touchend', (e) => {
    if (!touchStart) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStart.x;
    const dy = t.clientY - touchStart.y;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);
    if (Math.max(absDx, absDy) < 20) {
      // tap
      if (gameOver) { init(); startGame(); }
      else { startGame(); }
      return;
    }
    if (absDx > absDy) {
      setDirection(dx > 0 ? 1 : -1, 0);
    } else {
      setDirection(0, dy > 0 ? 1 : -1);
    }
  }, { passive: true });

  // --- Service Worker ---
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js');
  }

  // --- Polyfill roundRect ---
  if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
      if (r > w / 2) r = w / 2;
      if (r > h / 2) r = h / 2;
      this.moveTo(x + r, y);
      this.arcTo(x + w, y, x + w, y + h, r);
      this.arcTo(x + w, y + h, x, y + h, r);
      this.arcTo(x, y + h, x, y, r);
      this.arcTo(x, y, x + w, y, r);
    };
  }

  // --- Init ---
  resize();
  init();
  loop();
})();
