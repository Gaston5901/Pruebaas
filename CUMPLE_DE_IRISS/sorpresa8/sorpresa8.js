document.addEventListener('DOMContentLoaded', () => {
  const overlay = document.getElementById('surpriseOverlay');
  const btnOpen = document.getElementById('btnOpenSorpresa');
  const saludos = document.getElementById('saludos');
  const marco = document.getElementById('saludosMarco');
  const video = document.getElementById('saludosVideo');
  const logo = document.getElementById('logoVideo');
  const conteo = document.getElementById('conteoLogo');
  const conteoNumero = document.getElementById('conteoNumero');
  const cinta = document.getElementById('saludosCinta');
  const fin = document.getElementById('finSaludos');
  const btnRepetir = document.getElementById('btnRepetir');

  const DURACION_LOGO = 5;

  let ultimoNumero = null;
  let conteoFallback = null;
  let logoCortado = false;

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
    const restante = Math.max(0, DURACION_LOGO - logo.currentTime);
    ponerNumero(Math.max(1, Math.ceil(restante)));
  }

  function iniciarConteo() {
    if (!conteo) return;
    detenerConteo();
    ultimoNumero = null;
    if (cinta) cinta.classList.add('oculto');
    conteo.classList.add('activo');

    if (logo) {
      logo.muted = true;
      logo.defaultMuted = true;
      logo.volume = 0;
      ponerNumero(DURACION_LOGO);
      return;
    }

    let restante = DURACION_LOGO;
    ponerNumero(restante);
    conteoFallback = setInterval(() => {
      restante -= 1;
      if (restante > 0) ponerNumero(restante);
    }, 1000);
  }

  function detenerConteo() {
    if (conteo) conteo.classList.remove('activo');
    if (cinta) cinta.classList.remove('oculto');
    if (conteoFallback) {
      clearInterval(conteoFallback);
      conteoFallback = null;
    }
  }

  function verificarCorteLogo() {
    if (!logo || logoCortado) return;
    if (logo.currentTime >= DURACION_LOGO) {
      logoCortado = true;
      logo.pause();
      reproducirHappy();
    }
  }

  function reproducirHappy() {
    if (!video) return;
    logoCortado = true;
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
    logoCortado = false;

    if (!logo) {
      reproducirHappy();
      return;
    }

    if (video) video.classList.add('oculto');
    logo.style.display = 'block';
    logo.classList.remove('oculto');
    logo.muted = true;
    logo.defaultMuted = true;
    logo.volume = 0;
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
      if (overlay) {
        overlay.classList.add('hidden');
        setTimeout(() => {
          overlay.style.display = 'none';
        }, 400);
      }
      mostrarSpinner();
      Promise.all([videoPreload, new Promise(resolve => setTimeout(resolve, 5000))]).then(iniciarReproduccion);
      setTimeout(iniciarReproduccion, 7000);
    });
  }

  if (btnRepetir) btnRepetir.addEventListener('click', reproducirHappy);

  if (logo) {
    logo.addEventListener('ended', reproducirHappy);
    logo.addEventListener('timeupdate', () => {
      verificarCorteLogo();
      actualizarConteo();
    });
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

  function preloadVideo(videoEl) {
    if (!videoEl) return Promise.resolve();
    return new Promise(resolve => {
      let terminado = false;
      const finish = () => {
        if (terminado) return;
        terminado = true;
        videoEl.removeEventListener('canplay', finish);
        videoEl.removeEventListener('loadeddata', finish);
        videoEl.removeEventListener('error', finish);
        clearTimeout(temporizador);
        resolve();
      };
      const temporizador = setTimeout(finish, 9000);
      videoEl.preload = 'auto';
      videoEl.addEventListener('canplay', finish);
      videoEl.addEventListener('loadeddata', finish);
      videoEl.addEventListener('error', finish);
      videoEl.load();
    });
  }

  const videoPreload = Promise.all([preloadVideo(logo), preloadVideo(video)]);

  const loadingOverlay = document.getElementById('loadingOverlay');
  const loadingText = document.getElementById('loadingText');
  const puntosCarga = ['...', '.', '..', '...'];
  let indicePuntos = 0;
  let intervaloPuntos = null;

  function iniciarPuntos() {
    detenerPuntos();
    intervaloPuntos = setInterval(() => {
      indicePuntos = (indicePuntos + 1) % puntosCarga.length;
      if (loadingText) loadingText.textContent = 'Cargando tu sorpresa' + puntosCarga[indicePuntos];
    }, 300);
  }

  function detenerPuntos() {
    if (intervaloPuntos) clearInterval(intervaloPuntos);
    intervaloPuntos = null;
    if (loadingText) loadingText.textContent = 'Cargando tu sorpresa...';
  }

  function mostrarSpinner() {
    if (!loadingOverlay) return;
    loadingOverlay.style.display = 'grid';
    loadingOverlay.classList.add('activo');
    iniciarPuntos();
  }

  function ocultarSpinner() {
    detenerPuntos();
    if (!loadingOverlay) return;
    loadingOverlay.classList.remove('activo');
    setTimeout(() => { loadingOverlay.style.display = 'none'; }, 250);
  }

  let reproduccionIniciada = false;

  function iniciarReproduccion() {
    if (reproduccionIniciada) return;
    reproduccionIniciada = true;
    ocultarSpinner();
    reproducir();
  }
});
