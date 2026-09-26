document.addEventListener('DOMContentLoaded', () => {
  const overlay = document.getElementById('surpriseOverlay');
  const btnOpen = document.getElementById('btnOpenLetter');
  const letterModal = document.getElementById('letterModal');
  const btnClose = document.getElementById('btnCloseLetter');
  const letterScroll = letterModal ? letterModal.querySelector('.letter-scroll') : null;

  const bloquearScroll = () => {
    document.body.classList.add('sin-scroll');
    if (letterScroll) letterScroll.scrollTop = 0;
  };

  const liberarScroll = () => {
    document.body.classList.remove('sin-scroll');
  };

  if (btnOpen && overlay) {
    btnOpen.addEventListener('click', () => {
      overlay.classList.add('hidden');
      setTimeout(() => {
        overlay.style.display = 'none';
        if (letterModal) {
          letterModal.classList.add('abierta');
          bloquearScroll();
        }
      }, 400);
    });
  }

  if (btnClose && letterModal) {
    const cerrar = () => {
      letterModal.classList.remove('abierta');
      liberarScroll();
      setTimeout(() => {
        overlay.style.display = 'flex';
        overlay.classList.remove('hidden');
      }, 450);
    };
    btnClose.addEventListener('click', cerrar);
    letterModal.addEventListener('click', (e) => {
      if (e.target === letterModal) cerrar();
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && letterModal && letterModal.classList.contains('abierta')) {
      letterModal.classList.remove('abierta');
      liberarScroll();
    }
  });
});