document.addEventListener('DOMContentLoaded', () => {
  // Inicializar iconos de Lucide
  if (window.lucide) {
    lucide.createIcons();
  }

  // Inicializar elementos de la Intro
  createFireflies();
  initIntroCandles();
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
   2. 21 VELAS INTERACTIVAS (Palabras agrupadas)
========================================================== */
const phrase = "HOY SOS LA REINA SEÑORITA"; // Exactamente 21 letras
const introContainer = document.getElementById("introBalloonsContainer");
const countdownWrapper = document.getElementById("countdown-wrapper");

let totalCandles = 0;
let extinguishedCount = 0;

function initIntroCandles() {
  if (!introContainer) return;
  introContainer.innerHTML = '';
  totalCandles = 0;
  extinguishedCount = 0;

  const words = phrase.split(" ");

  words.forEach((word) => {
    // Agrupamos cada palabra en su propio contenedor
    const wordSpan = document.createElement("span");
    wordSpan.classList.add("candle-word");

    for (let i = 0; i < word.length; i++) {
      totalCandles++;
      const letter = word[i];

      const wrapper = document.createElement("div");
      wrapper.classList.add("candle-wrapper");

      wrapper.innerHTML = `
        <div class="candle-flame"></div>
        <div class="candle-body">
          <span class="candle-letter">${letter}</span>
        </div>
      `;

      // Evento Click/Touch (Soplar/Apagar)
      wrapper.addEventListener("click", () => {
        if (!wrapper.classList.contains("extinguished")) {
          wrapper.classList.add("extinguished");
          extinguishedCount++;

          // Sonido de soplido + efecto de humo
          playBlowSound();
          createSmoke(wrapper);

          // Si apaga las 21 velas -> Se activa la cuenta regresiva
          if (extinguishedCount === totalCandles) {
            setTimeout(() => {
              startCountdown();
            }, 500);
          }
        }
      });

      wordSpan.appendChild(wrapper);
    }

    introContainer.appendChild(wordSpan);
  });
}

// Efecto de humo
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

function revealLobby() {
  const overlay = document.getElementById("intro-overlay");
  const mainLobby = document.getElementById("mainLobby");

  overlay.style.opacity = "0";
  overlay.style.transform = "scale(1.05)";

  setTimeout(() => {
    overlay.style.display = "none";
    if (mainLobby) {
      mainLobby.classList.remove("hidden");
    }
    initLobbyAnimations();
  }, 800);
}

/* ==========================================================
   4. ANIMACIONES DEL LOBBY PRINCIPAL
========================================================== */
function initLobbyAnimations() {
  // A) EFECTO MÁQUINA DE ESCRIBIR
  const textToType = "¡Comienza tu gran día, señorita! ✨"; 
  const phraseContainer = document.getElementById('typewriterPhrase');

  if (phraseContainer) {
    phraseContainer.innerHTML = '';
    const letters = textToType.split('');

    letters.forEach((char, index) => {
      const span = document.createElement('span');
      span.textContent = char === ' ' ? '\u00A0' : char; 
      span.style.animationDelay = `${index * 0.06}s`; 
      phraseContainer.appendChild(span);

      if (index % 4 === 0) {
        setTimeout(() => {
          createHeartBalloon();
        }, index * 60);
      }
    });
  }

  // B) GENERACIÓN CONTINUA DE CORAZONES FLOTANTES DE FONDO
  setInterval(createHeartBalloon, 1500);

  // C) DESFASE DE ANIMACIÓN EN TARJETAS DE REGALOS
  const giftBoxes = document.querySelectorAll('.gift-box');
  giftBoxes.forEach((box) => {
    const randomDelay = Math.random() * 2;
    box.style.animationDelay = `${randomDelay}s`;
  });
}

function createHeartBalloon() {
  const balloonContainer = document.getElementById('balloonContainer');
  if (!balloonContainer) return;

  const heart = document.createElement('div');
  heart.className = 'balloon-heart';
  
  const heartsList = ['💖', '💜', '💗', '💓', '✨', '🎈'];
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