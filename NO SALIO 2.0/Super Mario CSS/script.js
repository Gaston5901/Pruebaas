const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// --- Audio ----------------------------------------------------
// ── Audio ─────────────────────────────────────────────────────
const bgMusic = new Audio("background_music.mp3");

bgMusic.loop = true;
bgMusic.volume = 0.4;
bgMusic.preload = "auto";

const stompSound = new Audio("Stomp.mp3");

stompSound.volume = 0.7;

canvas.width = 800;
canvas.height = 464;

// ── HUD elements ──────────────────────────────────────────────────────────────
const scoreEl  = document.getElementById('score');
const livesEl  = document.getElementById('lives');
const coinsEl  = document.getElementById('coins');
const timerEl  = document.getElementById('timer');
const overlay  = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlay-title');
const overlayMsg   = document.getElementById('overlay-msg');
const overlayBtn   = document.getElementById('overlay-btn');

// ── Constants ─────────────────────────────────────────────────────────────────
const GRAVITY      = 0.5;
const TILE         = 32;
const GROUND_Y     = canvas.height - TILE;   // y of the top surface of ground
const CAM_DEADZONE = 300;                     // pixels from left before camera moves

// ── Colour palette ────────────────────────────────────────────────────────────
const C = {
  sky:      '#5c94fc',
  ground:   '#c84c0c',
  groundTop:'#e86818',
  brick:    '#c84c0c',
  brickTop: '#e86818',
  question: '#e8a000',
  qShine:   '#f8c800',
  coin:     '#f8c800',
  coinRim:  '#c89600',
  mario:    { hat:'#e52521', skin:'#ffa060', overalls:'#0070e0', shoes:'#7b3f00' },
  goomba:   { body:'#c07038', dark:'#7b3000', eye:'#fff', pupil:'#000' },
  pipe:     { body:'#00a800', rim:'#00d800', dark:'#006800' },
  flag:     { pole:'#888', flag:'#e52521' },
  cloud:    '#fff',
  hill:     '#00a800',
};

// ── World definition ──────────────────────────────────────────────────────────
// Level is 6400 px wide (200 tiles × 32)
const WORLD_W = 200 * TILE;

// Platforms: { x, y, w } in tile units
const platformDefs = [
  // floating bricks / question blocks – row at tile-y 8 (y=256)
  { x:16, y:8, w:1, type:'question', coinVal:1 },
  { x:20, y:8, w:1, type:'question', coinVal:1 },
  { x:21, y:8, w:1, type:'brick' },
  { x:22, y:8, w:1, type:'question', coinVal:1 },
  { x:23, y:8, w:1, type:'brick' },
  // staircase hint
  { x:28, y:11, w:4, type:'brick' },
  { x:28, y:9,  w:2, type:'question', coinVal:1 },
  // more blocks
  { x:37, y:8, w:1, type:'question', coinVal:5 },
  { x:40, y:6, w:3, type:'brick' },
  { x:44, y:8, w:1, type:'question', coinVal:1 },
  { x:46, y:8, w:3, type:'brick' },
  { x:47, y:6, w:1, type:'question', coinVal:1 },
  // overhead row
  { x:57, y:6, w:5, type:'brick' },
  { x:60, y:8, w:1, type:'question', coinVal:1 },
  // platform islands
  { x:70, y:10, w:3, type:'brick' },
  { x:80, y:8,  w:4, type:'brick' },
  { x:85, y:6,  w:2, type:'question', coinVal:2 },
  { x:95, y:8,  w:5, type:'brick' },
  { x:100,y:6,  w:3, type:'question', coinVal:3 },
  { x:110,y:9,  w:4, type:'brick' },
  { x:120,y:7,  w:3, type:'brick' },
  { x:130,y:8,  w:4, type:'question', coinVal:2 },
  { x:140,y:7,  w:5, type:'brick' },
  { x:150,y:9,  w:3, type:'brick' },
  { x:160,y:6,  w:4, type:'question', coinVal:3 },
  { x:170,y:8,  w:4, type:'brick' },
  { x:180,y:7,  w:3, type:'question', coinVal:2 },
];

// Pipes: { x, h } in tile units (x = left edge, h = height in tiles)
const pipeDefs = [
  { x:14, h:2 }, { x:24, h:3 }, { x:31, h:4 }, { x:36, h:4 },
  { x:55, h:2 }, { x:67, h:3 }, { x:90, h:2 }, { x:105, h:3 },
  { x:118, h:2 }, { x:135, h:4 }, { x:148, h:3 }, { x:165, h:2 },
  { x:178, h:3 }, { x:190, h:2 },
];

// Staircases at end: groups of stacked blocks
const stairDefs = [
  { x:187, maxH:4 }, { x:193, maxH:8 },
];

// Gaps (holes in the ground): { x, w } in tile units
const gapDefs = [
  { x:50, w:3 }, { x:75, w:3 }, { x:115, w:4 }, { x:155, w:3 }, { x:175, w:2 },
];

// Enemies: { x, dir } in tile units
const enemyDefs = [
  { x:22 },{ x:30 },{ x:38 },{ x:48 },{ x:58 },{ x:65 },
  { x:72 },{ x:83 },{ x:92 },{ x:103 },{ x:112 },{ x:123 },
  { x:133 },{ x:143 },{ x:152 },{ x:162 },{ x:173 },{ x:182 },
];

// Coins on platforms: { x, y } in tile units
const coinDefs = [
  { x:17, y:7 },{ x:21, y:7 },{ x:41, y:5 },{ x:47, y:5 },
  { x:57, y:5 },{ x:58, y:5 },{ x:59, y:5 },{ x:70, y:9 },
  { x:80, y:7 },{ x:95, y:7 },{ x:100, y:5 },{ x:120, y:6 },
  { x:130, y:7 },{ x:140, y:6 },{ x:160, y:5 },{ x:180, y:6 },
];

// Clouds (decorative): { x, y } tile units
const cloudDefs = [
  { x:5,  y:3 },{ x:18, y:2 },{ x:35, y:4 },{ x:50, y:2 },
  { x:65, y:3 },{ x:80, y:2 },{ x:95, y:4 },{ x:110,y:2 },
  { x:125,y:3 },{ x:140,y:2 },{ x:155,y:4 },{ x:170,y:2 },
  { x:185,y:3 },
];

// Hills (decorative)
const hillDefs = [
  { x:2, r:50 },{ x:10, r:40 },{ x:20, r:60 },{ x:35, r:45 },
  { x:55, r:55 },{ x:70, r:40 },{ x:90, r:50 },{ x:110, r:45 },
  { x:130, r:60 },{ x:150, r:40 },{ x:170, r:55 },{ x:185, r:45 },
];

// Flag at end
const FLAG_X = 195;

// ── Game state ────────────────────────────────────────────────────────────────
let state = 'title'; // title | playing | dead | win | gameover
let score = 0;
let lives = 3;
let coinCount = 0;
let timeLeft = 400;
let timerInterval = null;
let camX = 0;

let mario, platforms, pipes, enemies, coins, particles;

// ── Particle system ───────────────────────────────────────────────────────────
function spawnParticles(x, y, color, n = 6) {
  for (let i = 0; i < n; i++) {
    particles.push({
      x, y,
      vx: (Math.random() - 0.5) * 5,
      vy: -(Math.random() * 4 + 2),
      life: 40,
      color,
      r: Math.random() * 4 + 2,
    });
  }
}

function updateParticles() {
  for (let p of particles) {
    p.x  += p.vx;
    p.y  += p.vy;
    p.vy += 0.2;
    p.life--;
  }
  particles = particles.filter(p => p.life > 0);
}

function drawParticles(cx) {
  for (let p of particles) {
    ctx.globalAlpha = p.life / 40;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x - cx, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

// ── Init / reset ──────────────────────────────────────────────────────────────
function initGame() {
  score     = 0;
  coinCount = 0;
  timeLeft  = 400;
  camX      = 0;
  particles = [];
  pendingSuperJump = false;
  lastJumpTapTime  = 0;
  superFlash       = 0;

  scoreEl.textContent = '000000';
  coinsEl.textContent = '0';
  timerEl.textContent = '400';
  livesEl.textContent = lives;

  mario = {
    x: 3 * TILE,
    y: GROUND_Y - 2 * TILE,
    w: 24,
    h: 32,
    vx: 0,
    vy: 0,
    onGround: false,
    dir: 1,          // 1=right, -1=left
    walking: false,
    frame: 0,
    frameTimer: 0,
    dead: false,
    deadTimer: 0,
    invincible: 0,   // invincibility frames after damage
  };

  // Build platforms from defs
  platforms = platformDefs.map(p => ({
    x: p.x * TILE,
    y: p.y * TILE,
    w: p.w * TILE,
    h: TILE,
    type: p.type,
    coinVal: p.coinVal || 0,
    hit: false,
    bounce: 0,
  }));

  // Build pipes
  pipes = pipeDefs.map(p => ({
    x: p.x * TILE,
    y: GROUND_Y - p.h * TILE,
    w: 2 * TILE,
    h: p.h * TILE,
  }));

  // Build staircase blocks
  for (let s of stairDefs) {
    for (let col = 0; col < s.maxH; col++) {
      for (let row = 0; row <= col; row++) {
        platforms.push({
          x: (s.x + col) * TILE,
          y: GROUND_Y - (row + 1) * TILE,
          w: TILE,
          h: TILE,
          type: 'brick',
          coinVal: 0,
          hit: false,
          bounce: 0,
        });
      }
    }
  }

  // Build enemies
  enemies = enemyDefs.map(e => ({
    x: e.x * TILE,
    y: GROUND_Y - TILE,
    w: TILE - 4,
    h: TILE - 6,
    vx: -1,
    dead: false,
    squished: false,
    squishTimer: 0,
    frame: 0,
    frameTimer: 0,
  }));

  // Build coins
  coins = coinDefs.map(c => ({
    x: c.x * TILE + TILE / 2,
    y: c.y * TILE + TILE / 2,
    r: 8,
    collected: false,
    anim: 0,
  }));

  // Build gaps as a lookup set of tile-x coords that have no ground
  // (handled at draw/collision time)
}

// ── Gap helpers ───────────────────────────────────────────────────────────────
function isGap(worldX) {
  for (let g of gapDefs) {
    if (worldX >= g.x * TILE && worldX < (g.x + g.w) * TILE) return true;
  }
  return false;
}

// ── Input ─────────────────────────────────────────────────────────────────────
const keys = {};
const JUMP_KEYS = ['Space','ArrowUp','KeyW'];
const DOUBLE_TAP_MS = 400;
let lastJumpTapTime = 0;
let pendingSuperJump = false;
let superFlash = 0; // frames remaining for on-screen "SUPER!" indicator

window.addEventListener('keydown', e => {
  if (JUMP_KEYS.includes(e.code) && !e.repeat) {
    const now = performance.now();
    // Double-tap detection
    if (now - lastJumpTapTime < DOUBLE_TAP_MS) {
      pendingSuperJump = true;
    }
    // Shift held + jump also triggers super jump (fallback trigger)
    if (keys['ShiftLeft'] || keys['ShiftRight']) {
      pendingSuperJump = true;
    }
    lastJumpTapTime = now;
  }
  keys[e.code] = true;
  if (['Space','ArrowUp','ArrowLeft','ArrowRight','ArrowDown',
       'KeyW','KeyA','KeyD','KeyS'].includes(e.code)) {
    e.preventDefault();
  }
});
window.addEventListener('keyup', e => { keys[e.code] = false; });

function isLeft()  { return keys['ArrowLeft']  || keys['KeyA']; }
function isRight() { return keys['ArrowRight'] || keys['KeyD']; }
function isJump()  { return keys['Space'] || keys['ArrowUp'] || keys['KeyW']; }

// ── Physics / collision ───────────────────────────────────────────────────────
function rectOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

function isOverlappingSolid(x, y) {
  for (let p of pipes) {
    if (rectOverlap(x, y, mario.w, mario.h, p.x, p.y, p.w, p.h)) return true;
  }
  for (let p of platforms) {
    if (rectOverlap(x, y, mario.w, mario.h, p.x, p.y, p.w, p.h)) return true;
  }
  return false;
}

function updateMario() {
  if (mario.dead) {
    mario.deadTimer++;
    if (mario.deadTimer < 20) {
      mario.vy = -8;
    }
    mario.vy += GRAVITY;
    mario.y  += mario.vy;
    if (mario.y > canvas.height + 100) {
      lives--;
      if (lives <= 0) {
        endGame('gameover');
      } else {
        livesEl.textContent = lives;
        initGame();
        state = 'playing';
        startTimer();
      }
    }
    return;
  }

  if (mario.invincible > 0) mario.invincible--;

  // Horizontal movement
  const speed = 3.5;
  if (isLeft()) {
    mario.vx = -speed;
    mario.dir = -1;
    mario.walking = true;
  } else if (isRight()) {
    mario.vx = speed;
    mario.dir = 1;
    mario.walking = true;
  } else {
    mario.vx = 0;
    mario.walking = false;
  }

  mario.x += mario.vx;

  // World bounds
  if (mario.x < 0) mario.x = 0;
  if (mario.x + mario.w > WORLD_W) mario.x = WORLD_W - mario.w;

  // Gravity
  mario.vy += GRAVITY;
  mario.y  += mario.vy;
  mario.onGround = false;

  // Ceiling clamp so Mario can never leave the top of the screen
  if (mario.y < 0) {
    mario.y = 0;
    if (mario.vy < 0) mario.vy = 0;
  }

  // Ground collision
  const mx1 = mario.x, mx2 = mario.x + mario.w;
  const groundTileLeft  = Math.floor(mx1 / TILE);
  const groundTileRight = Math.floor((mx2 - 1) / TILE);

  const feetY = mario.y + mario.h;
  if (mario.vy >= 0) {
    // Check if any tile under feet is ground (not a gap)
    let onGround = false;
    for (let tx = groundTileLeft; tx <= groundTileRight; tx++) {
      if (!isGap(tx * TILE)) {
        onGround = true;
        break;
      }
    }
    if (onGround && feetY >= GROUND_Y && mario.y < GROUND_Y) {
      mario.y = GROUND_Y - mario.h;
      mario.vy = 0;
      mario.onGround = true;
    }
  }

  // Fall into gap → die
  if (mario.y > canvas.height + 50 && !mario.dead) {
    killMario();
    return;
  }

  // Platform collisions
  for (let p of platforms) {
    if (!rectOverlap(mario.x, mario.y, mario.w, mario.h, p.x, p.y, p.w, p.h)) continue;

    const overlapLeft   = (mario.x + mario.w) - p.x;
    const overlapRight  = (p.x + p.w) - mario.x;
    const overlapTop    = (mario.y + mario.h) - p.y;
    const overlapBottom = (p.y + p.h) - mario.y;

    const minH = Math.min(overlapLeft, overlapRight);
    const minV = Math.min(overlapTop, overlapBottom);

    if (minV < minH) {
      if (overlapTop < overlapBottom) {
        // Mario lands on top
        mario.y = p.y - mario.h;
        mario.vy = 0;
        mario.onGround = true;
      } else {
        // Mario hits bottom (head bump)
        mario.y = p.y + p.h;
        mario.vy = Math.abs(mario.vy) * 0.3;
        hitBlock(p);
      }
    } else {
      if (overlapLeft < overlapRight) {
        mario.x = p.x - mario.w;
      } else {
        mario.x = p.x + p.w;
      }
      mario.vx = 0;
    }
  }

  // Pipe collisions (solid)
  for (let p of pipes) {
    if (!rectOverlap(mario.x, mario.y, mario.w, mario.h, p.x, p.y, p.w, p.h)) continue;

    const overlapLeft   = (mario.x + mario.w) - p.x;
    const overlapRight  = (p.x + p.w) - mario.x;
    const overlapTop    = (mario.y + mario.h) - p.y;
    const overlapBottom = (p.y + p.h) - mario.y;
    const minH = Math.min(overlapLeft, overlapRight);
    const minV = Math.min(overlapTop, overlapBottom);

    if (minV < minH) {
      if (overlapTop < overlapBottom) {
        mario.y = p.y - mario.h;
        mario.vy = 0;
        mario.onGround = true;
      } else {
        mario.y = p.y + p.h;
        mario.vy = Math.abs(mario.vy) * 0.3;
      }
    } else {
      if (overlapLeft < overlapRight) mario.x = p.x - mario.w;
      else mario.x = p.x + p.w;
      mario.vx = 0;
    }
  }

  // Super jump (double-tap jump or Shift+jump): escapes wedges
  if (pendingSuperJump) {
    // Free Mario from any horizontal wedge: nudge up at most ~half a tile
    let safety = 0;
    while (safety++ < 8 && isOverlappingSolid(mario.x, mario.y)) {
      mario.y -= 2;
    }
    mario.vy = -12;
    mario.onGround = false;
    pendingSuperJump = false;
    superFlash = 45;
    spawnParticles(mario.x + mario.w / 2, mario.y + mario.h, '#fff', 16);
    spawnParticles(mario.x + mario.w / 2, mario.y + mario.h, C.qShine, 10);
  } else if (isJump() && mario.onGround) {
    // Normal jump
    mario.vy = -11;
    mario.onGround = false;
  }

  // Coin collection
  for (let c of coins) {
    if (c.collected) continue;
    const dx = (mario.x + mario.w / 2) - c.x;
    const dy = (mario.y + mario.h / 2) - c.y;
    if (Math.abs(dx) < mario.w / 2 + c.r && Math.abs(dy) < mario.h / 2 + c.r) {
      c.collected = true;
      coinCount++;
      addScore(200);
      coinsEl.textContent = coinCount;
      spawnParticles(c.x, c.y, C.coin);
    }
  }

  // Enemy collisions
  for (let e of enemies) {
    if (e.dead) continue;
    if (!rectOverlap(mario.x, mario.y, mario.w, mario.h, e.x, e.y, e.w, e.h)) continue;

    const mBottom = mario.y + mario.h;
    const eTop    = e.y;

    // Stomp from above
    if (mario.vy > 0 && mBottom - mario.vy <= eTop + 4) {

      const stomp = new Audio("stomp.mp3");
stomp.volume = 0.8;
stomp.play();

      e.dead = true;
      e.squished = true;
      e.squishTimer = 30;
      mario.vy = -6;
      addScore(100);
      spawnParticles(e.x + e.w / 2, e.y, C.goomba.body);
    } else if (mario.invincible === 0) {
      killMario();
      return;
    }
  }

  // Flag / win
  const flagX = FLAG_X * TILE;
  if (mario.x + mario.w > flagX && mario.x < flagX + TILE * 2) {
    endGame('win');
  }

  // Walking animation
  if (mario.walking && mario.onGround) {
    mario.frameTimer++;
    if (mario.frameTimer > 6) { mario.frame = (mario.frame + 1) % 3; mario.frameTimer = 0; }
  } else if (!mario.walking) {
    mario.frame = 0;
  }

  // Camera
  const targetCam = mario.x - CAM_DEADZONE;
  if (targetCam > camX) camX = Math.min(targetCam, WORLD_W - canvas.width);
  if (camX < 0) camX = 0;
}

function hitBlock(p) {
  if (p.hit) return;
  if (p.type === 'question') {
    p.hit = true;
    p.bounce = 8;
    // Spawn coin from block
    coinCount += p.coinVal;

     // Play coin sound
  const coinSound = new Audio("coin.mp3");
  coinSound.volume = 0.7;
  coinSound.play();

    addScore(p.coinVal * 200);
    coinsEl.textContent = coinCount;
    spawnParticles(p.x + p.w / 2, p.y, C.coin, p.coinVal * 3);
  } else if (p.type === 'brick') {
    // Break brick
    p.hit = true;
    spawnParticles(p.x + p.w / 2, p.y, C.brick, 8);
    platforms.splice(platforms.indexOf(p), 1);
    addScore(50);
  }
}

function killMario() {

  bgMusic.pause();
   // Play death sound
  const deathSound = new Audio("death.mp3");
  deathSound.volume = 0.8;
  deathSound.currentTime = 1;
  deathSound.play();

  if (mario.dead || mario.invincible > 0) return;


  mario.dead = true;
  mario.deadTimer = 0;
  mario.vy = -12;
  stopTimer();

  setTimeout(() => {

    // Optional reset
    bgMusic.currentTime = 0;

    bgMusic.play();

  }, 4000);
}

function addScore(n) {
  score += n;
  scoreEl.textContent = String(score).padStart(6, '0');
}

// ── Enemy update ──────────────────────────────────────────────────────────────
function updateEnemies() {
  for (let e of enemies) {
    if (e.squished) {
      e.squishTimer--;
      if (e.squishTimer <= 0) e.dead = true;
      continue;
    }
    if (e.dead) continue;

    e.x += e.vx;

    // Ground check
    const eTileLeft  = Math.floor(e.x / TILE);
    const eTileRight = Math.floor((e.x + e.w - 1) / TILE);
    const aheadTile  = e.vx < 0 ? eTileLeft - 1 : eTileRight + 1;

    // Reverse at gap edge or world edge
    if (isGap(aheadTile * TILE) || e.x <= 0 || e.x + e.w >= WORLD_W) {
      e.vx = -e.vx;
    }

    // Reverse at pipes / platforms
    for (let p of pipes) {
      if (rectOverlap(e.x, e.y, e.w, e.h, p.x, p.y, p.w, p.h)) {
        e.vx = -e.vx;
        e.x += e.vx * 2;
        break;
      }
    }

    // Keep on ground surface
    e.y = GROUND_Y - e.h;

    // Anim
    e.frameTimer++;
    if (e.frameTimer > 10) { e.frame = (e.frame + 1) % 2; e.frameTimer = 0; }
  }
}

// ── Timer ─────────────────────────────────────────────────────────────────────
function startTimer() {
  stopTimer();
  timerInterval = setInterval(() => {
    if (state !== 'playing') return;
    timeLeft--;
    timerEl.textContent = timeLeft;
    if (timeLeft <= 0) killMario();
  }, 1000);
}

function stopTimer() {
  if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
}

// ── End game ──────────────────────────────────────────────────────────────────
function endGame(result) {
  state = result;
  stopTimer();
  if (result === 'win') {
    bgMusic.pause();
    const winSound = new Audio("win.mp3");
winSound.play();
    addScore(timeLeft * 50);
    showOverlay('YOU WIN!', `Score: ${score}\nCoins: ${coinCount}`, 'PLAY AGAIN');
  } else {
    lives = 3;
    showOverlay('GAME OVER', `Final Score: ${score}`, 'TRY AGAIN');
  }
}

function showOverlay(title, msg, btn) {
  overlayTitle.textContent = title;
  overlayMsg.innerHTML = msg.replace(/\n/g, '<br>');
  overlayBtn.textContent = btn;
  overlay.classList.remove('hidden');
}

// ── Drawing ───────────────────────────────────────────────────────────────────
function drawBackground(cx) {
  ctx.fillStyle = C.sky;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Hills
  ctx.fillStyle = C.hill;
  for (let h of hillDefs) {
    const hx = h.x * TILE - cx;
    if (hx < -h.r * 2 || hx > canvas.width + h.r * 2) continue;
    ctx.beginPath();
    ctx.arc(hx, GROUND_Y, h.r, Math.PI, 0);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(hx - h.r * 0.6, GROUND_Y, h.r * 0.5, Math.PI, 0);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(hx + h.r * 0.7, GROUND_Y, h.r * 0.45, Math.PI, 0);
    ctx.fill();
  }

  // Clouds
  ctx.fillStyle = C.cloud;
  for (let cl of cloudDefs) {
    const cldx = cl.x * TILE - cx * 0.5; // parallax
    const cldy = cl.y * TILE;
    if (cldx < -120 || cldx > canvas.width + 120) continue;
    drawCloud(cldx, cldy);
  }
}

function drawCloud(x, y) {
  ctx.beginPath();
  ctx.arc(x,       y, 20, Math.PI, 0);
  ctx.arc(x + 20,  y - 12, 26, Math.PI, 0);
  ctx.arc(x + 50,  y, 20, Math.PI, 0);
  ctx.closePath();
  ctx.fill();
}

function drawGround(cx) {
  for (let tx = Math.floor(cx / TILE); tx <= Math.floor((cx + canvas.width) / TILE) + 1; tx++) {
    if (isGap(tx * TILE)) continue;
    const sx = tx * TILE - cx;
    // Top surface row
    ctx.fillStyle = C.groundTop;
    ctx.fillRect(sx, GROUND_Y, TILE, 6);
    // Body
    ctx.fillStyle = C.ground;
    ctx.fillRect(sx, GROUND_Y + 6, TILE, TILE - 6);
    // Grid lines
    ctx.strokeStyle = '#a03808';
    ctx.lineWidth = 1;
    ctx.strokeRect(sx, GROUND_Y, TILE, TILE);
  }
}

function drawPlatform(p, cx) {
  const sx = p.x - cx;
  const sy = p.y + p.bounce;
  if (sx + p.w < 0 || sx > canvas.width) return;

  if (p.type === 'brick') {
    ctx.fillStyle = p.hit ? '#888' : C.brick;
    ctx.fillRect(sx, sy, p.w, p.h);
    ctx.fillStyle = p.hit ? '#aaa' : C.brickTop;
    ctx.fillRect(sx, sy, p.w, 4);
    ctx.strokeStyle = '#7b2808';
    ctx.lineWidth = 1;
    // Brick pattern
    for (let i = 0; i < p.w / TILE; i++) {
      ctx.strokeRect(sx + i * TILE, sy, TILE, TILE);
      ctx.fillStyle = '#a03808';
      ctx.fillRect(sx + i * TILE + TILE / 2, sy + TILE / 2, TILE / 2, 4);
    }
  } else if (p.type === 'question') {
    if (p.hit) {
      ctx.fillStyle = '#888';
      ctx.fillRect(sx, sy, p.w, p.h);
      ctx.fillStyle = '#aaa';
      ctx.fillRect(sx, sy, p.w, 4);
      ctx.strokeStyle = '#555';
      ctx.lineWidth = 1;
      ctx.strokeRect(sx, sy, p.w, p.h);
    } else {
      ctx.fillStyle = C.question;
      ctx.fillRect(sx, sy, p.w, p.h);
      ctx.fillStyle = C.qShine;
      ctx.fillRect(sx + 2, sy + 2, p.w - 4, 4);
      ctx.strokeStyle = '#b06000';
      ctx.lineWidth = 1;
      ctx.strokeRect(sx, sy, p.w, p.h);
      // "?" symbol
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 18px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('?', sx + p.w / 2, sy + p.h - 7);
    }
  }
  if (p.bounce > 0) p.bounce = Math.max(0, p.bounce - 1.5);
}

function drawPipe(p, cx) {
  const sx = p.x - cx;
  if (sx + p.w < 0 || sx > canvas.width) return;

  // Body
  ctx.fillStyle = C.pipe.body;
  ctx.fillRect(sx + 4, p.y + TILE, p.w - 8, p.h - TILE);
  // Dark edge
  ctx.fillStyle = C.pipe.dark;
  ctx.fillRect(sx + 4, p.y + TILE, 6, p.h - TILE);
  // Rim
  ctx.fillStyle = C.pipe.rim;
  ctx.fillRect(sx, p.y, p.w, TILE);
  ctx.fillStyle = C.pipe.body;
  ctx.fillRect(sx + 2, p.y + 2, p.w - 4, TILE - 4);
  // Shine
  ctx.fillStyle = C.pipe.rim;
  ctx.fillRect(sx + 6, p.y + 6, 6, TILE - 8);
}

function drawCoin(c, cx) {
  if (c.collected) return;
  const sx = c.x - cx;
  if (sx < -20 || sx > canvas.width + 20) return;
  c.anim = (c.anim + 0.08) % (Math.PI * 2);
  const scaleX = Math.abs(Math.cos(c.anim));
  ctx.save();
  ctx.translate(sx, c.y);
  ctx.scale(scaleX, 1);
  ctx.fillStyle = C.coin;
  ctx.beginPath();
  ctx.arc(0, 0, c.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = C.coinRim;
  ctx.beginPath();
  ctx.arc(0, 0, c.r - 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = C.coin;
  ctx.font = 'bold 9px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('$', 0, 3);
  ctx.restore();
}

function drawGoomba(e, cx) {
  if (e.dead && !e.squished) return;
  const sx = e.x - cx;
  if (sx + e.w < -20 || sx > canvas.width + 20) return;

  ctx.save();
  ctx.translate(sx + e.w / 2, e.y + e.h);

  if (e.squished) {
    // Flat squished goomba
    ctx.fillStyle = C.goomba.body;
    ctx.fillRect(-e.w / 2, -6, e.w, 6);
    ctx.restore();
    return;
  }

  const walk = e.frame === 0 ? 2 : -2;

  // Body
  ctx.fillStyle = C.goomba.body;
  ctx.beginPath();
  ctx.arc(0, -e.h * 0.55, e.w * 0.45, Math.PI, 0);
  ctx.fillRect(-e.w / 2, -e.h * 0.55, e.w, e.h * 0.55);
  ctx.fill();

  // Feet
  ctx.fillStyle = C.goomba.dark;
  ctx.fillRect(-e.w / 2 + walk, -8, 10, 8);
  ctx.fillRect(e.w / 2 - 10 - walk, -8, 10, 8);

  // Eyes
  ctx.fillStyle = C.goomba.eye;
  ctx.fillRect(-10, -e.h * 0.7, 9, 8);
  ctx.fillRect(1, -e.h * 0.7, 9, 8);
  ctx.fillStyle = C.goomba.pupil;
  ctx.fillRect(-8, -e.h * 0.65, 5, 5);
  ctx.fillRect(3, -e.h * 0.65, 5, 5);

  // Angry brows
  ctx.strokeStyle = C.goomba.dark;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-12, -e.h * 0.75);
  ctx.lineTo(-1, -e.h * 0.68);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(1, -e.h * 0.68);
  ctx.lineTo(12, -e.h * 0.75);
  ctx.stroke();

  ctx.restore();
}

function drawMario(cx) {
  const sx = mario.x - cx;
  const sy = mario.y;
  const dir = mario.dir;

  if (mario.dead) {
    // Dead Mario (flat spin)
    ctx.save();
    ctx.translate(sx + mario.w / 2, sy + mario.h / 2);
    ctx.rotate(mario.deadTimer * 0.15);
    drawMarioSprite(0, 0, 1, 0);
    ctx.restore();
    return;
  }

  if (mario.invincible > 0 && Math.floor(mario.invincible / 3) % 2 === 0) return;

  ctx.save();
  ctx.translate(sx + mario.w / 2, sy + mario.h);
  ctx.scale(dir, 1);
  drawMarioSprite(0, 0, mario.frame, mario.onGround ? 0 : 1);
  ctx.restore();
}

function drawMarioSprite(ox, oy, frame, airborne) {
  // Hat
  ctx.fillStyle = C.mario.hat;
  ctx.fillRect(ox - 10, oy - 32, 20, 6);
  ctx.fillRect(ox - 7,  oy - 38, 16, 8);

  // Face / skin
  ctx.fillStyle = C.mario.skin;
  ctx.fillRect(ox - 8, oy - 26, 16, 10);

  // Eyes
  ctx.fillStyle = '#000';
  ctx.fillRect(ox + 1, oy - 24, 4, 3);

  // Mustache
  ctx.fillStyle = C.mario.shoes;
  ctx.fillRect(ox - 8, oy - 18, 6, 3);
  ctx.fillRect(ox,     oy - 18, 6, 3);

  // Overalls body
  ctx.fillStyle = C.mario.overalls;
  ctx.fillRect(ox - 10, oy - 18, 20, 14);

  // Buttons
  ctx.fillStyle = C.mario.skin;
  ctx.fillRect(ox - 6, oy - 16, 4, 4);
  ctx.fillRect(ox + 2, oy - 16, 4, 4);

  // Legs / feet
  const legOff = airborne ? [0, 0] : frame === 1 ? [-4, 4] : frame === 2 ? [4, -4] : [0, 0];
  ctx.fillStyle = C.mario.overalls;
  ctx.fillRect(ox - 10, oy - 4 + legOff[0], 8, 8);
  ctx.fillRect(ox + 2,  oy - 4 + legOff[1], 8, 8);

  // Shoes
  ctx.fillStyle = C.mario.shoes;
  ctx.fillRect(ox - 12, oy + 2 + legOff[0], 12, 6);
  ctx.fillRect(ox + 1,  oy + 2 + legOff[1], 12, 6);

  // Arms
  ctx.fillStyle = C.mario.skin;
  const armY = airborne ? -22 : -16;
  ctx.fillRect(ox - 16, oy + armY, 6, 10);
  ctx.fillRect(ox + 10, oy + armY, 6, 10);
}

function drawFlag(cx) {
  const sx = FLAG_X * TILE - cx;
  if (sx < -TILE || sx > canvas.width + TILE) return;

  const poleH = 10 * TILE;
  const poleX = sx + TILE;

  // Pole
  ctx.fillStyle = C.flag.pole;
  ctx.fillRect(poleX, GROUND_Y - poleH, 6, poleH);

  // Flag
  ctx.fillStyle = C.flag.flag;
  ctx.beginPath();
  ctx.moveTo(poleX + 6, GROUND_Y - poleH);
  ctx.lineTo(poleX + 6 + 40, GROUND_Y - poleH + 20);
  ctx.lineTo(poleX + 6, GROUND_Y - poleH + 40);
  ctx.closePath();
  ctx.fill();

  // Ball on top
  ctx.fillStyle = C.flag.pole;
  ctx.beginPath();
  ctx.arc(poleX + 3, GROUND_Y - poleH, 6, 0, Math.PI * 2);
  ctx.fill();
}

// ── Main loop ─────────────────────────────────────────────────────────────────
let lastTime = 0;
function loop(ts) {
  const dt = ts - lastTime;
  lastTime = ts;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawBackground(camX);
  drawGround(camX);
  for (let p of pipes)     drawPipe(p, camX);
  for (let p of platforms) drawPlatform(p, camX);
  for (let c of coins)     drawCoin(c, camX);
  for (let e of enemies)   drawGoomba(e, camX);
  drawFlag(camX);
  drawMario(camX);
  drawParticles(camX);

  if (state === 'playing') {
    updateMario();
    updateEnemies();
    updateParticles();
  }

  // "SUPER!" flash on top of everything
  if (superFlash > 0) {
    ctx.save();
    ctx.globalAlpha = Math.min(1, superFlash / 20);
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#e52521';
    ctx.lineWidth = 4;
    ctx.font = 'bold 36px monospace';
    ctx.textAlign = 'center';
    const fy = canvas.height / 2 - (45 - superFlash) * 2;
    ctx.strokeText('SUPER JUMP!', canvas.width / 2, fy);
    ctx.fillText('SUPER JUMP!',   canvas.width / 2, fy);
    ctx.restore();
    superFlash--;
  }

  requestAnimationFrame(loop);
}

// ── Overlay button ─────────────────────────────────────────────────────────────
overlayBtn.addEventListener('click', () => {
  overlay.classList.add('hidden');

  // Start background music
  bgMusic.play();

  lives = 3;
  initGame();
  state = 'playing';
  startTimer();
});

// ── Kick off ──────────────────────────────────────────────────────────────────
initGame();
requestAnimationFrame(loop);