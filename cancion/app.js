(function () {
  "use strict";

  var songs = Array.isArray(window.SONGS) ? window.SONGS : [];
  var root = document.documentElement;

  var audio = document.getElementById("audio");
  var el = {
    app: document.getElementById("app"),
    library: document.getElementById("library"),
    songs: document.getElementById("songs"),
    player: document.getElementById("player"),
    back: document.getElementById("back"),
    mute: document.getElementById("mute"),
    songTitle: document.getElementById("songTitle"),
    songArtist: document.getElementById("songArtist"),
    lyrics: document.getElementById("lyrics"),
    progress: document.getElementById("progress"),
    cur: document.getElementById("cur"),
    dur: document.getElementById("dur"),
    play: document.getElementById("play"),
    prev: document.getElementById("prev"),
    next: document.getElementById("next"),
    toast: document.getElementById("toast")
  };

  var current = -1;
  var audioCtx = null;
  var analyser = null;
  var dataArray = null;
  var usingAnalyser = false;
  var fxColorA = [165, 180, 252];
  var fxColorB = [103, 232, 249];
  var toastTimer = null;

  function rgba(c, a) {
    return "rgba(" + c[0] + "," + c[1] + "," + c[2] + "," + a + ")";
  }

  function hexToRgb(hex) {
    var h = String(hex || "").replace("#", "");
    if (h.length === 3) h = h.split("").map(function (c) { return c + c; }).join("");
    var num = parseInt(h, 16);
    if (isNaN(num)) return [255, 255, 255];
    return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
  }

  function fmt(t) {
    if (!isFinite(t) || t < 0) return "0:00";
    var m = Math.floor(t / 60);
    var s = Math.floor(t % 60);
    return m + ":" + (s < 10 ? "0" : "") + s;
  }

  function showToast(msg) {
    if (!el.toast) return;
    el.toast.textContent = msg;
    el.toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.toast.classList.remove("show"); }, 4500);
  }

  function setTheme(song) {
    var t = song.theme || {};
    var vars = {
      "--bgTop": t.bgTop || "#050817",
      "--bgBottom": t.bgBottom || "#0a1030",
      "--glow1": t.glow1 || "rgba(88,101,242,0.50)",
      "--glow2": t.glow2 || "rgba(45,212,191,0.28)",
      "--accent": t.accent || "#a5b4fc",
      "--accent2": t.accent2 || "#67e8f9",
      "--text": t.text || "#e8ecff"
    };
    Object.keys(vars).forEach(function (k) { root.style.setProperty(k, vars[k]); });
    fxColorA = hexToRgb(vars["--accent"]);
    fxColorB = hexToRgb(vars["--accent2"]);
    root.style.setProperty("--muted", rgba(hexToRgb(vars["--text"]), 0.62));

    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", vars["--bgBottom"]);

    setMood(song.mood || "night");

    el.app.classList.remove("theme-pulse");
    void el.app.offsetWidth;
    el.app.classList.add("theme-pulse");
  }

  function renderLibrary() {
    if (!el.songs) return;
    if (!songs.length) {
      var empty = document.createElement("p");
      empty.className = "lyric-empty";
      empty.textContent = "Todavía no hay canciones configuradas.";
      el.songs.appendChild(empty);
      return;
    }

    songs.forEach(function (song, i) {
      var theme = song.theme || {};
      var card = document.createElement("button");
      card.type = "button";
      card.className = "card";
      card.style.setProperty("--cA", theme.accent || "#a5b4fc");
      card.style.setProperty("--cB", theme.accent2 || "#67e8f9");
      card.style.setProperty("--g", theme.glow1 || "rgba(88,101,242,0.45)");

      card.innerHTML =
        '<span class="orb"></span>' +
        '<span class="card-num">' + (i + 1 < 10 ? "0" : "") + (i + 1) + '</span>' +
        '<svg class="card-play" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.14v13.72L19 12z"/></svg>' +
        '<span class="card-info">' +
          '<span class="card-title"></span>' +
          '<span class="card-artist"></span>' +
        '</span>';

      card.querySelector(".card-title").textContent = song.title || "Canción " + (i + 1);
      card.querySelector(".card-artist").textContent = song.artist || "";
      card.addEventListener("click", function () { selectSong(i, true); });

      el.songs.appendChild(card);
    });
  }

  function selectSong(index, autoplay) {
    if (!songs[index]) return;
    current = index;
    var song = songs[index];

    setTheme(song);
    el.songTitle.textContent = song.title || "Canción";
    el.songArtist.textContent = song.artist || "";
    el.player.classList.remove("playing", "muted");
    audio.muted = false;

    audio.src = song.src;
    audio.load();

    renderLyrics(song.lyrics || []);

    el.library.hidden = true;
    el.player.hidden = false;

    el.progress.value = 0;
    el.progress.style.setProperty("--p", "0%");
    el.cur.textContent = "0:00";
    el.dur.textContent = "0:00";

    requestAnimationFrame(function () {
      resizeViz();
      requestAnimationFrame(resizeViz);
    });

    if (autoplay) play();
  }

  function ensureGraph() {
    if (audioCtx) {
      if (audioCtx.state === "suspended") return audioCtx.resume().catch(function () {});
      return Promise.resolve();
    }
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return Promise.resolve();
      audioCtx = new AC();
      var source = audioCtx.createMediaElementSource(audio);
      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.82;
      source.connect(analyser);
      analyser.connect(audioCtx.destination);
      dataArray = new Uint8Array(analyser.frequencyBinCount);
      usingAnalyser = true;
    } catch (err) {
      usingAnalyser = false;
    }
    if (audioCtx && audioCtx.state === "suspended") {
      return audioCtx.resume().catch(function () {});
    }
    return Promise.resolve();
  }

  function play() {
    var p = audio.play();
    if (p && p.catch) p.catch(function () {});
    ensureGraph();
  }

  function nextSong(autoplay) {
    if (!songs.length) return;
    selectSong((current + 1) % songs.length, autoplay);
  }

  function prevSong(autoplay) {
    if (!songs.length) return;
    if (audio.currentTime > 4) {
      audio.currentTime = 0;
      updateProgress();
      return;
    }
    selectSong((current - 1 + songs.length) % songs.length, autoplay);
  }

  function updateProgress() {
    var d = audio.duration;
    if (isFinite(d) && d > 0) {
      var p = Math.min(1, Math.max(0, audio.currentTime / d));
      el.progress.value = Math.round(p * 1000);
      el.progress.style.setProperty("--p", (p * 100) + "%");
      el.dur.textContent = fmt(d);
    }
    el.cur.textContent = fmt(audio.currentTime || 0);
    updateLyrics(audio.currentTime || 0);
  }

  var lineEls = [];
  var lineTimes = [];
  var activeLine = -1;

  function renderLyrics(lines) {
    el.lyrics.innerHTML = "";
    lineEls = [];
    lineTimes = [];
    activeLine = -1;

    if (!lines || !lines.length) {
      var empty = document.createElement("p");
      empty.className = "lyric-empty";
      empty.textContent = "La letra de esta canción todavía no está cargada.";
      el.lyrics.appendChild(empty);
      return;
    }

    lines.forEach(function (ln) {
      var text = typeof ln === "string" ? ln : (ln.text || "");
      var p = document.createElement("p");
      p.className = "line";
      p.textContent = text;

      if (typeof ln === "object" && typeof ln.t === "number") {
        var at = ln.t;
        p.addEventListener("click", function () {
          audio.currentTime = at;
          updateProgress();
          if (audio.paused) play();
        });
        lineTimes.push(at);
      } else {
        lineTimes.push(null);
      }

      el.lyrics.appendChild(p);
      lineEls.push(p);
    });
  }

  function updateLyrics(t) {
    if (!lineTimes.length) return;
    var hasTimes = lineTimes.some(function (x) { return x !== null; });
    if (!hasTimes) return;

    var idx = -1;
    for (var i = 0; i < lineTimes.length; i++) {
      if (lineTimes[i] !== null && t + 0.12 >= lineTimes[i]) idx = i;
    }
    if (idx === activeLine) return;

    lineEls.forEach(function (elm, i) {
      elm.classList.toggle("active", i === idx);
    });
    activeLine = idx;

    if (idx >= 0) {
      var target = lineEls[idx].offsetTop - el.lyrics.clientHeight / 2 + lineEls[idx].offsetHeight / 2;
      el.lyrics.scrollTo({ top: Math.max(0, target), behavior: "smooth" });
    }
  }

  el.play.addEventListener("click", function () {
    if (audio.paused) play();
    else audio.pause();
  });

  el.prev.addEventListener("click", function () { prevSong(true); });
  el.next.addEventListener("click", function () { nextSong(true); });

  el.back.addEventListener("click", function () {
    audio.pause();
    el.player.hidden = true;
    el.library.hidden = false;
  });

  el.mute.addEventListener("click", function () {
    audio.muted = !audio.muted;
    el.player.classList.toggle("muted", audio.muted);
    el.mute.setAttribute("aria-label", audio.muted ? "Activar sonido" : "Silenciar");
  });

  el.progress.addEventListener("input", function () {
    var p = Number(el.progress.value) / 1000;
    el.progress.style.setProperty("--p", (p * 100) + "%");
    if (isFinite(audio.duration) && audio.duration > 0) {
      audio.currentTime = p * audio.duration;
      el.cur.textContent = fmt(audio.currentTime);
      updateLyrics(audio.currentTime);
    }
  });

  audio.addEventListener("play", function () {
    el.player.classList.add("playing");
    el.play.setAttribute("aria-label", "Pausar");
    ensureGraph();
  });

  audio.addEventListener("pause", function () {
    el.player.classList.remove("playing");
    el.play.setAttribute("aria-label", "Reproducir");
  });

  audio.addEventListener("ended", function () { nextSong(true); });
  audio.addEventListener("timeupdate", updateProgress);
  audio.addEventListener("loadedmetadata", updateProgress);
  audio.addEventListener("durationchange", updateProgress);

  audio.addEventListener("error", function () {
    if (!audio.getAttribute("src")) return;
    showToast("No encontré el audio. Revisá que el archivo exista y coincida con config.js.");
  });

  /* ============ FONDO ANIMADO ============ */

  var fx = document.getElementById("fx");
  var fxc = fx.getContext("2d");
  var fxMode = "night";
  var parts = [];
  var fw = 0;
  var fh = 0;
  var fDpr = 1;

  function setMood(mode) {
    fxMode = mode || "night";
    spawn();
  }

  function makePart() {
    if (fxMode === "rain") {
      return {
        x: Math.random() * fw,
        y: Math.random() * fh,
        len: 10 + Math.random() * 26,
        spd: 6 + Math.random() * 10,
        vx: 0.6 + Math.random() * 0.8,
        a: 0.15 + Math.random() * 0.35
      };
    }
    if (fxMode === "sunset") {
      return {
        x: Math.random() * fw,
        y: Math.random() * fh,
        r: 0.8 + Math.random() * 2.2,
        vy: 0.25 + Math.random() * 0.8,
        phase: Math.random() * Math.PI * 2,
        a: 0.25 + Math.random() * 0.5
      };
    }
    return {
      x: Math.random() * fw,
      y: Math.random() * fh,
      r: Math.random() * 1.6 + 0.4,
      vx: (Math.random() - 0.5) * 0.08,
      vy: (Math.random() - 0.5) * 0.06,
      phase: Math.random() * Math.PI * 2,
      spd: 0.008 + Math.random() * 0.02,
      a: 0.35 + Math.random() * 0.5
    };
  }

  function spawn() {
    if (!fw || !fh) return;
    parts = [];
    if (fxMode === "aurora") {
      var k = Math.min(7, Math.max(4, Math.round(fw / 220)));
      for (var i = 0; i < k; i++) {
        parts.push({
          x: ((i + 0.5) / k) * fw,
          baseY: fh * (0.15 + Math.random() * 0.5),
          r: Math.max(fw, fh) * (0.22 + Math.random() * 0.18),
          phase: Math.random() * Math.PI * 2,
          spd: 0.002 + Math.random() * 0.004,
          amp: 30 + Math.random() * 80
        });
      }
      return;
    }
    var n = Math.max(40, Math.min(150, Math.round((fw * fh) / 18000)));
    for (var j = 0; j < n; j++) parts.push(makePart());
  }

  function resizeFx() {
    fDpr = Math.min(window.devicePixelRatio || 1, 2);
    fw = window.innerWidth;
    fh = window.innerHeight;
    fx.width = Math.floor(fw * fDpr);
    fx.height = Math.floor(fh * fDpr);
    fx.style.width = fw + "px";
    fx.style.height = fh + "px";
    fxc.setTransform(fDpr, 0, 0, fDpr, 0, 0);
    spawn();
  }

  function drawFx() {
    requestAnimationFrame(drawFx);
    fxc.clearRect(0, 0, fw, fh);

    if (fxMode === "rain") {
      fxc.lineCap = "round";
      for (var r = 0; r < parts.length; r++) {
        var rp = parts[r];
        fxc.strokeStyle = rgba(fxColorB, rp.a * 0.5);
        fxc.lineWidth = 1;
        fxc.beginPath();
        fxc.moveTo(rp.x, rp.y);
        fxc.lineTo(rp.x - rp.vx * 2, rp.y + rp.len);
        fxc.stroke();
        rp.y += rp.spd;
        rp.x -= rp.vx;
        if (rp.y - rp.len > fh) { rp.y = -20; rp.x = Math.random() * fw; }
        if (rp.x < -40) rp.x = fw + 20;
      }
      return;
    }

    if (fxMode === "sunset") {
      fxc.globalCompositeOperation = "lighter";
      for (var s = 0; s < parts.length; s++) {
        var sp = parts[s];
        sp.phase += 0.01;
        sp.y -= sp.vy;
        sp.x += Math.sin(sp.phase) * 0.35;
        var fade = Math.max(0, Math.min(1, sp.y / fh));
        fxc.fillStyle = rgba(fxColorA, sp.a * fade);
        fxc.beginPath();
        fxc.arc(sp.x, sp.y, sp.r, 0, Math.PI * 2);
        fxc.fill();
        if (sp.y < -20) {
          sp.x = Math.random() * fw;
          sp.y = fh + Math.random() * 40;
          sp.phase = Math.random() * Math.PI * 2;
        }
      }
      fxc.globalCompositeOperation = "source-over";
      return;
    }

    if (fxMode === "aurora") {
      fxc.globalCompositeOperation = "lighter";
      for (var a = 0; a < parts.length; a++) {
        var ap = parts[a];
        ap.phase += ap.spd;
        var ax = ap.x + Math.cos(ap.phase * 1.3) * fw * 0.08;
        var ay = ap.baseY + Math.sin(ap.phase) * ap.amp;
        var g = fxc.createRadialGradient(ax, ay, 0, ax, ay, ap.r);
        g.addColorStop(0, rgba(fxColorA, 0.16));
        g.addColorStop(0.5, rgba(fxColorB, 0.10));
        g.addColorStop(1, "rgba(0,0,0,0)");
        fxc.fillStyle = g;
        fxc.beginPath();
        fxc.arc(ax, ay, ap.r, 0, Math.PI * 2);
        fxc.fill();
      }
      fxc.globalCompositeOperation = "source-over";
      return;
    }

    for (var n = 0; n < parts.length; n++) {
      var np = parts[n];
      np.phase += np.spd;
      var tw = 0.35 + 0.65 * Math.abs(Math.sin(np.phase));
      fxc.fillStyle = rgba(fxColorA, np.a * tw * 0.8);
      fxc.beginPath();
      fxc.arc(np.x, np.y, np.r, 0, Math.PI * 2);
      fxc.fill();
      np.x += np.vx;
      np.y += np.vy;
      if (np.x < -5) np.x = fw + 5;
      if (np.x > fw + 5) np.x = -5;
      if (np.y < -5) np.y = fh + 5;
      if (np.y > fh + 5) np.y = -5;
    }
  }

  /* ============ VISUALIZADOR ============ */

  var viz = document.getElementById("viz");
  var vctx = viz.getContext("2d");
  var vw = 0;
  var vh = 0;
  var vDpr = 1;
  var bars = new Float32Array(44);
  var vizLast = performance.now();
  var silentFor = 0;

  function resizeViz() {
    var rect = viz.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    vDpr = Math.min(window.devicePixelRatio || 1, 2);
    vw = rect.width;
    vh = rect.height;
    viz.width = Math.floor(vw * vDpr);
    viz.height = Math.floor(vh * vDpr);
    vctx.setTransform(vDpr, 0, 0, vDpr, 0, 0);
  }

  function roundRect(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function drawViz(now) {
    requestAnimationFrame(drawViz);
    var dt = Math.min(0.05, (now - vizLast) / 1000) || 0.016;
    vizLast = now;

    if (!vw || !vh) resizeViz();
    if (!vw || !vh) return;

    vctx.clearRect(0, 0, vw, vh);

    var count = bars.length;
    var gap = Math.max(2, vw * 0.009);
    var bw = (vw - gap * (count - 1)) / count;
    var playing = !audio.paused && !audio.ended;

    var freq = null;
    if (usingAnalyser && analyser && dataArray) {
      analyser.getByteFrequencyData(dataArray);
      freq = dataArray;
      if (playing) {
        var max = 0;
        for (var q = 0; q < freq.length; q++) if (freq[q] > max) max = freq[q];
        if (max === 0) {
          silentFor += dt;
          if (silentFor > 1.2) usingAnalyser = false;
        } else {
          silentFor = 0;
        }
      }
    }

    for (var i = 0; i < count; i++) {
      var target;
      if (freq) {
        var idx = Math.floor((i / count) * (freq.length * 0.7));
        target = (freq[idx] || 0) / 255;
        target = Math.pow(target, 1.25);
      } else if (playing) {
        target = 0.22 + 0.55 * Math.abs(Math.sin(now * 0.002 + i * 0.55)) *
          (0.5 + 0.5 * Math.sin(i * 0.9 + now * 0.001));
      } else {
        target = 0.03;
      }
      if (!playing) target = Math.min(target, 0.06);

      bars[i] += (target - bars[i]) * Math.min(1, dt * 12);

      var h = Math.max(2, bars[i] * (vh - 6));
      var x = i * (bw + gap);
      var y = vh - h;
      var grad = vctx.createLinearGradient(0, vh, 0, 0);
      grad.addColorStop(0, rgba(fxColorB, 0.9));
      grad.addColorStop(1, rgba(fxColorA, 0.9));
      vctx.fillStyle = grad;
      roundRect(vctx, x, y, bw, h, Math.min(bw / 2, 6));
      vctx.fill();
    }
  }

  if (window.ResizeObserver) {
    new ResizeObserver(resizeViz).observe(viz);
  }
  window.addEventListener("resize", function () {
    resizeFx();
    resizeViz();
  });

  renderLibrary();
  if (songs.length) setTheme(songs[0]);
  resizeFx();
  requestAnimationFrame(drawFx);
  requestAnimationFrame(drawViz);
})();
