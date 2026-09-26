/* ==========================================================
   SORPRESA 6 - Un Deseo
   Portación a canvas del clásico de turtle:
   el árbol fractal rojo con blanco, con florecitas que caen.
   ========================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const overlay = document.getElementById('surpriseOverlay');
  const btnOpen = document.getElementById('btnOpenSorpresa');
  const canvas = document.getElementById('roseCanvas');
  const note = document.getElementById('stageNote');
  if (!canvas || !note) return;
  const ctx = canvas.getContext('2d');

  const TRUNK = '#7a1020';   // rojo profundo (base del tronco)
  const TIP = '#ffffff';     // blanco puro (puntas)
  const BLOSSOM = '#ffffff'; // florecitas blancas

  const STEPS = [];
  let S = 1, ox = 0, oy = 0;
  let drawnCount = 0;
  let done = false;
  let playing = false;

  /* ---------- Generación de primitivas (fractal) ---------- */

  const prims = [];
  let T = null;

  function hexRgb(hex) {
    const h = hex.replace('#', '');
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }

  // Degradado rojo -> blanco según la distancia a la punta
  function lerpColor(t) {
    const a = hexRgb(TRUNK), b = hexRgb(TIP);
    const c = a.map((v, i) => Math.round(v + (b[i] - v) * t));
    return 'rgb(' + c[0] + ',' + c[1] + ',' + c[2] + ')';
  }

  function forward(d, withDot, grosor, t) {
    const r = T.h * Math.PI / 180;
    const nx = T.x + d * Math.cos(r);
    const ny = T.y + d * Math.sin(r);
    prims.push({ k: 's', x1: T.x, y1: T.y, x2: nx, y2: ny, w: grosor, color: lerpColor(t) });
    if (withDot) prims.push({ k: 'd', x: nx, y: ny });
    T.x = nx;
    T.y = ny;
  }

  /* Misma recursión que el Python, con ramas afinadas y degradadas */
  function tree(i) {
    if (i < 10) return;
    const t = Math.min(1, i / 70);
    const grosor = 1 + t * 4.5;
    forward(i, true, grosor, t);
    T.h += 20; tree(i * 4 / 5);
    T.h -= 40; tree(i * 4 / 5);
    T.h += 20;
    forward(-i, false, grosor, t);
  }

  function buildSteps() {
    prims.length = 0;
    STEPS.length = 0;

    T = { x: 0, y: -150, h: 90 };
    tree(70);

    for (let i = 0; i < prims.length; i += 24) {
      STEPS.push(prims.slice(i, i + 24));
    }
  }

  /* ---------- Bounds y escala ---------- */

  function bounds() {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    const see = (x, y) => {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    };
    for (const st of STEPS) {
      for (const p of st) {
        if (p.k === 's') { see(p.x1, p.y1); see(p.x2, p.y2); }
        else see(p.x, p.y);
      }
    }
    return { minX, minY, maxX, maxY };
  }

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    const W = window.innerWidth;
    const H = window.innerHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';

    const b = bounds();
    const padX = 30, padY = 50;
    const bw = Math.max(1, b.maxX - b.minX);
    const bh = Math.max(1, b.maxY - b.minY);
    S = Math.min((W - padX * 2) / bw, (H - padY * 2) / bh);
    if (!isFinite(S) || S <= 0) S = 1;
    ox = W / 2 - ((b.minX + b.maxX) / 2) * S;
    oy = H / 2 + ((b.minY + b.maxY) / 2) * S;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#1a0514';
    ctx.fillRect(0, 0, W, H);
  }

  /* ---------- Dibujo ---------- */

  function drawStep(st) {
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (const p of st) {
      if (p.k === 's') {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = Math.max(0.6, p.w * S);
        ctx.beginPath();
        ctx.moveTo(ox + p.x1 * S, oy - p.y1 * S);
        ctx.lineTo(ox + p.x2 * S, oy - p.y2 * S);
        ctx.stroke();
      } else {
        ctx.fillStyle = BLOSSOM;
        ctx.shadowColor = 'rgba(255, 255, 255, 0.9)';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(ox + p.x * S, oy - p.y * S, Math.max(1, 2.2 * S), 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }
  }

  function redraw(upTo) {
    resize();
    for (let i = 0; i < upTo; i++) drawStep(STEPS[i]);
  }

  function endDraw() {
    done = true;
    playing = false;
    note.textContent = 'Este árbol lo dibujó alguien que te quiere.';
    note.style.display = 'block';
    note.style.opacity = '0';
    note.style.transition = 'opacity 1.2s ease';
    setTimeout(() => { note.style.opacity = '1'; }, 40);
  }

  function play() {
    if (playing) return;
    playing = true;
    note.style.display = 'block';
    note.textContent = 'Dicen que este árbol cumple deseos. Pedí el tuyo con el corazón.';
    let i = 0;
    (function tick() {
      const total = STEPS.length;
      if (i >= total) {
        endDraw();
        return;
      }
      if (i / total >= 0.5) note.textContent = 'Pedí un deseo, que este árbol te escucha.';
      drawStep(STEPS[i]);
      drawnCount = ++i;
      setTimeout(tick, 70);
    })();
  }

  /* ---------- Lluvia de florecitas blancas ---------- */

  const petals = [];
  let petalRaf = null, petalT0 = 0;

  function startPetals() {
    if (petalRaf) return;
    petals.length = 0;
    const n = Math.round(34 + Math.random() * 10);
    for (let k = 0; k < n; k++) {
      petals.push({
        x: Math.random() * canvas.width / (window.devicePixelRatio || 1),
        y: -20 - Math.random() * 60,
        v: 0.35 + Math.random() * 0.5,
        sway: 0.6 + Math.random() * 1.6,
        phase: Math.random() * Math.PI * 2,
        size: 2.5 + Math.random() * 2.5,
        alpha: 0.55 + Math.random() * 0.35,
        rot: Math.random() * Math.PI
      });
    }
    petalT0 = performance.now();
    const step = (now) => {
      drawPetals((now - petalT0) / 1000);
      petalRaf = requestAnimationFrame(step);
    };
    petalRaf = requestAnimationFrame(step);
  }

  function drawPetals(t) {
    const dpr = window.devicePixelRatio || 1;
    const W = canvas.width / dpr;
    const H = canvas.height / dpr;

    for (let p of petals) {
      p.y += p.v * 0.8;
      p.x += Math.sin(t * p.sway + p.phase) * 0.6;
      if (p.y > H + 24) { p.y = -24 - Math.random() * 40; }
      if (p.x > W + 20) p.x = -20;
      if (p.x < -20) p.x = W + 20;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = BLOSSOM;
      ctx.shadowColor = 'rgba(255, 255, 255, 0.7)';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(0, 0, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      ctx.shadowBlur = 0;
    }
    ctx.globalAlpha = 1;
  }

  /* ---------- Eventos ---------- */

  window.addEventListener('resize', () => { if (drawnCount > 0) redraw(drawnCount); });

  /* ---------- Inicio ---------- */

  buildSteps();
  resize();

  if (btnOpen && overlay) {
    btnOpen.addEventListener('click', () => {
      overlay.classList.add('hidden');
      setTimeout(() => {
        overlay.style.display = 'none';
        play();
      }, 420);
    });
  }
});
