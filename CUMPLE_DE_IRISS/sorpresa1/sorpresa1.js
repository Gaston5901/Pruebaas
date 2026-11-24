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

  const audio = document.getElementById('cancionAudio');
  const playBtn = document.getElementById('cancionPlay');
  const nextBtn = document.getElementById('cancionNext');
  const muteBtn = document.getElementById('cancionMute');
  const nombre = document.getElementById('cancionNombre');
  const progreso = document.getElementById('cancionProgreso');
  const tiempo = document.getElementById('cancionTiempo');

  if (!audio || !playBtn) return;

  const playlist = [
    { name: "Chicago - You're the Inspiration", src: "You'reTheInspiration.mp3" }
  ];

  let indice = 0;

  const formato = (segundos) => {
    if (!Number.isFinite(segundos)) return '0:00';
    const minutos = Math.floor(segundos / 60);
    const segs = Math.floor(segundos % 60);
    return minutos + ':' + segs.toString().padStart(2, '0');
  };

  const intentarReproducir = () => {
    const intento = audio.play();
    if (intento && typeof intento.catch === 'function') {
      intento.catch(() => {});
    }
  };

  const cargarCancion = () => {
    audio.src = playlist[indice].src;
    if (nombre) nombre.textContent = playlist[indice].name;
    if (progreso) progreso.style.width = '0%';
    if (tiempo) tiempo.textContent = '0:00 / 0:00';
    audio.load();
  };

  const actualizarProgreso = () => {
    const duracion = audio.duration || 0;
    if (progreso) {
      progreso.style.width = duracion ? (audio.currentTime / duracion) * 100 + '%' : '0%';
    }
    if (tiempo) {
      tiempo.textContent = formato(audio.currentTime) + ' / ' + formato(duracion);
    }
  };

  const actualizarBoton = () => {
    const reproduciendo = !audio.paused && !audio.ended;
    playBtn.textContent = reproduciendo ? '❚❚' : '▶';
    playBtn.setAttribute('aria-label', reproduciendo ? 'Pausar canción' : 'Reproducir canción');
    playBtn.title = reproduciendo ? 'Pausar canción' : 'Reproducir canción';
  };

  cargarCancion();

  playBtn.addEventListener('click', () => {
    if (audio.paused || audio.ended) {
      intentarReproducir();
    } else {
      audio.pause();
    }
  });

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      indice = (indice + 1) % playlist.length;
      cargarCancion();
      intentarReproducir();
    });
  }

  if (muteBtn) {
    muteBtn.addEventListener('click', () => {
      audio.muted = !audio.muted;
      muteBtn.textContent = audio.muted ? '🔇' : '🔊';
      muteBtn.setAttribute('aria-label', audio.muted ? 'Activar sonido' : 'Silenciar canción');
      muteBtn.title = audio.muted ? 'Activar sonido' : 'Silenciar canción';
    });
  }

  audio.addEventListener('timeupdate', actualizarProgreso);
  audio.addEventListener('loadedmetadata', actualizarProgreso);
  audio.addEventListener('play', actualizarBoton);
  audio.addEventListener('pause', actualizarBoton);
  audio.addEventListener('ended', () => {
    indice = (indice + 1) % playlist.length;
    cargarCancion();
    intentarReproducir();
  });
});
