const textoPrimerMomento = 'Acá empieza todo, y la verdad es que todavía me cuesta poner en palabras lo que sentí ese día. Recuerdo cada detalle como si hubiera sido ayer: la luz, tu voz, esa forma tuya de estar que me desarma sin hacer nada. Nunca imaginé que algo tan simple pudiera quedarse conmigo para siempre, pero desde ese momento entendí que hay cosas que no se explican, se sienten. Me acuerdo de la charla que se nos fue de las manos, de las risas que no podíamos contener y de ese silencio que tampoco hacía falta llenar porque estábamos ahí, nomas. Pensé en vos mil veces después, en cómo me mirabas, en cómo me hacías sentir cómoda sin yo tener que fingir nada. Y cada vez que vuelvo a esto, vuelvo a sentir lo mismo: esa mezcla de nervios, de calma y de ganas de que el tiempo se quede un ratito más. Si hay un punto donde todo empezó a tomar sentido, creo que fue acá, en este momento que hoy se volvió para siempre parte de mi.';

const momentos = Array.from({ length: 83 }, (_, i) => {
  const numero = i + 1;
  const esVideo = numero >= 81;
  return {
    img: `img/${numero}.${esVideo ? 'mp4' : 'png'}`,
    tipo: esVideo ? 'video' : 'imagen',
    giro: 0,
    titulo: numero === 1 ? 'El comienzo' : `Momento ${String(numero).padStart(2, '0')}`,
    texto: numero === 1 ? textoPrimerMomento : 'Acá escribo lo que pasó en este momento.'
  };
});

const overlay = document.getElementById('surpriseOverlay');
const tapa = document.getElementById('tapa');
const tapaBack = document.getElementById('tapaBack');
const pagina = document.getElementById('pagina');
const visorFoto = document.getElementById('visorFoto');
const fotoActual = document.getElementById('fotoActual');
const videoActual = document.getElementById('videoActual');
const visorLoader = document.getElementById('visorLoader');
const contador = document.getElementById('contador');
const momentoNum = document.getElementById('momentoNum');
const momentoTitulo = document.getElementById('momentoTitulo');
const momentoTexto = document.getElementById('momentoTexto');
const btnAnterior = document.getElementById('btnAnterior');
const btnSiguiente = document.getElementById('btnSiguiente');
const btnCerrar = document.querySelector('.btn-back');
const btnGirar = document.getElementById('btnGirar');

let actual = 0;
let tokenCarga = 0;

function iniciarCarga() {
  const token = ++tokenCarga;
  const inicio = Date.now();
  visorLoader.classList.add('activo');

  return () => {
    const restante = Math.max(0, 300 - (Date.now() - inicio));
    setTimeout(() => {
      if (token !== tokenCarga) return;
      visorLoader.classList.remove('activo');
      fotoActual.classList.remove('cambiando');
      videoActual.classList.remove('cambiando');
    }, restante);
  };
}

function aplicarGiro() {
  const momento = momentos[actual];
  const giro = momento.giro || 0;
  fotoActual.style.setProperty('--giro', giro + 'deg');
  videoActual.style.setProperty('--giro', giro + 'deg');
  const etiqueta = `Girar ${momento.tipo === 'video' ? 'video' : 'foto'} (${giro}°)`;
  btnGirar.setAttribute('aria-label', etiqueta);
  btnGirar.title = etiqueta;
}

function mostrar(index) {
  actual = (index + momentos.length) % momentos.length;
  const momento = momentos[actual];
  const terminar = iniciarCarga();
  const esVideo = momento.tipo === 'video';

  fotoActual.classList.add('cambiando');
  videoActual.classList.add('cambiando');
  videoActual.pause();

  contador.textContent = `${actual + 1}/${momentos.length}`;
  momentoNum.textContent = `${String(actual + 1).padStart(2, '0')} / ${momentos.length}`;
  momentoTitulo.textContent = momento.titulo;
  momentoTexto.textContent = momento.texto;
  aplicarGiro();

  setTimeout(() => {
    if (esVideo) {
      fotoActual.style.display = 'none';
      videoActual.style.display = 'block';
      videoActual.classList.remove('oculto');
      videoActual.onloadeddata = terminar;
      videoActual.oncanplay = terminar;
      videoActual.onerror = terminar;
      videoActual.src = momento.img;
      videoActual.load();
    } else {
      videoActual.pause();
      videoActual.classList.add('oculto');
      videoActual.style.display = 'none';
      videoActual.removeAttribute('src');
      fotoActual.style.display = 'block';
      fotoActual.onload = terminar;
      fotoActual.onerror = terminar;
      fotoActual.src = momento.img;
      fotoActual.alt = `Momento ${actual + 1}: ${momento.titulo}`;
    }
  }, 140);
}

function abrirAlbum() {
  if (overlay.classList.contains('abriendo')) return;
  overlay.classList.add('abriendo');
  pagina.classList.add('abierta');
  mostrar(0);
  window.scrollTo(0, 0);
  setTimeout(() => {
    overlay.style.display = 'none';
    overlay.classList.remove('abriendo');
  }, 820);
}

function cerrarAlbum() {
  if (overlay.classList.contains('cerrando')) return;
  overlay.style.display = 'flex';
  overlay.classList.remove('hidden');
  overlay.classList.add('cerrando');
  videoActual.pause();
  setTimeout(() => {
    pagina.classList.remove('abierta');
    overlay.classList.remove('cerrando');
  }, 720);
}

tapa.addEventListener('click', abrirAlbum);
tapaBack.addEventListener('click', (event) => event.stopPropagation());
btnCerrar.addEventListener('click', (event) => {
  event.preventDefault();
  cerrarAlbum();
});

btnAnterior.addEventListener('click', () => mostrar(actual - 1));
btnSiguiente.addEventListener('click', () => mostrar(actual + 1));
btnGirar.addEventListener('click', () => {
  const momento = momentos[actual];
  momento.giro = ((momento.giro || 0) + 90) % 360;
  aplicarGiro();
  btnGirar.classList.remove('girando');
  void btnGirar.offsetWidth;
  btnGirar.classList.add('girando');
});

let toqueInicial = null;

visorFoto.addEventListener('touchstart', (event) => {
  toqueInicial = event.changedTouches[0].clientX;
}, { passive: true });

visorFoto.addEventListener('touchend', (event) => {
  if (toqueInicial === null) return;
  const desplazamiento = event.changedTouches[0].clientX - toqueInicial;
  toqueInicial = null;
  if (Math.abs(desplazamiento) < 45) return;
  mostrar(desplazamiento > 0 ? actual - 1 : actual + 1);
}, { passive: true });

document.addEventListener('keydown', (event) => {
  if (!pagina.classList.contains('abierta')) return;
  if (event.key === 'ArrowLeft') mostrar(actual - 1);
  if (event.key === 'ArrowRight') mostrar(actual + 1);
});

mostrar(0);
