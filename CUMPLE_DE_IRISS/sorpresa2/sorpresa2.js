document.addEventListener('DOMContentLoaded', () => {
  if (window.lucide) {
    lucide.createIcons();
  }

  const overlay = document.getElementById('surpriseOverlay');
  const btnOpen = document.getElementById('btnOpenAlbum');

  if (btnOpen && overlay) {
    btnOpen.addEventListener('click', () => {
      overlay.classList.add('hidden');
      setTimeout(() => {
        overlay.style.display = 'none';
      }, 400);
    });
  }
});