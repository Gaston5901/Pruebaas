document.addEventListener('DOMContentLoaded', () => {
  // Inicializar iconos de Lucide
  if (window.lucide) {
    lucide.createIcons();
  }

  // Si estamos en la vista de la Intro (Index)
  if (document.getElementById('introBalloonsContainer')) {
    createFireflies();
    initIntroCandles();

  }

  // Si estamos en la vista del Lobby
  if (document.getElementById('mainLobby')) {
    initWelcomeModal();
    initLobbyAnimations();
  }
});

/* ==========================================================
   1. LUCIÉRNAGAS Y AMBIENTE DE JARDÍN
========================================================== */
function createFireflies() {
  const container = document.getElementById('firefliesContainer');
  if (!container) return;

  const count = 20;
  for (let i = 0; i < count; i++) {
    const firefly = document.createElement('div');
    firefly.classList.add('firefly');

    const startX = Math.random() * 100;
    const startY = Math.random() * 100;
    const translateX = (Math.random() - 0.5) * 120;
    const translateY = (Math.random() - 0.5) * 120;
    const duration = Math.random() * 3 + 2;

    firefly.style.left = `${startX}%`;
    firefly.style.top = `${startY}%`;
    firefly.style.setProperty('--translateX', `${translateX}px`);
    firefly.style.setProperty('--translateY', `${translateY}px`);
    firefly.style.setProperty('--duration', `${duration}s`);

    container.appendChild(firefly);
  }
}

let audioCtx = null;

function getAudioCtx() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return null;
    if (!audioCtx) audioCtx = new AudioContext();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  } catch (e) {
    return null;
  }
}

function playBlowSound(numero) {
  const ctx = getAudioCtx();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const bufferSize = Math.floor(ctx.sampleRate * 0.18);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1100, now);
    filter.frequency.exponentialRampToValueAtTime(120, now + 0.18);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.85, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    const pop = ctx.createOscillator();
    pop.type = 'sine';
    pop.frequency.setValueAtTime(280 + numero * 10, now);
    pop.frequency.exponentialRampToValueAtTime(90, now + 0.14);

    const popGain = ctx.createGain();
    popGain.gain.setValueAtTime(0.4, now);
    popGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    pop.connect(popGain);
    popGain.connect(ctx.destination);

    noise.start(now);
    pop.start(now);
  } catch (e) {}

  try {
    if (navigator.vibrate) navigator.vibrate(numero === 21 ? [35, 45, 70] : 30);
  } catch (e) {}
}

const DESEOS_MENSAJES = [
  'Por tu sonrisa ✨',
  'Por cada abrazo 💜',
  'Por las risas compartidas',
  'Por los días tranquilos',
  'Por todo lo que viene',
  'Por tu ternura',
  'Por hacerme sentir en casa',
  'Por escucharme siempre',
  'Por tu mirada bonita',
  'Por los planes que faltan',
  'Por tu forma de querer',
  'Por los detalles mínimos',
  'Por cada mensaje tuyo',
  'Por la calma que me das',
  'Por tu voz',
  'Por creer en mí',
  'Por el 26 de abril 💫',
  'Por todo lo que ya vivimos',
  'Por lo que todavía no sabemos',
  'Porque sos mi lugar favorito',
  '¡Pediste tus 21 deseos! 🎂'
];

function mensajeDeseo(numero) {
  return DESEOS_MENSAJES[(numero - 1) % DESEOS_MENSAJES.length];
}

function actualizarProgreso() {
  const actual = document.getElementById('deseosActuales');
  const mensaje = document.getElementById('deseoMensaje');
  if (actual) actual.textContent = extinguishedCount;
  if (mensaje) mensaje.textContent = extinguishedCount === 0
    ? 'Tocá la primera vela ✨'
    : mensajeDeseo(extinguishedCount);
}

/* ==========================================================
   2. 21 VELAS INTERACTIVAS
========================================================== */
const introContainer = document.getElementById("introBalloonsContainer");
const countdownWrapper = document.getElementById("countdown-wrapper");

let totalCandles = 0;
let extinguishedCount = 0;

function initIntroCandles() {
  if (!introContainer) return;
  introContainer.innerHTML = '';
  totalCandles = 21;
  extinguishedCount = 0;
  actualizarProgreso();

  let group = null;

  for (let numero = 1; numero <= 21; numero++) {
    if (numero === 21 || (numero - 1) % 5 === 0) {
      group = document.createElement("div");
      group.classList.add("candle-word");
      if (numero === 21) group.classList.add("candle-final");
      introContainer.appendChild(group);
    }

    const wrapper = document.createElement("div");
    wrapper.classList.add("candle-wrapper");
    if (numero === 21) wrapper.classList.add("candle-grande");

    wrapper.innerHTML = `
      <div class="candle-flame"></div>
      <div class="candle-body">
        <span class="candle-letter">${numero}</span>
      </div>
    `;

    wrapper.addEventListener("click", () => {
      if (numero !== extinguishedCount + 1) {
        const mensaje = document.getElementById('deseoMensaje');
        if (mensaje) mensaje.textContent = `Tocá la vela ${extinguishedCount + 1} primero ✨`;
        wrapper.classList.remove('error');
        void wrapper.offsetWidth;
        wrapper.classList.add('error');
        setTimeout(() => wrapper.classList.remove('error'), 360);
        return;
      }

      if (!wrapper.classList.contains("extinguished")) {
        wrapper.classList.add("extinguished");
        extinguishedCount++;

        playBlowSound(numero);
        createSmoke(wrapper);
        actualizarProgreso();

        if (extinguishedCount === totalCandles) {
          wrapper.classList.add('listo');
          createSparkles(wrapper);
          setTimeout(mostrarContinuar, 650);
        }
      }
    });

    group.appendChild(wrapper);
  }
}

function createSmoke(element) {
  for (let i = 0; i < 5; i++) {
    const smoke = document.createElement('div');
    smoke.classList.add('smoke-particle');

    const smokeX = (Math.random() - 0.5) * 36;
    smoke.style.setProperty('--smokeX', `${smokeX}px`);
    smoke.style.left = `${10 + Math.random() * 12}px`;
    smoke.style.animationDelay = `${i * 0.06}s`;

    element.appendChild(smoke);
    setTimeout(() => smoke.remove(), 1100);
  }
}

function createSparkles(element) {
  for (let i = 0; i < 16; i++) {
    const spark = document.createElement('div');
    spark.classList.add('spark-particle');

    const angle = (Math.PI * 2 * i) / 16;
    const radio = 50 + Math.random() * 55;
    spark.style.setProperty('--sparkX', `${Math.cos(angle) * radio}px`);
    spark.style.setProperty('--sparkY', `${Math.sin(angle) * radio}px`);
    spark.style.left = '50%';
    spark.style.animationDelay = `${Math.random() * 0.18}s`;

    element.appendChild(spark);
    setTimeout(() => spark.remove(), 1300);
  }
}

function mostrarContinuar() {
  countdownWrapper.innerHTML =
    '<p class="continuar-frase">¡21 deseos pedidos, Iris! 🎂</p>' +
    '<button class="continuar-velas" id="continuarVelas" type="button">Continuar a tu torta →</button>';

  const boton = document.getElementById('continuarVelas');
  if (!boton) return;

  boton.addEventListener('click', () => {
    boton.disabled = true;
    mostrarTortaFinal();
  });
}

function mostrarTortaFinal() {
  const overlay = document.getElementById('tortaFinal');
  if (!overlay) return;

  const video = document.getElementById('tortaVideo');
  if (video) {
    video.controls = false;
    video.loop = true;
    video.disablePictureInPicture = true;
    if ('disableRemotePlayback' in video) {
      video.disableRemotePlayback = true;
    }
    try {
      video.currentTime = 0;
    } catch (e) {}
    const intento = video.play();
    if (intento && typeof intento.catch === 'function') {
      intento.catch(() => {});
    }
  }

  const intro = document.getElementById('intro-overlay');
  if (intro) {
    intro.style.opacity = '0';
    intro.style.pointerEvents = 'none';
    intro.style.transition = 'opacity 0.45s ease';
  }

  overlay.classList.add('visible');
}

/* ==========================================================
   4. CONTROL DEL MODAL DE BIENVENIDA (SE MUESTRA 1 SOLA VEZ)
========================================================== */
function playMemberActivation(index) {
  const ctx = getAudioCtx();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const scale = [0, 2, 4, 7, 9, 12, 14];
    const freq = 523.25 * Math.pow(2, scale[index % scale.length] / 12);

    const master = ctx.createGain();
    master.gain.setValueAtTime(0.0001, now);
    master.gain.exponentialRampToValueAtTime(0.18, now + 0.008);
    master.gain.exponentialRampToValueAtTime(0.0001, now + 0.9);
    master.connect(ctx.destination);

    const strike = (start, volume) => {
      const partials = [
        { ratio: 1, level: 0.7, decay: 0.85 },
        { ratio: 2.76, level: 0.22, decay: 0.45 },
        { ratio: 5.4, level: 0.08, decay: 0.25 }
      ];
      partials.forEach((partial) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq * partial.ratio, start);
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(partial.level * volume, start + 0.005);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + partial.decay);
        osc.connect(gain);
        gain.connect(master);
        osc.start(start);
        osc.stop(start + partial.decay + 0.02);
      });
    };

    strike(now, 1);
    strike(now + 0.14, 0.35);
  } catch (e) {}
}

function playCompletionSound() {
  const ctx = getAudioCtx();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const master = ctx.createGain();
    master.gain.setValueAtTime(0.0001, now);
    master.gain.exponentialRampToValueAtTime(0.13, now + 0.01);
    master.gain.exponentialRampToValueAtTime(0.0001, now + 1.4);
    master.connect(ctx.destination);

    [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
      const start = now + i * 0.07;
      const partials = [
        { ratio: 1, level: 0.55, decay: 1.25 },
        { ratio: 2.01, level: 0.16, decay: 0.7 }
      ];
      partials.forEach((partial) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq * partial.ratio, start);
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(partial.level, start + 0.008);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + partial.decay);
        osc.connect(gain);
        gain.connect(master);
        osc.start(start);
        osc.stop(start + partial.decay + 0.02);
      });
    });
  } catch (e) {}
}

function initWelcomeModal() {
  const modal = document.getElementById('welcomeModal');
  const closeBtn = document.getElementById('closeModalBtn');
  const loading = document.getElementById('lobbyLoading');
  if (!modal || !closeBtn) return;

  const KEY = 'lobby_intro_vista';
  const params = new URLSearchParams(window.location.search);
  if (params.get('from') === 'heart' || params.get('reset') === '1') {
    try { sessionStorage.removeItem(KEY); } catch (e) {}
  }

  let yaVista = false;
  try { yaVista = sessionStorage.getItem(KEY) === '1'; } catch (e) {}

  if (yaVista) {
    modal.remove();
    document.documentElement.classList.add('lobby-listo');
    return;
  }

  document.body.classList.add('solo-modal');
  modal.classList.remove('hidden-modal');

  closeBtn.addEventListener('click', () => {
    getAudioCtx();
    try { sessionStorage.setItem(KEY, '1'); } catch (e) {}
    modal.classList.add('hidden-modal');
    setTimeout(() => modal.remove(), 300);
    if (loading) {
      loading.classList.add('visible');
      const progressRing = loading.querySelector('.loading-progress-value');
      if (progressRing) {
        progressRing.style.animation = 'none';
        void progressRing.getBoundingClientRect();
        progressRing.style.animation = '';
      }
      const spinnerArc = loading.querySelector('.loading-spinner-arc');
      if (spinnerArc) {
        spinnerArc.style.animation = 'none';
        void spinnerArc.getBoundingClientRect();
        spinnerArc.style.animation = '';
      }
      const members = loading.querySelectorAll('.bts-member-slot');
      members.forEach(member => member.classList.remove('member-active'));
      members.forEach((member, index) => {
        setTimeout(() => {
          member.classList.add('member-active');
          playMemberActivation(index);
        }, 420 + index * 1280);
      });
      setTimeout(() => playCompletionSound(), 420 + Math.max(members.length - 1, 0) * 1280 + 520);
    }
    setTimeout(() => {
      document.body.classList.remove('solo-modal');
      if (loading) loading.classList.remove('visible');
      document.documentElement.classList.add('lobby-listo');
    }, 10000);
  });
}

/* ==========================================================
   5. ANIMACIONES Y CORAZONES DEL LOBBY
========================================================== */
function initLobbyAnimations() {
  const isMobile = window.matchMedia('(max-width: 768px)').matches;

  if (!isMobile) {
    const heartTimer = setInterval(() => {
      const container = document.getElementById('balloonContainer');
      if (container && container.childElementCount < 10) {
        createHeartBalloon();
      }
    }, 2200);

    window.addEventListener('pagehide', () => clearInterval(heartTimer), { once: true });
  }

  // Desfase flotante en las tarjetas
  const giftBoxes = document.querySelectorAll('.gift-box');
  giftBoxes.forEach((box) => {
    const randomDelay = Math.random() * 2;
    box.style.animationDelay = `${randomDelay}s`;
  });

  initSurpriseProgress();
}

function initSurpriseProgress() {
  const cards = [...document.querySelectorAll('.gift-card[data-surprise]')];
  const progressText = document.getElementById('progressText');
  const completionMessage = document.getElementById('completionMessage');
  if (!cards.length) return;

  let visited = [];
  try {
    visited = JSON.parse(localStorage.getItem('visitedSurprises') || '[]');
  } catch {
    visited = [];
  }

  const updateProgress = () => {
    const visitedCount = cards.filter((card) => visited.includes(card.dataset.surprise)).length;
    if (progressText) progressText.textContent = `${visitedCount} de ${cards.length} descubiertas`;

    if (completionMessage) {
      completionMessage.hidden = visitedCount !== cards.length;
    }

    cards.forEach((card) => {
      card.classList.toggle('is-visited', visited.includes(card.dataset.surprise));
    });
  };

  cards.forEach((card) => {
    card.addEventListener('click', () => {
      const surpriseId = card.dataset.surprise;
      if (!visited.includes(surpriseId)) {
        visited.push(surpriseId);
        try {
          localStorage.setItem('visitedSurprises', JSON.stringify(visited));
        } catch {
          // El progreso visual sigue funcionando aunque el navegador bloquee storage.
        }
        updateProgress();
      }
    });
  });

  updateProgress();
}

function createHeartBalloon() {
  const balloonContainer = document.getElementById('balloonContainer');
  if (!balloonContainer) return;

  const heart = document.createElement('div');
  heart.className = 'balloon-heart';
  
  const heartsList = ['💖', '💜', '💗', '💓', '✨', '🌸'];
  heart.textContent = heartsList[Math.floor(Math.random() * heartsList.length)];

  const startX = Math.random() * 100;
  const translateX = (Math.random() - 0.5) * 150;
  const duration = Math.random() * 3 + 4;
  const rotate = (Math.random() - 0.5) * 45;

  heart.style.left = `${startX}%`;
  heart.style.setProperty('--translateX', `${translateX}px`);
  heart.style.setProperty('--duration', `${duration}s`);
  heart.style.setProperty('--rotate', `${rotate}deg`);
  heart.style.fontSize = `${Math.random() * 10 + 20}px`; 

  balloonContainer.appendChild(heart);

  setTimeout(() => {
    heart.remove();
  }, duration * 1000);
}