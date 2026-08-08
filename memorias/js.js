/* ==========================================================================
   1. ELEMENTOS PRINCIPALES Y CARTA DE AMOR
   ========================================================================== */
const centerImage = document.getElementById('center-image');
const loveLetter = document.getElementById('love-letter');
const overlay = document.getElementById('overlay');
const closeLetterBtn = document.getElementById('close-letter-btn');
const btnVolverInicio = document.querySelector('.volver-inicio');
const vinylBadge = document.getElementById('vinyl-badge');

if (centerImage && loveLetter && overlay) {
    centerImage.addEventListener('click', () => {
        loveLetter.classList.add('show');
        overlay.classList.add('show');
        document.body.classList.add('modal-open');

        // Oculta completamente el botón de volver al inicio y el badge del vinilo
        if (btnVolverInicio) btnVolverInicio.style.display = 'none';
        if (vinylBadge) {
            vinylBadge.style.opacity = '0';
            vinylBadge.style.pointerEvents = 'none';
        }

        if (typeof createHeartShower === 'function') createHeartShower();
    });
}

function closeLetter() {
    if (loveLetter) loveLetter.classList.remove('show');
    if (overlay) overlay.classList.remove('show');
    
    // Libera el scroll del cuerpo de la página
    document.body.classList.remove('modal-open');

    // Restaura la visibilidad del botón volver al inicio
    if (btnVolverInicio) btnVolverInicio.style.display = 'inline-flex';

    // Restaura el badge si el usuario ya está en la sección adecuada
    if (vinylBadge) {
        const multimediaSection = document.getElementById('multimedia-section') || document.querySelector('.artist-grid');
        if (multimediaSection && multimediaSection.getBoundingClientRect().top < window.innerHeight - 120) {
            vinylBadge.style.opacity = '1';
            vinylBadge.style.pointerEvents = 'auto';
        }
    }
}

if (closeLetterBtn) closeLetterBtn.addEventListener('click', closeLetter);
if (overlay) overlay.addEventListener('click', closeLetter);

/* ==========================================================================
   2. CONTROL DE VISIBILIDAD DEL BADGE FLOTANTE POR SCROLL
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
    const multimediaSection = document.getElementById('multimedia-section') || document.querySelector('.artist-grid');

    if (vinylBadge && multimediaSection) {
        window.addEventListener('scroll', () => {
            // Si la carta de amor está abierta, el badge se mantiene oculto
            if (loveLetter && loveLetter.classList.contains('show')) return;

            // Detecta cuando la grilla de cantantes entra en pantalla
            const sectionPosition = multimediaSection.getBoundingClientRect().top;
            const screenHeight = window.innerHeight;

            if (sectionPosition < screenHeight - 120) {
                vinylBadge.style.opacity = '1';
                vinylBadge.style.pointerEvents = 'auto';
                vinylBadge.classList.add('visible');
            } else {
                vinylBadge.style.opacity = '0';
                vinylBadge.style.pointerEvents = 'none';
                vinylBadge.classList.remove('visible');
            }
        });
    }
});

/* ==========================================================================
   3. DATOS DE ARTISTAS Y SPOTLIGHT
   ========================================================================== */
const artistsData = {
    morat: {
        title: "BTS",
        desc: "Siete voces, una historia y millones de corazones unidos por su música.",
        image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQXlKjV9LJbM2rKMZJ7hXSmgsQstVCOZilswP0fz_pozi-2J1A7v_Li7-pkc6TDfspJ9rtlF3wvuzqo0FPawekAgTem_G36_HKOAijt8A&s=10",
        tracks: [
            { name: "Serendipity", url: "BTS/LoveYourself.mp3" },
            { name: "Euphoria", url: "BTS/Euphoria.mp3" },
            { name: "Boy In Luv", url: "BTS/BoyInLuv.mp3" },
            { name: "Your Eyes Tell", url: "BTS/YourEyesTell.mp3" }
        ]
    },
    reik: {
        title: "Silvana Estrada",
        desc: "Delicadeza, sensibilidad y poesía en cada canción.",
        image: "silvanaEstrada/image copy.png",
        tracks: [
            { name: "Flores", url: "silvanaEstrada/Flores.mp3" },
            { name: "Carta", url: "silvanaEstrada/Carta.mp3" },
            { name: "Que Problema", url: "silvanaEstrada/QueProblema.mp3" },
            { name: "Te Guardo", url: "silvanaEstrada/TeGuardo.mp3" }
        ]
    },
    camilo: {
        title: "Humbe",
        desc: "Canciones sinceras que transforman emociones cotidianas en momentos inolvidables.",
        image: "https://upload.wikimedia.org/wikipedia/commons/4/48/Humbe_en_Esencia_Tour_en_Coahuila_%281%29_%28cropped%29.png",
        tracks: [
            { name: "Morfina", url: "Humbe/Morfina.mp3" },
            { name: "Confieso", url: "Humbe/Confieso.mp3" },
            { name: "Te lo Prometo", url: "Humbe/prometo.mp3" },
            { name: "Amor de Cine", url: "Humbe/AmorDeCine.mp3" }
        ]
    },
    mafia: {
        title: "Latin Mafia",
        desc: "Sonidos frescos que combinan vulnerabilidad, ritmo y mucha personalidad.",
        image: "mafia/image copy.png",
        tracks: [
            { name: "Ciudad de las Luces", url: "mafia/CiudadDeLasLuces.mp3" },
            { name: "Flores", url: "mafia/Flores.mp3" },
            { name: "Se Fue la Luz", url: "mafia/Luz.mp3" },
            { name: "Patadas de Ahogado", url: "mafia/pata.mp3" }
        ]
    }
};

const multimediaSection = document.getElementById('multimedia-section');
const trackListContainer = document.getElementById('featured-tracks');
const audioPlayer = document.getElementById('main-audio-player');

// Precarga de imágenes en RAM para rendimiento inmediato
function preloadImages() {
    Object.values(artistsData).forEach(artist => {
        if (artist.image) {
            const img = new Image();
            img.src = artist.image;
        }
    });
}
preloadImages();

function openSpotlight(key) {
    const data = artistsData[key];
    if (!data) return;

    const featuredImg = document.getElementById('featured-img');

    if (featuredImg) {
        featuredImg.style.opacity = '0';
        featuredImg.src = data.image;
        featuredImg.onload = () => { featuredImg.style.opacity = '1'; };
    }

    document.getElementById('featured-title').innerText = data.title;
    document.getElementById('featured-desc').innerText = data.desc;

    if (trackListContainer) {
        trackListContainer.innerHTML = "";
        data.tracks.forEach((track) => {
            const btn = document.createElement('button');
            btn.className = "track-button";
            btn.innerHTML = `${track.name} <span>Reproducir ▶</span>`;
            btn.onclick = () => playTrack(track.url, btn);
            trackListContainer.appendChild(btn);
        });
    }

    if (audioPlayer) audioPlayer.src = "";
    if (multimediaSection) multimediaSection.classList.add('is-spotlight');

    // Oculta el botón "Volver al inicio" y el badge de vinilo al abrir un cantante
    if (btnVolverInicio) btnVolverInicio.style.display = 'none';
    if (vinylBadge) {
        vinylBadge.style.opacity = '0';
        vinylBadge.style.pointerEvents = 'none';
    }

    if (multimediaSection) multimediaSection.scrollIntoView({ behavior: 'smooth' });
}

function closeSpotlight() {
    if (audioPlayer) {
        audioPlayer.pause();
        audioPlayer.src = "";
    }
    if (multimediaSection) multimediaSection.classList.remove('is-spotlight');

    // Muestra nuevamente el botón "Volver al inicio" y el badge de vinilo al volver al catálogo
    if (btnVolverInicio) btnVolverInicio.style.display = 'inline-flex';
    if (vinylBadge) {
        vinylBadge.style.opacity = '1';
        vinylBadge.style.pointerEvents = 'auto';
    }
}

function playTrack(url, clickedButton) {
    document.querySelectorAll('.track-button').forEach(b => b.classList.remove('active'));
    clickedButton.classList.add('active');
    if (audioPlayer) {
        audioPlayer.src = url;
        audioPlayer.play();
    }
}

/* ==========================================================================
   4. EFECTOS ESPECIALES (LLUVIA DE CORAZONES)
   ========================================================================== */
function createHeartShower() {
    for (let i = 0; i < 15; i++) {
        const heart = document.createElement('div');
        heart.className = 'heart-particle';
        heart.innerText = ['❤️', '💖', '💝', '💕'][Math.floor(Math.random() * 4)];
        heart.style.left = Math.random() * 100 + 'vw';
        heart.style.animationDelay = Math.random() * 1.5 + 's';
        heart.style.fontSize = Math.random() * 0.8 + 1 + 'rem';
        document.body.appendChild(heart);
        setTimeout(() => heart.remove(), 4000);
    }
}

/* ==========================================================================
   5. MODAL DE DEDICATORIA ESPECIAL (VINILO FLOTANTE)
   ========================================================================== */
const modalOverlay = document.getElementById('dedicated-modal-overlay');
const dedicatedModal = document.getElementById('dedicated-modal');
const modalAudioPlayer = document.getElementById('modal-audio-player');
const modalRecordIcon = document.getElementById('modal-spinning-record');

function openDedicatedModal() {
    if (modalOverlay) modalOverlay.classList.add('show');
    if (dedicatedModal) dedicatedModal.classList.add('show');
}

function closeDedicatedModal() {
    if (modalOverlay) modalOverlay.classList.remove('show');
    if (dedicatedModal) dedicatedModal.classList.remove('show');
    
    // Pausa la música si cierran el modal
    if (modalAudioPlayer) modalAudioPlayer.pause();
    if (modalRecordIcon) modalRecordIcon.classList.remove('spinning');
}

function playModalTrack(url, titulo, nota, btnElement) {
    // Si la música general de los otros artistas estaba sonando, la pausamos
    if (typeof audioPlayer !== 'undefined' && audioPlayer) {
        audioPlayer.pause();
    }

    // Limpia la clase activa de los botones dentro del modal
    document.querySelectorAll('.modal-track-btn').forEach(btn => {
        btn.classList.remove('active');
        const stateSpan = btn.querySelector('.btn-play-state');
        if (stateSpan) stateSpan.innerText = 'Reproducir ▶';
    });

    // Control de Play / Pausa
    if (modalAudioPlayer && modalAudioPlayer.src.includes(url) && !modalAudioPlayer.paused) {
        modalAudioPlayer.pause();
        if (modalRecordIcon) modalRecordIcon.classList.remove('spinning');
        const stateSpan = btnElement.querySelector('.btn-play-state');
        if (stateSpan) stateSpan.innerText = 'Reproducir ▶';
    } else if (modalAudioPlayer) {
        modalAudioPlayer.src = url;
        modalAudioPlayer.play();
        if (modalRecordIcon) modalRecordIcon.classList.add('spinning');

        const songLabel = document.getElementById('modal-song-label');
        if (songLabel) songLabel.innerText = `${titulo} - "${nota}"`;
        
        btnElement.classList.add('active');
        const stateSpan = btnElement.querySelector('.btn-play-state');
        if (stateSpan) stateSpan.innerText = 'Sonando 🎵';
    }
}