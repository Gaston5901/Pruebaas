document.addEventListener('DOMContentLoaded', () => {
  const btnOpen = document.getElementById('btnOpenSorpresa');

  if (!btnOpen) return;

  btnOpen.addEventListener('click', () => {
    window.location.href = 'inicio/index.html?capitulo=1&listo=1';
  });
});
