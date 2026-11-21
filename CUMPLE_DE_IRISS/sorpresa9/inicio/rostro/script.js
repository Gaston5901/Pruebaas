const canvas = document.getElementById("scene");
const ctx = canvas.getContext("2d");

const base = document.createElement("canvas");
const baseCtx = base.getContext("2d");

const off = document.createElement("canvas");
const octx = off.getContext("2d", { willReadFrequently: true });

const shade = document.createElement("canvas");
const shadeCtx = shade.getContext("2d");

const fileInput = document.getElementById("file");
const colorInput = document.getElementById("color");
const speedInput = document.getElementById("speed");
const speedLabel = document.getElementById("speedLabel");
const restartBtn = document.getElementById("restart");
const continuarBtn = document.getElementById("continuar");
const statusEl = document.getElementById("status");
const stage = document.getElementById("stage");
const hint = document.getElementById("hint");
const bar = document.getElementById("bar");
const despuesCanvas = document.getElementById("despues-canvas");
const continuaraCanvas = document.getElementById("continuara-canvas");

const MAX_DIM = 780;
const MAX_POINTS = 16000;
const LINK = 10;
const TRAIL = 110;

let w = 0;
let h = 0;
let flat = [];
let committed = 0;
let animId = null;
let startTime = 0;
let duration = 10;
let running = false;
let drawColor = "#c07ad8";
let source = null;

function setStatus(text) {
  statusEl.textContent = text;
}

function loadFile(file) {
  if (!file || !file.type.startsWith("image/")) return;
  const url = URL.createObjectURL(file);
  const image = new Image();
  image.onload = () => {
    source = image;
    URL.revokeObjectURL(url);
    hint.classList.add("hide");
    build();
  };
  image.onerror = () => setStatus("No se pudo cargar la imagen");
  image.src = url;
}

function build() {
  if (!source) return;

  let iw = source.naturalWidth || source.width;
  let ih = source.naturalHeight || source.height;
  const scale = Math.min(1, MAX_DIM / Math.max(iw, ih));
  iw = Math.max(2, Math.round(iw * scale));
  ih = Math.max(2, Math.round(ih * scale));
  w = iw;
  h = ih;

  canvas.width = w;
  canvas.height = h;
  base.width = w;
  base.height = h;
  off.width = w;
  off.height = h;
  shade.width = w;
  shade.height = h;

  octx.clearRect(0, 0, w, h);
  octx.drawImage(source, 0, 0, w, h);

  const data = octx.getImageData(0, 0, w, h).data;
  const gray = new Float32Array(w * h);
  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    gray[p] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
  }

  const bgMask = buildBackgroundMask(data, w, h);

  shadeCtx.clearRect(0, 0, w, h);
  shadeCtx.filter = "grayscale(1) contrast(1.35) brightness(0.78)";
  shadeCtx.drawImage(source, 0, 0, w, h);
  shadeCtx.filter = "none";
  const shadeData = shadeCtx.getImageData(0, 0, w, h);
  for (let p = 0; p < w * h; p++) if (bgMask[p]) shadeData.data[p * 4 + 3] = 0;
  shadeCtx.putImageData(shadeData, 0, 0);

  const blurred = gaussian(gray, w, h);
  const edges = detect(blurred, w, h, bgMask);
  flat = flatten(buildStrokes(edges, w, h));
  startAnimation();
}

function gaussian(src, w, h) {
  const k = [1, 4, 6, 4, 1];
  const ksum = 16;
  const tmp = new Float32Array(w * h);
  const out = new Float32Array(w * h);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let s = 0;
      for (let t = -2; t <= 2; t++) {
        const xx = Math.min(w - 1, Math.max(0, x + t));
        s += src[y * w + xx] * k[t + 2];
      }
      tmp[y * w + x] = s / ksum;
    }
  }

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let s = 0;
      for (let t = -2; t <= 2; t++) {
        const yy = Math.min(h - 1, Math.max(0, y + t));
        s += tmp[yy * w + x] * k[t + 2];
      }
      out[y * w + x] = s / ksum;
    }
  }

  return out;
}

function buildBackgroundMask(data, w, h) {
  const mask = new Uint8Array(w * h);
  let r = 0, g = 0, b = 0, n = 0;
  const add = (x, y) => {
    const i = (y * w + x) * 4;
    r += data[i]; g += data[i + 1]; b += data[i + 2]; n++;
  };
  for (let x = 0; x < w; x += 8) { add(x, 0); add(x, h - 1); }
  for (let y = 0; y < h; y += 8) { add(0, y); add(w - 1, y); }
  r /= n; g /= n; b /= n;

  const tol2 = 70 * 70;
  const stack = [];
  const isBg = (p) => {
    const i = p * 4;
    const dr = data[i] - r, dg = data[i + 1] - g, db = data[i + 2] - b;
    return dr * dr + dg * dg + db * db < tol2;
  };
  const seed = (x, y) => {
    const p = y * w + x;
    if (!mask[p] && isBg(p)) { mask[p] = 1; stack.push(p); }
  };
  for (let x = 0; x < w; x++) { seed(x, 0); seed(x, h - 1); }
  for (let y = 0; y < h; y++) { seed(0, y); seed(w - 1, y); }
  while (stack.length) {
    const p = stack.pop();
    const x = p % w, y = (p / w) | 0;
    if (x > 0) seed(x - 1, y);
    if (x < w - 1) seed(x + 1, y);
    if (y > 0) seed(x, y - 1);
    if (y < h - 1) seed(x, y + 1);
  }
  return mask;
}

function detect(src, w, h, mask) {
  const gxA = new Float32Array(w * h);
  const gyA = new Float32Array(w * h);
  const mag = new Float32Array(w * h);
  let max = 0;

  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      if (mask && mask[i]) continue;
      const tl = src[i - w - 1], t = src[i - w], tr = src[i - w + 1];
      const l = src[i - 1], r = src[i + 1];
      const bl = src[i + w - 1], b = src[i + w], br = src[i + w + 1];
      const gx = (tr + 2 * r + br) - (tl + 2 * l + bl);
      const gy = (bl + 2 * b + br) - (tl + 2 * t + tr);
      const m = Math.sqrt(gx * gx + gy * gy);
      gxA[i] = gx;
      gyA[i] = gy;
      mag[i] = m;
      if (m > max) max = m;
    }
  }

  const threshold = Math.max(12, max * 0.045);
  const at = (x, y) => (x < 0 || y < 0 || x >= w || y >= h ? 0 : mag[y * w + x]);
  const pts = [];

  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      if (mask && mask[i]) continue;
      const m = mag[i];
      if (m < threshold) continue;

      let ang = Math.atan2(gyA[i], gxA[i]) * 180 / Math.PI;
      if (ang < 0) ang += 180;

      let n1, n2;
      if (ang < 22.5 || ang >= 157.5) {
        n1 = at(x + 1, y); n2 = at(x - 1, y);
      } else if (ang < 67.5) {
        n1 = at(x + 1, y - 1); n2 = at(x - 1, y + 1);
      } else if (ang < 112.5) {
        n1 = at(x, y + 1); n2 = at(x, y - 1);
      } else {
        n1 = at(x + 1, y + 1); n2 = at(x - 1, y - 1);
      }

      if (m >= n1 && m >= n2) pts.push({ x, y, m });
    }
  }

  if (pts.length > MAX_POINTS) {
    pts.sort((a, b) => b.m - a.m);
    pts.length = MAX_POINTS;
  }

  return pts;
}

function buildStrokes(pts, w, h) {
  if (!pts.length) return [];

  const cell = LINK;
  const cols = Math.ceil(w / cell) + 1;
  const rows = Math.ceil(h / cell) + 1;
  const grid = new Array(cols * rows);
  const link2 = LINK * LINK;

  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    const key = ((p.y / cell) | 0) * cols + ((p.x / cell) | 0);
    (grid[key] || (grid[key] = [])).push(i);
  }

  const used = new Uint8Array(pts.length);
  const strokes = [];
  const order = pts.map((_, i) => i).sort((a, b) => pts[b].m - pts[a].m);

  for (const s of order) {
    if (used[s]) continue;
    used[s] = 1;
    const stroke = [pts[s]];
    let cur = s;

    for (;;) {
      const cp = pts[cur];
      const gx = (cp.x / cell) | 0;
      const gy = (cp.y / cell) | 0;
      let best = -1;
      let bestD = link2;

      for (let oy = -1; oy <= 1; oy++) {
        const yy = gy + oy;
        if (yy < 0 || yy >= rows) continue;
        for (let ox = -1; ox <= 1; ox++) {
          const xx = gx + ox;
          if (xx < 0 || xx >= cols) continue;
          const bucket = grid[yy * cols + xx];
          if (!bucket) continue;
          for (const j of bucket) {
            if (used[j]) continue;
            const q = pts[j];
            const dx = q.x - cp.x;
            const dy = q.y - cp.y;
            const d = dx * dx + dy * dy;
            if (d < bestD) { bestD = d; best = j; }
          }
        }
      }

      if (best < 0) break;
      used[best] = 1;
      stroke.push(pts[best]);
      cur = best;
    }

    strokes.push(stroke);
  }

  return strokes;
}

function flatten(strokes) {
  if (!strokes.length) return [];

  let cx = 0, cy = 0, n = 0;
  for (const st of strokes) {
    for (const p of st) { cx += p.x; cy += p.y; n++; }
  }
  cx /= n;
  cy /= n;

  for (const st of strokes) {
    let sx = 0, sy = 0;
    for (const p of st) { sx += p.x; sy += p.y; }
    st.ang = Math.atan2(sy / st.length - cy, sx / st.length - cx);
  }
  strokes.sort((a, b) => a.ang - b.ang);

  const out = [];
  for (const st of strokes) {
    for (let i = 0; i < st.length; i++) {
      out.push({ x: st[i].x, y: st[i].y, penUp: i === 0 });
    }
  }
  return out;
}

function pathRange(c, from, to) {
  if (to <= from) return;
  c.beginPath();
  let started = false;

  if (from > 0 && !flat[from].penUp) {
    c.moveTo(flat[from - 1].x, flat[from - 1].y);
    started = true;
  }

  for (let i = from; i < to; i++) {
    const p = flat[i];
    if (p.penUp) {
      c.moveTo(p.x, p.y);
      started = true;
    } else if (!started) {
      c.moveTo(p.x, p.y);
      started = true;
    } else {
      c.lineTo(p.x, p.y);
    }
  }
  c.stroke();
}

function easeInOut(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function updateDuration() {
  duration = 16;
}

function startAnimation() {
  if (animId) cancelAnimationFrame(animId);
  animId = null;
  running = false;

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = "source-over";
  ctx.clearRect(0, 0, w, h);

  baseCtx.setTransform(1, 0, 0, 1, 0, 0);
  baseCtx.clearRect(0, 0, w, h);

  committed = 0;
  startTime = 0;
  stage.classList.remove("done");
  continuarBtn.classList.remove("visible");
  bar.style.width = "0%";
  updateDuration();

  if (!flat.length) {
    setStatus("Sin bordes detectados");
    return;
  }

  setStatus(flat.length.toLocaleString("es") + " puntos");
  running = true;
  animId = requestAnimationFrame(frame);
}

function frame(ts) {
  if (!startTime) startTime = ts;
  let t = (ts - startTime) / 1000 / duration;
  if (t > 1) t = 1;
  drawColor = t < 0.45 ? "#b76de0" : "#ff8fc7";

  const target = Math.floor(easeInOut(t) * flat.length);
  const settleEnd = target - TRAIL;

  if (settleEnd > committed) {
    baseCtx.save();
    baseCtx.strokeStyle = drawColor;
    baseCtx.globalAlpha = 0.85;
    baseCtx.lineWidth = 1.7;
    baseCtx.lineCap = "round";
    baseCtx.lineJoin = "round";
    baseCtx.shadowColor = drawColor;
    baseCtx.shadowBlur = 7;
    pathRange(baseCtx, committed, settleEnd);
    baseCtx.restore();
    committed = settleEnd;
  }

  ctx.clearRect(0, 0, w, h);
  ctx.drawImage(base, 0, 0);
  ctx.save();
  ctx.globalAlpha = 0.2 * Math.min(1, t / 0.35);
  ctx.drawImage(shade, 0, 0);
  ctx.restore();

  const liveStart = Math.max(0, target - TRAIL);
  if (target > liveStart) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = drawColor;
    ctx.lineWidth = 2.4;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.shadowColor = drawColor;
    ctx.shadowBlur = 18;
    pathRange(ctx, liveStart, target);
    ctx.restore();
  }

  if (target > 0) {
    const head = flat[Math.min(target, flat.length) - 1];
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = "#ffffff";
    ctx.shadowColor = drawColor;
    ctx.shadowBlur = 24;
    ctx.beginPath();
    ctx.arc(head.x, head.y, 2.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  bar.style.width = (t * 100).toFixed(1) + "%";

  if (t < 1) {
    animId = requestAnimationFrame(frame);
  } else {
    finish();
  }
}

function drawRangeGeneric(c, from, to, pts, color, lineWidth, blur, alpha) {
  if (to <= from) return;
  c.save();
  c.strokeStyle = color;
  c.lineWidth = lineWidth;
  c.lineCap = "round";
  c.lineJoin = "round";
  c.shadowColor = color;
  c.shadowBlur = blur;
  c.globalAlpha = alpha;
  c.beginPath();
  let started = false;
  for (let i = from; i < to; i++) {
    const p = pts[i];
    if (p.penUp || !started) { c.moveTo(p.x, p.y); started = true; }
    else c.lineTo(p.x, p.y);
  }
  c.stroke();
  c.restore();
}

function drawImageStrokes(canvas, src, duration, onDone) {
  const img = new Image();
  img.onload = () => {
    let iw = img.naturalWidth || img.width;
    let ih = img.naturalHeight || img.height;
    const scale = Math.min(1, 420 / Math.max(iw, ih));
    iw = Math.max(2, Math.round(iw * scale));
    ih = Math.max(2, Math.round(ih * scale));
    const w = iw, h = ih;
    canvas.width = w;
    canvas.height = h;

    const tmp = document.createElement("canvas");
    tmp.width = w;
    tmp.height = h;
    const tctx = tmp.getContext("2d", { willReadFrequently: true });
    tctx.drawImage(img, 0, 0, w, h);
    const data = tctx.getImageData(0, 0, w, h).data;
    const gray = new Float32Array(w * h);
    for (let i = 0, p = 0; i < data.length; i += 4, p++) {
      gray[p] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    }
    const mask = buildBackgroundMask(data, w, h);
    const edges = detect(gaussian(gray, w, h), w, h, mask);
    const pts = flatten(buildStrokes(edges, w, h));
    const base = document.createElement("canvas");
    base.width = w;
    base.height = h;
    const bctx = base.getContext("2d");
    const ctx = canvas.getContext("2d");
    let committed = 0, startTime = 0;

    function step(ts) {
      if (!startTime) startTime = ts;
      const t = Math.min(1, (ts - startTime) / duration);
      const target = Math.floor(easeInOut(t) * pts.length);
      const color = t < 0.5 ? "#b76de0" : "#ff8fc7";
      if (target - 30 > committed) {
        drawRangeGeneric(bctx, committed, target - 30, pts, color, 1.4, 5, 0.9);
        committed = target - 30;
      }
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(base, 0, 0);
      drawRangeGeneric(ctx, Math.max(0, target - 30), target, pts, color, 2, 12, 1);
      if (t < 1) requestAnimationFrame(step);
      else if (onDone) onDone();
    }
    requestAnimationFrame(step);
  };
  img.src = src;
}

function finish() {
  if (committed < flat.length) {
    baseCtx.save();
    baseCtx.strokeStyle = drawColor;
    baseCtx.globalAlpha = 0.85;
    baseCtx.lineWidth = 1.7;
    baseCtx.lineCap = "round";
    baseCtx.lineJoin = "round";
    baseCtx.shadowColor = drawColor;
    baseCtx.shadowBlur = 7;
    pathRange(baseCtx, committed, flat.length);
    baseCtx.restore();
    committed = flat.length;
  }

  const fadeStart = performance.now();
  function fadeShade(ts) {
    const p = Math.min(1, (ts - fadeStart) / 1200);
    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.globalAlpha = 0.24 * (1 - p);
    ctx.drawImage(shade, 0, 0);
    ctx.restore();
    ctx.drawImage(base, 0, 0);
    if (p < 1) requestAnimationFrame(fadeShade);
  }
  requestAnimationFrame(fadeShade);

  bar.style.width = "100%";
  setStatus("Listo");
  stage.classList.add("done");
  continuarBtn.classList.add("visible");
  setTimeout(() => {
    despuesCanvas.classList.add("visible");
    drawImageStrokes(despuesCanvas, "despuesdeldibujo.png", 2600, () => {
      setTimeout(() => {
        continuaraCanvas.classList.add("visible");
        drawImageStrokes(continuaraCanvas, "continuara.png", 2400);
      }, 500);
    });
  }, 900);
  running = false;
  animId = null;
}

function renderFull() {
  if (!flat.length) return;
  ctx.clearRect(0, 0, w, h);
  ctx.save();
  ctx.strokeStyle = drawColor;
  ctx.lineWidth = 1.5;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.shadowColor = drawColor;
  ctx.shadowBlur = 8;
  pathRange(ctx, 0, flat.length);
  ctx.restore();
}

fileInput.addEventListener("change", (e) => loadFile(e.target.files[0]));

colorInput.addEventListener("input", (e) => {
  drawColor = e.target.value;
});

colorInput.addEventListener("change", () => {
  if (!running && flat.length) renderFull();
});

speedInput.addEventListener("input", () => {
  speedLabel.textContent = speedInput.value;
  if (!running) updateDuration();
});

restartBtn.addEventListener("click", startAnimation);

continuarBtn.addEventListener("click", () => {
  window.location.href = "../final.html?capitulo=6&listo=1";
});

["dragenter", "dragover"].forEach((ev) =>
  stage.addEventListener(ev, (e) => {
    e.preventDefault();
    stage.classList.add("drag");
  })
);

["dragleave", "drop"].forEach((ev) =>
  stage.addEventListener(ev, (e) => {
    e.preventDefault();
    stage.classList.remove("drag");
  })
);

stage.addEventListener("drop", (e) => {
  const file = e.dataTransfer.files[0];
  if (file) loadFile(file);
});

speedLabel.textContent = speedInput.value;
updateDuration();

const volverBtn = document.getElementById("volver");
volverBtn.addEventListener("click", () => {
  window.location.href = "../final.html?capitulo=6&listo=1";
});

continuaraCanvas.addEventListener("click", () => {
  window.location.href = "../final.html?capitulo=6&listo=1";
});

window.addEventListener("load", () => {
  const img = new Image();
  img.onload = () => {
    source = img;
    build();
  };
  img.src = "Iriss.png";
});
