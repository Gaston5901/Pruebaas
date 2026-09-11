document.addEventListener('DOMContentLoaded', () => {
  // Manejo del Overlay Modal
  const overlay = document.getElementById('surpriseOverlay');
  const btnOpen = document.getElementById('btnOpenSurprise');

  if (btnOpen && overlay) {
    btnOpen.addEventListener('click', () => {
      overlay.classList.add('hidden');
      setTimeout(() => {
        overlay.style.display = 'none';
      }, 400);
    });
  }

  // Lista de Flores y Mensajes
  const flowers = ['🌸', '🌺', '🌹', '🌷', '🌻', '🌼', '💖', '✨'];
  const messages = [
    'Tu sonrisa ilumina todo',
    'Un momento especial',
    'Sos increíble',
    'Siempre con vos',
    'Detalles únicos',
    'Alegría total',
    'Un deseo para vos',
    'Nunca dejes de brillar'
  ];

  const flowerCanvas = document.getElementById('flowerCanvas');

  if (flowerCanvas) {
    flowerCanvas.addEventListener('click', (e) => {
      const rect = flowerCanvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Selección aleatoria
      const randomFlower = flowers[Math.floor(Math.random() * flowers.length)];
      const randomMsg = messages[Math.floor(Math.random() * messages.length)];

      // Crear elemento de flor
      const flowerEl = document.createElement('div');
      flowerEl.className = 'blooming-flower';
      flowerEl.style.left = `${x}px`;
      flowerEl.style.top = `${y}px`;

      flowerEl.innerHTML = `
        <span class="flower-icon">${randomFlower}</span>
        <span class="flower-message">${randomMsg}</span>
      `;

      flowerCanvas.appendChild(flowerEl);
    });
  }
});