const momentos = [
  {
    img: '../img/detalle.png',
    titulo: 'El comienzo',
    texto: 'Acá empieza todo, y la verdad es que todavía me cuesta poner en palabras lo que sentí ese día. Recuerdo cada detalle como si hubiera sido ayer: la luz, tu voz, esa forma tuya de estar que me desarma sin hacer nada. Nunca imaginé que algo tan simple pudiera quedarse conmigo para siempre, pero desde ese momento entendí que hay cosas que no se explican, se sienten. Me acuerdo de la charla que se nos fue de las manos, de las risas que no podíamos contener y de ese silencio que tampoco hacía falta llenar porque estábamos ahí, nomas. Pensé en vos mil veces después, en cómo me mirabas, en cómo me hacías sentir cómoda sin yo tener que fingir nada. Y cada vez que vuelvo a esto, vuelvo a sentir lo mismo: esa mezcla de nervios, de calma y de ganas de que el tiempo se quede un ratito más. Si hay un punto donde todo empezó a tomar sentido, creo que fue acá, en este momento que hoy se volvió para siempre parte de mi.'
  },
  {
    img: '../img/deseo.png',
    titulo: 'Nuestros deseos',
    texto: 'Las cosas que soñamos juntos y los planes que fuimos armando sin darnos cuenta.'
  },
  {
    img: '../img/memorias.png',
    titulo: 'Memorias guardadas',
    texto: 'Cada charla, cada risa y cada momento simple que se volvió un recuerdo enorme.'
  },
  {
    img: '../img/jardin.png',
    titulo: 'Nuestro jardín',
    texto: 'Ese rincón que es solo nuestro, donde crecen las flores y las cosas lindas.'
  },
  {
    img: '../img/carta2.png',
    titulo: 'Lo que no te dije',
    texto: 'Palabras que a veces no salen pero que pienso siempre. Acá va mi carta.'
  },
  {
    img: '../img/bts.png',
    titulo: 'Nuestra música',
    texto: 'Las canciones que nos representan y que siempre me hacen acordar a vos.'
  },
  {
    img: '../img/image.png',
    titulo: 'Una sonrisa tuya',
    texto: 'Acá escribo qué pasó en este momento y por qué se me quedó para siempre.'
  },
  {
    img: '../img/image copy.png',
    titulo: 'Ese día',
    texto: 'Detalles del día, lo que hicimos, lo que reímos y lo que guardé.'
  },
  {
    img: '../img/image copy 2.png',
    titulo: 'Entre nosotros',
    texto: 'Una charla que parecía común y terminó siendo de las que no se olvidan.'
  },
  {
    img: '../img/image copy 3.png',
    titulo: 'Cerca tuyo',
    texto: 'Lo que sentí en este momento, contado con mis palabras.'
  },
  {
    img: '../img/image copy 4.png',
    titulo: 'Otro recuerdo',
    texto: 'Acá va el suceso que quiero que nunca se nos pierda.'
  },
  {
    img: '../img/image copy 5.png',
    titulo: 'Momentos simples',
    texto: 'De esos que parecen chiquitos y después se vuelven los más lindos.'
  },
  {
    img: '../img/image copy 6.png',
    titulo: 'Tu manera de ser',
    texto: 'Lo que me gustó de vos en este momento y cómo me hizo sentir.'
  },
  {
    img: '../img/cartaa.png',
    titulo: 'Otra carta',
    texto: 'Una cosa más que quería decirte y que acá por fin te escribo.'
  },
  {
    img: '../img/wasa.png',
    titulo: 'Nuestro código',
    texto: 'Las palabras y los gestos que solo nosotros entendemos.'
  },
  {
    img: '../img/9.png',
    titulo: 'Sorpresas',
    texto: 'Cuando las cosas salieron mejor de lo que imaginaba.'
  },
  {
    img: '../img/listonrojo.png',
    titulo: 'Detalles',
    texto: 'Los detallitos que a lo mejor nadie más notó, pero yo sí guardé.'
  },
  {
    img: '../sorpresa7/papel_amor/1.png',
    titulo: 'Momento 18',
    texto: 'Acá escribo lo que pasó en este momento.'
  },
  {
    img: '../sorpresa7/papel_amor/2.png',
    titulo: 'Momento 19',
    texto: 'Acá escribo lo que pasó en este momento.'
  },
  {
    img: '../sorpresa7/papel_amor/3.png',
    titulo: 'Momento 20',
    texto: 'Acá escribo lo que pasó en este momento.'
  }
];

const overlay = document.getElementById('surpriseOverlay');
const tapa = document.getElementById('tapa');
const tapaBack = document.getElementById('tapaBack');
const pagina = document.getElementById('pagina');
const fotoActual = document.getElementById('fotoActual');
const visorLoader = document.getElementById('visorLoader');
const contador = document.getElementById('contador');
const momentoNum = document.getElementById('momentoNum');
const momentoTitulo = document.getElementById('momentoTitulo');
const momentoTexto = document.getElementById('momentoTexto');
const btnAnterior = document.getElementById('btnAnterior');
const btnSiguiente = document.getElementById('btnSiguiente');
const btnCerrar = document.querySelector('.btn-back');

let actual = 0;
let imagenLista = true;
let minimoCumplido = true;

function verificarLoader() {
  if (imagenLista && minimoCumplido) visorLoader.classList.remove('activo');
}

function mostrar(index, conLoader = false) {
  actual = (index + momentos.length) % momentos.length;
  const momento = momentos[actual];

  if (conLoader) {
    imagenLista = false;
    minimoCumplido = false;
    visorLoader.classList.add('activo');
    setTimeout(() => {
      minimoCumplido = true;
      verificarLoader();
    }, 3000);
  }

  fotoActual.classList.add('cambiando');
  contador.textContent = `${actual + 1}/${momentos.length}`;
  momentoNum.textContent = `${String(actual + 1).padStart(2, '0')} / ${momentos.length}`;
  momentoTitulo.textContent = momento.titulo;
  momentoTexto.textContent = momento.texto;

  setTimeout(() => {
    fotoActual.onload = () => {
      fotoActual.classList.remove('cambiando');
      imagenLista = true;
      verificarLoader();
    };
    fotoActual.onerror = () => {
      fotoActual.classList.remove('cambiando');
      imagenLista = true;
      verificarLoader();
    };
    fotoActual.src = momento.img;
    fotoActual.alt = `Momento ${actual + 1}: ${momento.titulo}`;
  }, 140);
}

function abrirAlbum() {
  if (overlay.classList.contains('abriendo')) return;
  overlay.classList.add('abriendo');
  pagina.classList.add('abierta');
  mostrar(0, true);
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

let toqueInicial = null;

fotoActual.addEventListener('touchstart', (event) => {
  toqueInicial = event.changedTouches[0].clientX;
}, { passive: true });

fotoActual.addEventListener('touchend', (event) => {
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
