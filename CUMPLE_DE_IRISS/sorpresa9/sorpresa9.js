document.addEventListener('DOMContentLoaded', () => {
  const overlay = document.getElementById('surpriseOverlay');
  const btnOpen = document.getElementById('btnOpenSorpresa');
  const capitulo = document.getElementById('capituloUno');
  const textoGuia = document.getElementById('textoGuia');
  const cursor = document.getElementById('cursorTexto');
  const btnSeguir = document.getElementById('btnSeguir');
  const cierre = document.getElementById('cierreCapitulo');
  const dots = Array.from(document.querySelectorAll('.capitulo-dots span'));

  const segmentos = [
    { texto: 'Estamos llegando al final, Iriss. ' },
    { texto: 'Guardé esta última parte para vos, así que tomate tu tiempo. ' },
    { texto: 'Te voy guiando paso a paso: no tenés que decidir nada. ' },
    { texto: 'Pachuchita de ojos bonitos, te mereces esto y mucho más, sí. ' },
    { texto: 'Yo ya estoy acá. Vos solo seguí 💜', clase: 'ultima' }
  ];

  const dormir = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  async function escribirSegmento(segmento) {
    const span = document.createElement('span');
    if (segmento.clase) span.className = segmento.clase;
    textoGuia.insertBefore(span, cursor);

    for (const caracter of segmento.texto) {
      span.textContent += caracter;
      const pausa = caracter === '.' ? 280 : caracter === ',' ? 110 : 28 + Math.random() * 14;
      await dormir(pausa);
    }
  }

  async function iniciarCapitulo() {
    capitulo.classList.add('activo');

    for (const segmento of segmentos) {
      await escribirSegmento(segmento);
      await dormir(320);
    }

    cursor.classList.add('terminado');
    btnSeguir.classList.add('visible');
  }

  if (btnOpen && overlay) {
    btnOpen.addEventListener('click', () => {
      overlay.classList.add('hidden');
      setTimeout(() => {
        overlay.style.display = 'none';
      }, 400);
      setTimeout(iniciarCapitulo, 650);
    });
  }

  if (btnSeguir) {
    btnSeguir.addEventListener('click', () => {
      capitulo.classList.add('cerrado');
      dots[0].classList.remove('actual');
      if (dots[1]) dots[1].classList.add('actual');
      cierre.classList.add('visible');
      document.dispatchEvent(new CustomEvent('sorpresa9:capitulo1-listo'));
      setTimeout(() => {
        window.location.href = 'inicio/index.html?capitulo=1&listo=1';
      }, 900);
    });
  }
});
