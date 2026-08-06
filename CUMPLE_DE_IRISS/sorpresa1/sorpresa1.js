document.addEventListener('DOMContentLoaded', () => {
  const overlay = document.getElementById('surpriseOverlay');
  const btnOpen = document.getElementById('btnOpenLetter');

  if (btnOpen && overlay) {
    btnOpen.addEventListener('click', () => {
      overlay.classList.add('hidden');
      setTimeout(() => {
        overlay.style.display = 'none';
      }, 400);
    });
  }
});