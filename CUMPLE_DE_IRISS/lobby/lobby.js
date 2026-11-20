document.addEventListener('DOMContentLoaded', () => {
  // Inicializar iconos de Lucide
  if (window.lucide) {
    lucide.createIcons();
  }

  // Si estamos en la vista de la Intro (Index)
  if (document.getElementById('introBalloonsContainer')) {
    createFireflies();
    initIntroCandles();

    if (new URLSearchParams(window.location.search).get('capitulo') === '2') {
      const back = document.querySelector('.nav-btn');
      if (back) back.href = '../sorpresa9/inicio/final.html';
    }
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

/* ==========================================================
   Efecto de sonido de Soplido (Web Audio API)
========================================================== */
function playBlowSound() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    
    const ctx = new AudioContext();
    const bufferSize = ctx.sampleRate * 0.2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(700, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.2);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start();
  } catch (e) {
    console.log("Audio interactivo no habilitado:", e);
  }
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
      if (!wrapper.classList.contains("extinguished")) {
        wrapper.classList.add("extinguished");
        extinguishedCount++;

        playBlowSound();
        createSmoke(wrapper);

        if (extinguishedCount === totalCandles) {
          setTimeout(() => {
            startCountdown();
          }, 500);
        }
      }
    });

    group.appendChild(wrapper);
  }
}

function createSmoke(element) {
  for (let i = 0; i < 3; i++) {
    const smoke = document.createElement('div');
    smoke.classList.add('smoke-particle');
    
    const smokeX = (Math.random() - 0.5) * 30;
    smoke.style.setProperty('--smokeX', `${smokeX}px`);

    element.appendChild(smoke);
    setTimeout(() => smoke.remove(), 800);
  }
}

/* ==========================================================
   3. CUENTA REGRESIVA Y TRANSICIÓN AL LOBBY
========================================================== */
function startCountdown() {
  let count = 3;
  countdownWrapper.innerHTML = `<div class="countdown-number">${count}</div>`;

  const interval = setInterval(() => {
    count--;
    if (count > 0) {
      countdownWrapper.innerHTML = `<div class="countdown-number">${count}</div>`;
    } else {
      clearInterval(interval);
      revealLobby();
    }
  }, 900);
}

function mostrarTortaFinal(callback) {
  const overlay = document.getElementById("tortaFinal");
  const numero = document.getElementById("tortaNumero");
  const gif = document.getElementById("tortaGif");

  if (!overlay) {
    callback();
    return;
  }

  let restante = 7;
  if (numero) numero.textContent = restante;
  if (gif) gif.src = gif.src;
  overlay.classList.add("visible");

  const timer = setInterval(() => {
    restante--;

    if (restante <= 0) {
      clearInterval(timer);
      overlay.classList.remove("visible");
      callback();
      return;
    }

    if (numero) {
      numero.textContent = restante;
      numero.classList.remove("pop");
      void numero.offsetWidth;
      numero.classList.add("pop");
    }
  }, 1000);
}

function revealLobby() {
  const overlay = document.getElementById("intro-overlay");

  if (overlay) {
    overlay.style.opacity = "0";
    overlay.style.transform = "scale(1.05)";
    overlay.style.transition = "opacity 0.8s ease, transform 0.8s ease";
  }

  const params = new URLSearchParams(window.location.search);

  setTimeout(() => {
    const destino = params.get('capitulo') === '4'
      ? "../sorpresa9/inicio/final.html?capitulo=4&listo=1"
      : "lobby.html?from=candles";

    mostrarTortaFinal(() => {
      window.location.href = destino;
    });
  }, 800);
}

/* ==========================================================
   4. CONTROL DEL MODAL DE BIENVENIDA (SE MUESTRA 1 SOLA VEZ)
========================================================== */
function initWelcomeModal() {
  const modal = document.getElementById('welcomeModal');
  const closeBtn = document.getElementById('closeModalBtn');

  if (!modal || !closeBtn) return;

  // Solo se muestra cuando se llega EXACTAMENTE desde el corazón (botón "Tocar").
  // Volver desde una sorpresa dentro del lobby NO vuelve a mostrarlo.
  const params = new URLSearchParams(window.location.search);
  const fromHeart = params.get('from') === 'heart';

  if (!fromHeart) {
    modal.remove();
    return;
  }

  modal.classList.remove('hidden-modal');

  closeBtn.addEventListener('click', () => {
    modal.classList.add('hidden-modal');
    setTimeout(() => modal.remove(), 350);
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
  const progressFill = document.getElementById('progressFill');
  const completionMessage = document.getElementById('completionMessage');
  if (!cards.length || !progressText || !progressFill) return;

  let visited = [];
  try {
    visited = JSON.parse(localStorage.getItem('visitedSurprises') || '[]');
  } catch {
    visited = [];
  }

  const updateProgress = () => {
    const visitedCount = cards.filter((card) => visited.includes(card.dataset.surprise)).length;
    progressText.textContent = `${visitedCount} de ${cards.length} descubiertas`;
    progressFill.style.width = `${(visitedCount / cards.length) * 100}%`;

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