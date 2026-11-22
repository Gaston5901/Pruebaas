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
const imageCanvas = document.getElementById("image-canvas");
const infinityCanvas = document.getElementById("infinity-canvas");
const firmaCanvas = document.getElementById("firma-canvas");

const MAX_DIM = 780;
const MAX_POINTS = 16000;
const LINK = 10;
const TRAIL = 110;
const goldPalette = [[255, 216, 130], [255, 176, 194], [255, 235, 165]];

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

function detect(src, w, h, mask, factor = 0.045) {
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

  const threshold = Math.max(12, max * factor);
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

function colorRGB(t, palette) {
  const x = Math.min(0.999999, Math.max(0, t)) * (palette.length - 1);
  const i = Math.floor(x);
  const f = x - i;
  const a = palette[i];
  const b = palette[i + 1];
  return [
    Math.round(a[0] + (b[0] - a[0]) * f),
    Math.round(a[1] + (b[1] - a[1]) * f),
    Math.round(a[2] + (b[2] - a[2]) * f)
  ];
}

function colorAt(t, palette) {
  const c = colorRGB(t, palette);
  return `rgb(${c[0]},${c[1]},${c[2]})`;
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

function drawImageStrokes(canvas, src, duration, onDone, colorStart = "#b76de0", colorEnd = "#ff8fc7", opts = {}) {
  const thresholdFactor = opts.thresholdFactor ?? 0.045;
  const palette = opts.palette;
  const baseWidth = opts.baseWidth ?? 1.4;
  const liveWidth = opts.liveWidth ?? 2;
  const glow = opts.glow ?? 12;
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
    const edges = detect(gaussian(gray, w, h), w, h, mask, thresholdFactor);
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
      const color = palette ? colorAt(t, palette) : (t < 0.5 ? colorStart : colorEnd);
      if (target - 30 > committed) {
        drawRangeGeneric(bctx, committed, target - 30, pts, color, baseWidth, 5, 0.95);
        committed = target - 30;
      }
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(base, 0, 0);
      drawRangeGeneric(ctx, Math.max(0, target - 30), target, pts, color, liveWidth, glow, 1);
      if (t < 1) requestAnimationFrame(step);
      else if (onDone) onDone();
    }
    requestAnimationFrame(step);
  };
  img.src = src;
}

function makeLemniscate(A, B, cx, cy, steps) {
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * Math.PI * 2;
    const d = 1 + Math.sin(t) * Math.sin(t);
    pts.push({
      x: cx + (A * Math.cos(t)) / d,
      y: cy + (B * Math.sin(t) * Math.cos(t)) / d,
      penUp: i === 0
    });
  }
  return pts;
}

function makeHeart(cx, cy, s) {
  const pts = [];
  for (let i = 0; i <= 60; i++) {
    const t = (i / 60) * Math.PI * 2;
    const x = cx + (s * 16 * Math.pow(Math.sin(t), 3)) / 17;
    const y = cy - (s * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t))) / 17;
    pts.push({ x, y, penUp: i === 0 });
  }
  return pts;
}

function makeStar(cx, cy, r) {
  const q = r * 0.28;
  const coords = [[0, -r], [q, -q], [r, 0], [q, q], [0, r], [-q, q], [-r, 0], [-q, -q], [0, -r]];
  return coords.map((p, i) => ({ x: cx + p[0], y: cy + p[1], penUp: i === 0 }));
}

function makeDot(cx, cy, r) {
  const pts = [];
  for (let i = 0; i <= 20; i++) {
    const t = (i / 20) * Math.PI * 2;
    pts.push({ x: cx + r * Math.cos(t), y: cy + r * Math.sin(t), penUp: i === 0 });
  }
  return pts;
}

function drawOrnateInfinity(canvas, duration, palette) {
  const W = 520, H = 220;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  const stars = [].concat(
    makeStar(96, 60, 11), makeStar(424, 60, 11),
    makeStar(96, 160, 11), makeStar(424, 160, 11),
    makeStar(260, 20, 8), makeStar(260, 200, 8)
  );
  const dots = [].concat(
    makeDot(54, 110, 3), makeDot(466, 110, 3),
    makeDot(152, 26, 2.5), makeDot(368, 26, 2.5),
    makeDot(152, 194, 2.5), makeDot(368, 194, 2.5)
  );
  const groups = [
    { pts: makeLemniscate(175, 105, 260, 110, 260), width: 3, glow: 14, alpha: 1 },
    { pts: makeLemniscate(192, 122, 260, 110, 260), width: 1.1, glow: 8, alpha: 0.7 },
    { pts: makeLemniscate(156, 84, 260, 110, 260), width: 1.1, glow: 8, alpha: 0.8 },
    { pts: makeHeart(260, 110, 18), width: 2, glow: 12, alpha: 1 },
    { pts: stars, width: 1.8, glow: 12, alpha: 1 },
    { pts: dots, width: 2.4, glow: 8, alpha: 0.9 }
  ];
  let startTime = 0;

  function step(ts) {
    if (!startTime) startTime = ts;
    const t = Math.min(1, (ts - startTime) / duration);
    const eased = easeInOut(t);
    const color = colorAt(t, palette);
    ctx.clearRect(0, 0, W, H);
    for (const g of groups) {
      const target = Math.floor(eased * g.pts.length);
      const committed = Math.max(0, target - 22);
      drawRangeGeneric(ctx, 0, committed, g.pts, color, g.width, g.glow, g.alpha * 0.92);
      drawRangeGeneric(ctx, committed, target, g.pts, color, g.width * 1.25, g.glow * 1.4, 1);
    }
    if (t < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

function drawInkSignature(canvas, src, duration, palette) {
  const img = new Image();
  img.onload = () => {
    let iw = img.naturalWidth || img.width;
    let ih = img.naturalHeight || img.height;
    const scale = Math.min(1, 520 / Math.max(iw, ih));
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
    const mask = buildBackgroundMask(data, w, h);
    const ink = tctx.createImageData(w, h);

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const p = y * w + x;
        const i = p * 4;
        const lum = (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]) / 255;
        const alpha = data[i + 3] / 255;
        let strength = mask[p] ? 0 : alpha * (1 - lum);
        strength = Math.max(0, Math.min(1, (strength - 0.06) * 2.6));
        const c = colorRGB(x / w, palette);
        ink.data[i] = c[0];
        ink.data[i + 1] = c[1];
        ink.data[i + 2] = c[2];
        ink.data[i + 3] = Math.round(strength * 255);
      }
    }

    const inkCanvas = document.createElement("canvas");
    inkCanvas.width = w;
    inkCanvas.height = h;
    inkCanvas.getContext("2d").putImageData(ink, 0, 0);

    const maskCanvas = document.createElement("canvas");
    maskCanvas.width = w;
    maskCanvas.height = h;
    const mctx = maskCanvas.getContext("2d");
    const out = canvas.getContext("2d");
    let startTime = 0;

    function step(ts) {
      if (!startTime) startTime = ts;
      const t = Math.min(1, (ts - startTime) / duration);
      const reveal = easeInOut(t) * (w + 80) - 40;
      out.clearRect(0, 0, w, h);
      out.drawImage(inkCanvas, 0, 0);
      mctx.clearRect(0, 0, w, h);
      for (let y = 0; y < h; y += 6) {
        const wobble = Math.sin(y * 0.05 + t * 5) * 7;
        const g = mctx.createLinearGradient(reveal - 8 + wobble, 0, reveal + 34 + wobble, 0);
        g.addColorStop(0, "rgba(255,255,255,1)");
        g.addColorStop(0.35, "rgba(255,255,255,1)");
        g.addColorStop(1, "rgba(255,255,255,0)");
        mctx.fillStyle = g;
        mctx.fillRect(0, y, w, 6);
      }
      out.save();
      out.globalCompositeOperation = "destination-in";
      out.drawImage(maskCanvas, 0, 0);
      out.restore();
      if (t < 1) requestAnimationFrame(step);
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
    imageCanvas.classList.add("visible");
    drawImageStrokes(
      imageCanvas,
      "Irisss.png",
      2600,
      () => {
        setTimeout(() => {
          infinityCanvas.classList.add("visible");
          drawOrnateInfinity(infinityCanvas, 2200, goldPalette);
          setTimeout(() => {
            firmaCanvas.classList.add("visible");
            drawInkSignature(firmaCanvas, "firma.png", 2200, [[210, 190, 255], [255, 225, 250], [190, 230, 255]]);
          }, 1800);
        }, 300);
      },
      "#ffd76a",
      "#fff3c4",
      { thresholdFactor: 0.022, baseWidth: 2, liveWidth: 2.8, glow: 9, palette: goldPalette }
    );
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

window.addEventListener("load", () => {
  const img = new Image();
  img.onload = () => {
    source = img;
    build();
  };
  img.src = "Iriss.png";
});
