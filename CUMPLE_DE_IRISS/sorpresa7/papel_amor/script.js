let highestZ = 1;

class Paper {
  holdingPaper = false;
  mouseTouchX = 0;
  mouseTouchY = 0;
  mouseX = 0;
  mouseY = 0;
  prevMouseX = 0;
  prevMouseY = 0;
  velX = 0;
  velY = 0;
  rotation = Math.random() * 30 - 15;
  currentPaperX = 0;
  currentPaperY = 0;
  rotating = false;

  init(paper, index, total) {
    if (window.innerWidth <= 600) {
      const ancho = window.innerWidth;
      const alto = window.innerHeight;
      this.currentPaperX = (index % 2 === 0 ? -1 : 1) * ancho * 0.06;
      this.currentPaperY = (index - (total - 1) / 2) * alto * 0.045;
      this.rotation = Math.random() * 12 - 6;
      paper.style.transform = `translateX(${this.currentPaperX}px) translateY(${this.currentPaperY}px) rotateZ(${this.rotation}deg)`;
    }

    document.addEventListener('pointermove', (e) => {
      if (!this.rotating) {
        this.mouseX = e.clientX;
        this.mouseY = e.clientY;
        this.velX = this.mouseX - this.prevMouseX;
        this.velY = this.mouseY - this.prevMouseY;
      }

      const dirX = e.clientX - this.mouseTouchX;
      const dirY = e.clientY - this.mouseTouchY;
      const dirLength = Math.sqrt(dirX * dirX + dirY * dirY);
      const dirNormalizedX = dirX / dirLength;
      const dirNormalizedY = dirY / dirLength;
      const angle = Math.atan2(dirNormalizedY, dirNormalizedX);
      let degrees = 180 * angle / Math.PI;
      degrees = (360 + Math.round(degrees)) % 360;

      if (this.rotating) {
        this.rotation = degrees;
      }

      if (this.holdingPaper) {
        if (!this.rotating) {
          this.currentPaperX += this.velX;
          this.currentPaperY += this.velY;
        }
        this.prevMouseX = this.mouseX;
        this.prevMouseY = this.mouseY;

        paper.style.transform = `translateX(${this.currentPaperX}px) translateY(${this.currentPaperY}px) rotateZ(${this.rotation}deg)`;
      }
    });

    paper.addEventListener('pointerdown', (e) => {
      if (this.holdingPaper) return;
      this.holdingPaper = true;
      paper.style.zIndex = highestZ;
      highestZ += 1;

      if (e.button === 0 || e.pointerType === 'touch') {
        this.mouseTouchX = e.clientX;
        this.mouseTouchY = e.clientY;
        this.prevMouseX = e.clientX;
        this.prevMouseY = e.clientY;
      }
      
      if (e.button === 2) {
        this.rotating = true;
      }
    });

    window.addEventListener('pointerup', () => {
      this.holdingPaper = false;
      this.rotating = false;
    });
  }
}

const papers = Array.from(document.querySelectorAll('.paper'));

function iniciarPapeles() {
  papers.forEach((paper, index) => {
    const p = new Paper();
    p.init(paper, index, papers.length);
  });
}

document.getElementById('backButton').addEventListener('click', () => {
  window.location.href = '../loby.html';
});

const criticalImages = [
  '1.png', '2.png', '3.png', '4.png', '5.png', '8.jpg', '9.jpg'
];

function preloadImages(urls) {
  return Promise.all(urls.map(src => new Promise(resolve => {
    const img = new Image();
    img.onload = img.onerror = resolve;
    img.src = src;
  })));
}

const loadingText = document.getElementById('loadingText');
const puntosCarga = ['...', '.', '..', '...'];
let indicePuntos = 0;
const intervaloPuntos = setInterval(() => {
  indicePuntos = (indicePuntos + 1) % puntosCarga.length;
  loadingText.textContent = 'Cargando tu sorpresa' + puntosCarga[indicePuntos];
}, 450);

let experienciaIniciada = false;

function startExperience() {
  if (experienciaIniciada) return;
  experienciaIniciada = true;
  clearInterval(intervaloPuntos);
  iniciarPapeles();
  document.body.classList.add('is-ready');
  document.getElementById('loadingOverlay').classList.add('hidden');
}

const cargaMinima = new Promise(resolve => setTimeout(resolve, 5000));
Promise.all([preloadImages(criticalImages), cargaMinima]).then(startExperience);
setTimeout(startExperience, 8000);