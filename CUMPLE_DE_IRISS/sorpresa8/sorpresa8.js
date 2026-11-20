document.addEventListener('DOMContentLoaded', () => {
  const overlay = document.getElementById('surpriseOverlay');
  const btnOpen = document.getElementById('btnOpenSorpresa');
  const saludos = document.getElementById('saludos');
  const marco = document.getElementById('saludosMarco');
  const video = document.getElementById('saludosVideo');
  const fin = document.getElementById('finSaludos');
  const btnRepetir = document.getElementById('btnRepetir');

  function ajustarAspecto() {
    if (!video || !marco || !video.videoWidth || !video.videoHeight) return;
    const aspecto = video.videoWidth / video.videoHeight;
    if (Number.isFinite(aspecto) && aspecto > 0) {
      marco.style.setProperty('--video-aspect', aspecto.toFixed(4));
    }
  }

  if (video) {
    video.controls = false;
    video.disablePictureInPicture = true;
    if ('disableRemotePlayback' in video) {
      video.disableRemotePlayback = true;
    }
    video.addEventListener('loadedmetadata', ajustarAspecto);
    ajustarAspecto();
  }

  function reproducir() {
    if (!video) return;

    if (saludos) {
      saludos.classList.add('activo');
      saludos.setAttribute('aria-hidden', 'false');
    }
    if (fin) fin.classList.remove('activo');

    try {
      video.currentTime = 0;
    } catch (e) {}

    const intento = video.play();
    if (intento && typeof intento.catch === 'function') {
      intento.catch(() => {
        video.muted = true;
        const reintento = video.play();
        if (reintento && typeof reintento.catch === 'function') {
          reintento.catch(() => {});
        }
      });
    }
  }

  if (btnOpen) {
    btnOpen.addEventListener('click', () => {
      if (overlay) overlay.classList.add('hidden');
      reproducir();
      setTimeout(() => {
        if (overlay) overlay.style.display = 'none';
      }, 400);
    });
  }

  if (btnRepetir) btnRepetir.addEventListener('click', reproducir);

  if (video) {
    video.addEventListener('ended', () => {
      if (fin) fin.classList.add('activo');
    });
    video.addEventListener('contextmenu', (e) => e.preventDefault());
    video.addEventListener('dragstart', (e) => e.preventDefault());
  }

  if (marco) {
    marco.addEventListener('contextmenu', (e) => e.preventDefault());
    marco.addEventListener('click', (e) => e.preventDefault());
  }
});
