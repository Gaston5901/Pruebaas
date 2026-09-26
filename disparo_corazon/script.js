const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const gif1 = document.getElementById('gif1');
const gif2 = document.getElementById('gif2');

const fullText = [
  "Iriss tii amouuu,",
  "confía en ti",
  "y nadie te frenará.",
];

let fontSize = 80;
let lineHeight = 100;
let heartScale = 14;

const shooterLeft = { x: 0, y: 0 };
const shooterRight = { x: 0, y: 0 };

const clouds = [];
const petals = [];
const celebrationBursts = [];
let dots = [];
let targetDotsQueue = [];
let currentCharIndex = 0;
let animationDone = false;
let shooterToggle = true;
let time = 0;
let layoutShift = 0;
let heartCenter = { x: 0, y: 0 };
let eyeAlpha = 0;

function fitFont() {
  const tempCtx = document.createElement('canvas').getContext('2d');
  let size = 66 * Math.min(1.6, canvas.width / 640);
  let maxWidth = canvas.width * 0.92;

  while (size > 12) {
    tempCtx.font = `bold ${size}px 'Segoe UI', Arial, sans-serif`;
    let widest = 0;
    fullText.forEach(line => {
      widest = Math.max(widest, tempCtx.measureText(line).width);
    });
    if (widest <= maxWidth) break;
    size *= 0.94;
  }

  return size;
}

function generateClouds(width, height) {
  clouds.length = 0;
  const count = Math.max(5, Math.round(width / 260));
  for (let i = 0; i < count; i++) {
    clouds.push({
      x: Math.random() * width,
      y: Math.random() * height * 0.7,
      w: 90 + Math.random() * 120,
      speed: 0.1 + Math.random() * 0.25,
      alpha: 0.5 + Math.random() * 0.4,
      pink: Math.random() > 0.6
    });
  }
}

function generatePetals(width, height) {
  petals.length = 0;
  const count = Math.max(22, Math.round(width / 28));
  for (let i = 0; i < count; i++) {
    petals.push(newPetal(width, height, Math.random()));
  }
}

function newPetal(width, height, spread = Math.random()) {
  return {
    x: Math.random() * width,
    y: -20 - spread * height,
    size: 7 + Math.random() * 9,
    fallSpeed: 0.8 + Math.random() * 1.4,
    sway: 0.6 + Math.random() * 1.4,
    swaySpeed: 0.02 + Math.random() * 0.03,
    phase: Math.random() * Math.PI * 2,
    rotation: Math.random() * Math.PI,
    rotSpeed: (Math.random() - 0.5) * 0.02,
    alpha: 0.7 + Math.random() * 0.3
  };
}

function repositionShooters() {
  shooterLeft.x = gif1.offsetLeft + gif1.offsetWidth / 2;
  shooterLeft.y = gif1.offsetTop + gif1.offsetHeight - 10;
  shooterRight.x = gif2.offsetLeft + gif2.offsetWidth / 2;
  shooterRight.y = gif2.offsetTop + gif2.offsetHeight - 10;
}

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  fontSize = fitFont();
  lineHeight = fontSize * 1.18;
  heartScale = Math.max(6, fontSize * 0.17);
  layoutShift = canvas.width < 800 ? canvas.height * 0.16 : 0;

  repositionShooters();

  generateClouds(canvas.width, canvas.height);
  generatePetals(canvas.width, canvas.height);

  resetAnimation();
}

function resetAnimation() {
  dots = [];
  targetDotsQueue = [];
  currentCharIndex = 0;
  animationDone = false;
  celebrationBursts.length = 0;
  eyeAlpha = 0;
  generateAllTargetDots();
}

function generateHeartDots() {
  const heartDots = [];
  const scale = heartScale;
  const pointsCount = 180;
  const offsetX = canvas.width / 2;
  const textBlockH = fullText.length * lineHeight;
  const offsetY = (canvas.height - textBlockH) / 2 + textBlockH + fontSize * 2.4 - layoutShift;

  heartCenter.x = offsetX;
  heartCenter.y = offsetY;

  for (let i = 0; i < pointsCount; i++) {
    const t = (i / pointsCount) * 2 * Math.PI;
    const x = scale * 16 * Math.pow(Math.sin(t), 3);
    const y = -scale * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
    heartDots.push({ x: offsetX + x, y: offsetY + y });
  }
  return heartDots;
}

function generateAllTargetDots() {
  const tempCtx = document.createElement('canvas').getContext('2d');
  tempCtx.font = `bold ${fontSize}px 'Segoe UI', Arial, sans-serif`;
  const textBlockH = fullText.length * lineHeight;
  const startY = (canvas.height - textBlockH) / 2 + fontSize * 1.0 - layoutShift;

  fullText.forEach((line, lineIndex) => {
    const lineWidth = tempCtx.measureText(line).width;
    let xCursor = (canvas.width - lineWidth) / 2;
    const y = startY + lineIndex * lineHeight;

    for (let char of line) {
      if (char === " ") {
        xCursor += tempCtx.measureText(" ").width;
        targetDotsQueue.push([]);
        continue;
      }
      const charDots = generateCharDots(char, xCursor, y);
      targetDotsQueue.push(charDots);
      xCursor += tempCtx.measureText(char).width;
    }
  });

  const heartShapeDots = generateHeartDots();
  targetDotsQueue.push(heartShapeDots);
}

function generateCharDots(char, x, y) {
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = canvas.width;
  tempCanvas.height = canvas.height;
  const tempCtx = tempCanvas.getContext('2d');
  tempCtx.font = `bold ${fontSize}px 'Segoe UI', Arial, sans-serif`;
  tempCtx.fillText(char, x, y);

  const imageData = tempCtx.getImageData(0, 0, canvas.width, canvas.height).data;
  const charDots = [];
  const density = Math.max(4, Math.round(5 * Math.min(1, canvas.width / 900)));

  for (let yPos = 0; yPos < canvas.height; yPos += density) {
    for (let xPos = 0; xPos < canvas.width; xPos += density) {
      const index = (yPos * canvas.width + xPos) * 4;
      if (imageData[index + 3] > 128) {
        charDots.push({ x: xPos, y: yPos });
      }
    }
  }
  return charDots;
}

function shootDot() {
  if (animationDone) return;

  while (currentCharIndex < targetDotsQueue.length && targetDotsQueue[currentCharIndex].length === 0) {
    currentCharIndex++;
  }

  const currentTargets = targetDotsQueue[currentCharIndex];
  if (!currentTargets) return;

  const isHeart = currentCharIndex === targetDotsQueue.length - 1;
  const batchSize = isHeart ? 4 : 1;

  for (let i = 0; i < batchSize; i++) {
    if (currentTargets.length === 0) break;

    const target = currentTargets.shift();
    if (!target) continue;

    const shooterPos = shooterToggle ? shooterLeft : shooterRight;
    shooterToggle = !shooterToggle;

    dots.push({
      x: shooterPos.x,
      y: shooterPos.y,
      vx: 0,
      vy: 0,
      targetX: target.x,
      targetY: target.y,
    });
  }

  if (currentTargets.length === 0) {
    currentCharIndex++;
    if (currentCharIndex >= targetDotsQueue.length) {
      if (!animationDone) {
        animationDone = true;
        startCelebration();
      }
    }
  }
}

function startCelebration() {
  let count = 0;
  const burstLoop = setInterval(() => {
    if (count >= 18) {
      clearInterval(burstLoop);
      return;
    }
    celebrateBurst();
    count++;
  }, 220);
}

function celebrateBurst() {
  const sourceX = Math.random() * canvas.width;
  const sourceY = canvas.height * (0.2 + Math.random() * 0.35);
  for (let i = 0; i < 26; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 2 + Math.random() * 7;
    celebrationBursts.push({
      x: sourceX,
      y: sourceY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 1.5,
      life: 1,
      decay: 0.008 + Math.random() * 0.014,
      size: 8 + Math.random() * 8
    });
  }
}

function drawBackground() {
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, "#2a0a3d");
  gradient.addColorStop(0.5, "#1c0626");
  gradient.addColorStop(1, "#0d0211");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawClouds() {
  clouds.forEach(cloud => {
    cloud.x += cloud.speed;
    if (cloud.x - cloud.w > canvas.width) {
      cloud.x = -cloud.w;
    }

    ctx.save();
    ctx.globalAlpha = cloud.alpha * 0.85;
    ctx.fillStyle = cloud.pink ? "#6b2d7d" : "#4a1e5e";

    ctx.beginPath();
    ctx.arc(cloud.x, cloud.y, cloud.w * 0.42, 0, Math.PI * 2);
    ctx.arc(cloud.x - cloud.w * 0.34, cloud.y + cloud.w * 0.12, cloud.w * 0.3, 0, Math.PI * 2);
    ctx.arc(cloud.x + cloud.w * 0.34, cloud.y + cloud.w * 0.12, cloud.w * 0.3, 0, Math.PI * 2);
    ctx.arc(cloud.x, cloud.y + cloud.w * 0.16, cloud.w * 0.36, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
}

function drawPetals() {
  petals.forEach(p => {
    p.y += p.fallSpeed;
    p.x += Math.sin(time * p.swaySpeed + p.phase) * p.sway;
    p.rotation += p.rotSpeed;

    if (p.y > canvas.height + 30) {
      Object.assign(p, newPetal(canvas.width, canvas.height));
      p.y = -20;
    }

    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rotation);
    ctx.globalAlpha = p.alpha;
    ctx.shadowColor = "rgba(210, 90, 255, 0.8)";
    ctx.shadowBlur = 12;
    ctx.fillStyle = "#d16bff";
    ctx.beginPath();
    ctx.ellipse(0, 0, p.size, p.size * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(p.size * 0.35, 0, p.size * 0.6, p.size * 0.42, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
}

function drawCuteFace() {
  if (eyeAlpha <= 0) return;
  const s = heartScale;
  const cx = heartCenter.x;
  const cy = heartCenter.y - s * 2.5;

  ctx.save();
  ctx.globalAlpha = eyeAlpha;

  [-1, 1].forEach(side => {
    const ex = cx + side * s * 6.5;
    const ey = cy + s * 2.2;

    ctx.shadowColor = "rgba(255, 170, 220, 0.9)";
    ctx.shadowBlur = 6;
    ctx.fillStyle = "#33102b";
    ctx.beginPath();
    ctx.arc(ex, ey, s * 2.1, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(ex - s * 0.7, ey - s * 0.7, s * 0.75, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(ex + s * 0.9, ey + s * 0.7, s * 0.4, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.strokeStyle = "#33102b";
  ctx.lineWidth = s * 0.6;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.arc(cx, cy + s * 9, s * 2.4, 0.1 * Math.PI, 0.9 * Math.PI);
  ctx.stroke();

  ctx.restore();
}

function animate() {
  requestAnimationFrame(animate);
  time++;
  drawBackground();
  drawClouds();
  drawPetals();

  const dotSize = Math.max(9, 15 * Math.min(canvas.width / 700, 1));

  dots.forEach(dot => {
    const dx = dot.targetX - dot.x;
    const dy = dot.targetY - dot.y;
    dot.vx += dx * 0.003;
    dot.vy += dy * 0.003;
    dot.vx *= 0.965;
    dot.vy *= 0.965;
    dot.x += dot.vx;
    dot.y += dot.vy;
    ctx.fillStyle = "rgba(255, 82, 168, 0.95)";
    ctx.font = `${dotSize}px Arial`;
    ctx.textAlign = "center";
    ctx.fillText("❤️", dot.x, dot.y);
  });

  if (animationDone) {
    eyeAlpha = Math.min(1, eyeAlpha + 0.02);
    drawCuteFace();
  }

  for (let i = celebrationBursts.length - 1; i >= 0; i--) {
    const p = celebrationBursts[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.16;
    p.life -= p.decay;
    ctx.save();
    ctx.globalAlpha = Math.max(0, p.life);
    ctx.font = `${p.size}px Arial`;
    ctx.textAlign = "center";
    ctx.fillText("💖", p.x, p.y);
    ctx.restore();
    if (p.life <= 0) {
      celebrationBursts.splice(i, 1);
    }
  }
}

window.addEventListener('resize', resizeCanvas);

gif1.addEventListener('load', repositionShooters);
gif2.addEventListener('load', repositionShooters);

window.onload = () => {
  setTimeout(resizeCanvas, 50);
};

animate();
setInterval(shootDot, 16);