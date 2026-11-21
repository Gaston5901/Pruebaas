document.addEventListener('DOMContentLoaded', () => {
  const overlay = document.getElementById('surpriseOverlay');
  const btnOpen = document.getElementById('btnOpenSorpresa');
  const saludos = document.getElementById('saludos');
  const marco = document.getElementById('saludosMarco');
  const video = document.getElementById('saludosVideo');
  const logo = document.getElementById('logoVideo');
  const conteo = document.getElementById('conteoLogo');
  const conteoNumero = document.getElementById('conteoNumero');
  const fin = document.getElementById('finSaludos');
  const btnRepetir = document.getElementById('btnRepetir');

  let ultimoNumero = null;
  let conteoFallback = null;

  function ajustarAspecto(videoEl) {
    if (!videoEl || !marco || !videoEl.videoWidth || !videoEl.videoHeight) return;
    const aspecto = videoEl.videoWidth / videoEl.videoHeight;
    if (Number.isFinite(aspecto) && aspecto > 0) {
      marco.style.setProperty('--video-aspect', aspecto.toFixed(4));
    }
  }

  function preparar(videoEl) {
    if (!videoEl) return;
    videoEl.controls = false;
    videoEl.disablePictureInPicture = true;
    if ('disableRemotePlayback' in videoEl) {
      videoEl.disableRemotePlayback = true;
    }
    videoEl.addEventListener('loadedmetadata', () => ajustarAspecto(videoEl));
    videoEl.addEventListener('contextmenu', (e) => e.preventDefault());
    videoEl.addEventListener('dragstart', (e) => e.preventDefault());
  }

  function intentarPlay(videoEl) {
    if (!videoEl) return;
    const intento = videoEl.play();
    if (intento && typeof intento.catch === 'function') {
      intento.catch(() => {
        videoEl.muted = true;
        const reintento = videoEl.play();
        if (reintento && typeof reintento.catch === 'function') {
          reintento.catch(() => {});
        }
      });
    }
  }

  function mostrarSaludos() {
    if (saludos) {
      saludos.classList.add('activo');
      saludos.setAttribute('aria-hidden', 'false');
    }
    if (fin) fin.classList.remove('activo');
  }

  function ponerNumero(numero) {
    if (numero === ultimoNumero) return;
    ultimoNumero = numero;
    if (!conteoNumero) return;
    conteoNumero.textContent = numero;
    conteoNumero.classList.remove('pulso');
    void conteoNumero.offsetWidth;
    conteoNumero.classList.add('pulso');
  }

  function actualizarConteo() {
    if (!logo || !conteo || !conteo.classList.contains('activo')) return;
    if (Number.isFinite(logo.duration) && logo.duration > 0) {
      ponerNumero(Math.max(1, Math.ceil(logo.duration - logo.currentTime)));
    }
  }

  function iniciarConteo() {
    if (!conteo) return;
    detenerConteo();
    ultimoNumero = null;
    conteo.classList.add('activo');

    if (logo && Number.isFinite(logo.duration) && logo.duration > 0) {
      ponerNumero(Math.ceil(logo.duration));
      return;
    }

    let restante = 3;
    ponerNumero(restante);
    conteoFallback = setInterval(() => {
      restante -= 1;
      if (restante > 0) ponerNumero(restante);
    }, 1000);
  }

  function detenerConteo() {
    if (conteo) conteo.classList.remove('activo');
    if (conteoFallback) {
      clearInterval(conteoFallback);
      conteoFallback = null;
    }
  }

  function reproducirHappy() {
    if (!video) return;
    mostrarSaludos();
    detenerConteo();
    ajustarAspecto(video);
    video.classList.remove('oculto');

    if (logo) {
      logo.classList.add('oculto');
      setTimeout(() => {
        logo.style.display = 'none';
        logo.pause();
      }, 450);
    }

    try {
      video.currentTime = 0;
    } catch (e) {}
    intentarPlay(video);
  }

  function reproducir() {
    mostrarSaludos();

    if (!logo) {
      reproducirHappy();
      return;
    }

    if (video) video.classList.add('oculto');
    logo.style.display = 'block';
    logo.classList.remove('oculto');
    ajustarAspecto(logo);
    iniciarConteo();

    try {
      logo.currentTime = 0;
    } catch (e) {}
    intentarPlay(logo);
  }

  preparar(video);
  preparar(logo);
  ajustarAspecto(video);

  if (btnOpen) {
    btnOpen.addEventListener('click', () => {
      if (overlay) overlay.classList.add('hidden');
      reproducir();
      setTimeout(() => {
        if (overlay) overlay.style.display = 'none';
      }, 400);
    });
  }

  if (btnRepetir) btnRepetir.addEventListener('click', reproducirHappy);

  if (logo) {
    logo.addEventListener('ended', reproducirHappy);
    logo.addEventListener('timeupdate', actualizarConteo);
    logo.addEventListener('loadedmetadata', actualizarConteo);
  }

  if (video) {
    video.addEventListener('ended', () => {
      if (fin) fin.classList.add('activo');
    });
  }

  if (marco) {
    marco.addEventListener('contextmenu', (e) => e.preventDefault());
    marco.addEventListener('click', (e) => e.preventDefault());
  }
});
