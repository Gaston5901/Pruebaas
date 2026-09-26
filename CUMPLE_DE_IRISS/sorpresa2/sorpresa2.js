document.addEventListener('DOMContentLoaded', () => {
  if (window.lucide) {
    lucide.createIcons();
  }

  const overlay = document.getElementById('surpriseOverlay');
  const btnAbrir = document.getElementById('btnOpenAlbum');
  const libro = document.getElementById('libroWrap');
  const tapa = document.getElementById('tapa');
  const hojas = Array.from(document.querySelectorAll('.hoja'));
  const btnVolver = document.getElementById('btnVolver');
  const btnSiguiente = document.getElementById('btnSiguiente');
  const navegacion = document.querySelector('.navegacion');
  const contador = document.getElementById('contador');

  const total = hojas.length;
  let paginaActual = 0;
  let animando = false;

  /* === AJUSTE RESPONSIVE DEL TAMAÑO DEL LIBRO === */
  const RATIO = 4.1 / 3;
  function ajustarTamaño() {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const topH = document.querySelector('.top-bar').offsetHeight;
    const navH = navegacion.offsetHeight;
    const gapY = parseFloat(getComputedStyle(document.body).gap) || 10;
    const padY = Math.max(10, vh * 0.05);
    const landscape = vw > vh;

    const disponibleW = Math.max(200, vw - 24 - (landscape ? 110 : 0));
    const disponibleH = Math.max(260, vh - topH - (landscape ? 0 : navH) - gapY * 2 - padY - 6);

    let ancho = Math.min(disponibleW, disponibleH * 0.75);

    const maxAncho = 420;
    ancho = Math.min(ancho, maxAncho);
    ancho = Math.max(ancho, 180);

    const alto = ancho * RATIO;
    libro.style.width = ancho + 'px';
    libro.style.height = alto + 'px';

    if (window.innerWidth > 480) {
      const maxAltoVh = vh * 0.72;
      if (alto > maxAltoVh) {
        const nuevoAncho = maxAltoVh * 0.75;
        if (nuevoAncho >= 180) {
          libro.style.width = nuevoAncho + 'px';
          libro.style.height = nuevoAncho * RATIO + 'px';
        }
      }
    }
  }

  function ajustarTodo() {
    ajustarTamaño();
    actualizarNavegacion();
  }

  window.addEventListener('resize', () => {
    clearTimeout(window.__ajResize);
    window.__ajResize = setTimeout(ajustarTamaño, 100);
  });

  window.addEventListener('orientationchange', () => {
    setTimeout(ajustarTamaño, 250);
  });

  const ACTIVE_Z = total * 2;

  function actualizarZ() {
    hojas.forEach((hoja, i) => {
      hoja.style.zIndex = hoja.classList.contains('volteada') ? (total - i + 1) : (ACTIVE_Z - i);
    });
  }

  actualizarZ();
  ajustarTodo();

  function actualizarNavegacion() {
    const abierto = libro.classList.contains('abierto');

    if (!abierto) {
      contador.textContent = '✦';
      btnVolver.classList.remove('visible');
      btnSiguiente.classList.add('oculto');
      return;
    }

    btnSiguiente.classList.remove('oculto');
    contador.textContent = `${paginaActual + 1}/${total}`;

    btnVolver.classList.add('visible');

    if (paginaActual >= total - 1) {
      navegacion.classList.add('sin-siguiente');
    } else {
      navegacion.classList.remove('sin-siguiente');
    }
  }

  function pasarPagina() {
    if (paginaActual >= total - 1 || animando) return;
    animando = true;

    const hoja = hojas[paginaActual];
    hoja.classList.add('volteada');
    paginaActual++;
    actualizarNavegacion();

    finalizarFlip(hoja, () => {
      actualizarZ();
      animando = false;
    });
  }

  function volverPagina() {
    if (paginaActual <= 0 || animando) return;
    animando = true;

    paginaActual--;
    const hoja = hojas[paginaActual];
    hoja.classList.remove('volteada');
    actualizarZ();
    actualizarNavegacion();

    finalizarFlip(hoja, () => {
      animando = false;
    });
  }

  function finalizarFlip(hoja, callback) {
    const alTerminar = (e) => {
      if (e.propertyName !== 'transform') return;
      hoja.removeEventListener('transitionend', alTerminar);
      clearTimeout(hoja._flipFallback);
      callback();
    };
    hoja.addEventListener('transitionend', alTerminar);
    hoja._flipFallback = setTimeout(() => {
      hoja.removeEventListener('transitionend', alTerminar);
      callback();
    }, 1000);
  }

  function abrirLibro() {
    if (libro.classList.contains('abierto')) return;
    tapa.classList.add('abriendo');
    setTimeout(() => {
      libro.classList.add('abierto');
      ajustarTodo();
    }, 950);
  }

  function cerrarLibro() {
    if (!libro.classList.contains('abierto')) return;
    animando = true;
    const alCerrar = () => {
      animando = false;
      ajustarTodo();
    };
    libro.classList.remove('abierto');
    tapa.classList.add('volviendo');
    setTimeout(() => {
      tapa.classList.remove('abriendo', 'volviendo');
      alCerrar();
    }, 850);
  }

  btnAbrir.addEventListener('click', () => {
    overlay.classList.add('hidden');
    setTimeout(() => {
      overlay.style.display = 'none';
    }, 250);
  });

  tapa.addEventListener('click', abrirLibro);

  btnSiguiente.addEventListener('click', pasarPagina);
  btnVolver.addEventListener('click', () => {
    if (paginaActual === 0) {
      cerrarLibro();
    } else {
      volverPagina();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' || e.key === ' ') pasarPagina();
    if (e.key === 'ArrowLeft') {
      if (paginaActual === 0) cerrarLibro();
      else volverPagina();
    }
  });
});