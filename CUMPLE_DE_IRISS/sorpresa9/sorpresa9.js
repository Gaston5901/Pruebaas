document.addEventListener('DOMContentLoaded', () => {
  const overlay = document.getElementById('surpriseOverlay');
  const btnOpen = document.getElementById('btnOpenSorpresa');

  if (!btnOpen || !overlay) return;

  btnOpen.addEventListener('click', () => {
    overlay.classList.add('hidden');
    setTimeout(() => {
      window.location.href = 'inicio/index.html?capitulo=1&listo=1';
    }, 420);
  });
});
