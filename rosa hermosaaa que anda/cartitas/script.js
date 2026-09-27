// ============================================================
//  SEIS CARTITAS PARA VOS
//  - Arma el abanico de sobres (6)
//  - Al tocar uno, vuela al centro, se abre y se lee
//  - Queda marcado como "leída" (se guarda en el navegador)
// ============================================================

var CLAVE = 'cartitas:leidas';

var abanico = document.getElementById('abanico');
var escena = document.querySelector('.escena');
var plantilla = document.getElementById('plantilla-sobre');
var cartas = document.querySelectorAll('.carta');

var lector = document.getElementById('lector');
var fondo = document.getElementById('lector-fondo');
var cerrarBtn = document.getElementById('cerrar');
var elTitulo = document.getElementById('letra-titulo');
var elSaludo = document.getElementById('letra-saludo');
var elCuerpo = document.getElementById('letra-cuerpo');
var laFirma = document.getElementById('letra-firma');
var elPapel = document.getElementById('papel');

var contador = document.getElementById('contador');
var hint = document.getElementById('hint');

var leidas = leerGuardadas();
var abierto = null;
var ocupado = false;
var cerrando = false;

// ------------------------------------------------------------
//  Armado del abanico
// ------------------------------------------------------------
function crearSobres() {
    for (var i = 0; i < cartas.length; i++) {
        var sobre = plantilla.content.firstElementChild.cloneNode(true);

        sobre.querySelector('.numero').textContent = String(i + 1);
        sobre.setAttribute('aria-label', 'Abrir la cartita ' + (i + 1));
        sobre.dataset.indice = String(i);

        if (leidas.indexOf(i) !== -1) {
            sobre.classList.add('leida');
        }

        sobre.addEventListener('click', function () {
            abrir(Number(this.dataset.indice));
        });

        abanico.appendChild(sobre);
    }

    acomodar();
}

/* Reparte los sobres: cada uno a un pasito del anterior, con un
   giro leve para que se vea el abanico. El de la derecha va arriba.
   El paso y el ancho del sobre se calculan con el ancho REAL de la
   pantalla, así el abanico siempre entra entero: en un celu angosto
   los sobres se pisan un poco más, pero ninguno se sale de los lados. */
function acomodar() {
    var sobres = abanico.children;
    var total = sobres.length;
    if (total === 0) { return; }

    var medio = (total - 1) / 2;
    var pasos = total - 1;
    // Los valores de diseño viven en :root y no se tocan: así no se van
    // achicando en cada rotación del celu
    var raiz = window.getComputedStyle(document.documentElement);
    var anchoDiseno = parseFloat(raiz.getPropertyValue('--ancho-sobre')) || 176;
    var altoDiseno = parseFloat(raiz.getPropertyValue('--alto-sobre')) || 120;
    var pasoDiseno = parseFloat(raiz.getPropertyValue('--paso')) || 46;
    var giro = parseFloat(raiz.getPropertyValue('--giro')) || 2.6;

    // Margen de 6px: los sobres girados se salen un poquito de su caja
    var disponible = Math.max(200, abanico.clientWidth - 6);
    var paso = pasos > 0 ? Math.min(pasoDiseno, (disponible - anchoDiseno) / pasos) : 0;
    var ancho = anchoDiseno;

    if (paso < 30) {
        // Con el paso mínimo tampoco entra: se achica el sobre para que
        // la franja que se ve de cada uno siga siendo fácil de tocar
        paso = 30;
        ancho = Math.max(88, disponible - pasos * paso);
    }

    var alto = Math.round(ancho * (altoDiseno / anchoDiseno));
    abanico.style.setProperty('--ancho-sobre', Math.round(ancho) + 'px');
    abanico.style.setProperty('--alto-sobre', alto + 'px');

    // Sin transición mientras se acomodan, si no el navegador los deja apilados
    abanico.classList.add('armando');

    for (var i = 0; i < total; i++) {
        var sobre = sobres[i];
        var distancia = Math.abs(i - medio);

        sobre.style.setProperty('--dx', ((i - medio) * paso).toFixed(1) + 'px');
        sobre.style.setProperty('--a', ((i - medio) * giro).toFixed(2) + 'deg');
        sobre.style.setProperty('--y', (distancia * 5).toFixed(1) + 'px');
        sobre.style.setProperty('--z', String(10 + i));
    }

    window.setTimeout(function () {
        abanico.classList.remove('armando');
    }, 60);

    medirDesborde();
}

/* El abanico arranca encurveado hacia abajo y cada sobre va girado, así que
   el de las puntas se pasa un poquito por abajo de la pantalla. Se mide de
   verdad y se guarda ese pedacito como padding extra, para que ningún sobre
   quede cortado ni en un celu apaisado. */
function medirDesborde() {
    var piso = abanico.getBoundingClientRect().bottom;
    var bajo = piso;

    for (var i = 0; i < abanico.children.length; i++) {
        bajo = Math.max(bajo, abanico.children[i].getBoundingClientRect().bottom);
    }

    escena.style.setProperty('--sobra-abajo', Math.max(0, Math.ceil(bajo - piso)) + 'px');
}

// ------------------------------------------------------------
//  Pétalos de fondo
// ------------------------------------------------------------
function soltarPetalos() {
    var capa = document.getElementById('petalos');

    // En el celu, la mitad: se ven igual de lindos y el scroll va más fluido
    var tactil = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
    var cuantos = tactil ? 7 : 14;

    for (var i = 0; i < cuantos; i++) {
        var petalo = document.createElement('span');
        var duracion = 11 + Math.random() * 12;

        petalo.className = 'petalo';
        petalo.style.left = (Math.random() * 100) + 'vw';
        petalo.style.animationDuration = duracion + 's';
        petalo.style.animationDelay = (-Math.random() * duracion) + 's';
        petalo.style.transform = 'scale(' + (0.6 + Math.random() * 0.8) + ')';

        capa.appendChild(petalo);
    }
}

// ------------------------------------------------------------
//  Abrir una carta
// ------------------------------------------------------------
function abrir(indice) {
    if (ocupado || cerrando) { return; }

    var sobre = abanico.children[indice];
    var carta = cartas[indice];
    if (!sobre || !carta) { return; }

    ocupado = true;
    abierto = indice;

    // Calcula cuánto tiene que viajar para llegar al centro de la pantalla
    apuntarAlCentro(sobre);

    abanico.classList.add('abriendo');
    sobre.classList.add('elegido');

    // Carga el texto y el diseño de la carta
    elTitulo.textContent = carta.dataset.titulo;
    elSaludo.textContent = carta.dataset.saludo || '';
    laFirma.textContent = carta.dataset.firma;
    elCuerpo.innerHTML = '';
    elCuerpo.className = 'letra-cuerpo';
    ponerDiseno(carta);
    document.body.classList.add('leyendo');

    var formato = carta.dataset.formato || '';
    var conVersos = false;

    for (var i = 0; i < carta.children.length; i++) {
        var hijo = carta.children[i];
        var parrafo = document.createElement('p');
        /* innerHTML (no textContent) para que se puedan remarcar
           palabras con <em>, <b>, etc. dentro del texto */
        parrafo.innerHTML = hijo.innerHTML.trim();
        /* data-estilo="verso" en un <p> lo vuelve estrofa (sirve para
           cartas que mezclan prosa y poema); si la carta trae
           data-formato="verso", todos los párrafos lo heredan */
        var estilo = hijo.dataset.estilo || formato;
        parrafo.className = estilo;
        if (estilo === 'verso') {
            conVersos = true;
        }
        elCuerpo.appendChild(parrafo);
    }

    /* Los renglones de las estrofas los dibuja cada <p>, así que el
       contenedor no tiene que pintar ninguno (se desalinearían) */
    if (conVersos) {
        elCuerpo.classList.add('con-versos');
    }

    window.setTimeout(function () {
        lector.classList.add('visible');
        lector.setAttribute('aria-hidden', 'false');
        elPapel.scrollTop = 0;
    }, 900);

    marcarLeida(indice);
}

/* Cada carta puede tener su propio papel:
     data-tema="rosa" | "dorado" | "vino"
     data-fondo="ruta/de/la/imagen.png"                              */
function ponerDiseno(carta) {
    elPapel.removeAttribute('data-tema');
    elPapel.removeAttribute('data-fondo');
    elPapel.removeAttribute('data-texto');
    elPapel.removeAttribute('data-velo');
    elPapel.style.removeProperty('--fondo');

    if (carta.dataset.tema) {
        elPapel.setAttribute('data-tema', carta.dataset.tema);
    }

    if (carta.dataset.fondo) {
        elPapel.style.setProperty('--fondo', 'url("' + carta.dataset.fondo + '")');
        elPapel.setAttribute('data-fondo', '');
    }

    /* data-texto="claro": para imágenes de fondo oscuras,
       la carta se pone con letras claras */
    if (carta.dataset.texto) {
        elPapel.setAttribute('data-texto', carta.dataset.texto);
    }

    /* data-velo="fuerte" | "medio" | "suave": cómo de tapada
       queda la imagen de fondo */
    if (carta.dataset.velo) {
        elPapel.setAttribute('data-velo', carta.dataset.velo);
    }
}

/* Mide el sobre en su lugar del abanico (sin hover ni transición)
   y le dice cuántos píxeles tiene que volar para quedar al centro */
function apuntarAlCentro(sobre) {
    sobre.classList.add('midiendo');
    var caja = sobre.getBoundingClientRect();
    sobre.classList.remove('midiendo');

    sobre.style.setProperty('--fx', Math.round(window.innerWidth / 2 - (caja.left + caja.width / 2)) + 'px');
    sobre.style.setProperty('--fy', Math.round(window.innerHeight / 2 - (caja.top + caja.height / 2)) + 'px');
}

// ------------------------------------------------------------
//  Cerrar el lector y devolver el sobre al abanico
// ------------------------------------------------------------
function cerrar() {
    if (!ocupado || cerrando) { return; }
    cerrando = true;

    lector.classList.remove('visible');
    lector.setAttribute('aria-hidden', 'true');

    var sobre = abanico.children[abierto];

    // Primero se cierra la solapa, después el sobre vuelve a su lugar
    window.setTimeout(function () {
        if (sobre) {
            sobre.classList.remove('elegido');
        }
        abanico.classList.remove('abriendo');
        document.body.classList.remove('leyendo');
        abierto = null;
        ocupado = false;
        cerrando = false;
    }, 420);
}

// ------------------------------------------------------------
//  Marcar como leída + contador
// ------------------------------------------------------------
function marcarLeida(indice) {
    var sobre = abanico.children[indice];
    if (sobre) {
        sobre.classList.add('leida');
    }

    if (leidas.indexOf(indice) === -1) {
        leidas.push(indice);
        try {
            localStorage.setItem(CLAVE, JSON.stringify(leidas));
        } catch (e) { }
    }

    actualizarContador();
}

function actualizarContador() {
    var total = cartas.length;
    contador.textContent = leidas.length + ' de ' + total + ' leídas';

    if (leidas.length >= total) {
        hint.textContent = 'Las seis leídas, mi pachuchitaa 💖';
        hint.classList.add('listo');
    }
}

function leerGuardadas() {
    try {
        var crudo = JSON.parse(localStorage.getItem(CLAVE) || '[]');
        return Array.isArray(crudo) ? crudo : [];
    } catch (e) {
        return [];
    }
}

// ------------------------------------------------------------
//  Arranque
// ------------------------------------------------------------
crearSobres();
soltarPetalos();
actualizarContador();

cerrarBtn.addEventListener('click', cerrar);
fondo.addEventListener('click', cerrar);

document.addEventListener('keydown', function (evento) {
    if (evento.key === 'Escape' || evento.key === 'Enter') {
        if (ocupado) { cerrar(); }
    }
});

// Si giran el celu o se abre y se cierra la barra del navegador, todo
// se reacomoda: el ancho cambia el abanico y el alto mueve el centro
// al que vuela el sobre
var ultimoAncho = window.innerWidth;
var ultimoAlto = window.innerHeight;

window.addEventListener('resize', function () {
    var ancho = window.innerWidth;
    var alto = window.innerHeight;

    if (ancho !== ultimoAncho) {
        ultimoAncho = ancho;
        if (abierto === null) {
            acomodar();
        }
    }

    if (alto !== ultimoAlto) {
        ultimoAlto = alto;
        if (abierto !== null) {
            apuntarAlCentro(abanico.children[abierto]);
        }
    }
});
