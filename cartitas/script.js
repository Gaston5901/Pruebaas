// ============================================================
//  SEIS CARTITAS PARA VOS
//  - Arma el abanico de sobres (6)
//  - Al tocar uno, vuela al centro, se abre y se lee
//  - Queda marcado como "leída" (se guarda en el navegador)
// ============================================================

var CLAVE = 'cartitas:leidas';

var abanico = document.getElementById('abanico');
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
   giro leve para que se vea el abanico. El de la derecha va arriba. */
function acomodar() {
    var sobres = abanico.children;
    var total = sobres.length;
    var medio = (total - 1) / 2;
    var estilos = window.getComputedStyle(sobres[0]);
    var paso = parseFloat(estilos.getPropertyValue('--paso')) || 46;
    var giro = parseFloat(estilos.getPropertyValue('--giro')) || 2.6;

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
}

// ------------------------------------------------------------
//  Pétalos de fondo
// ------------------------------------------------------------
function soltarPetalos() {
    var capa = document.getElementById('petalos');

    for (var i = 0; i < 14; i++) {
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

// Si giran el celu, los sobres se reacomodan
var ultimoAncho = window.innerWidth;
window.addEventListener('resize', function () {
    if (window.innerWidth === ultimoAncho) { return; }
    ultimoAncho = window.innerWidth;

    if (abierto === null) {
        acomodar();
    } else {
        apuntarAlCentro(abanico.children[abierto]);
    }
});
