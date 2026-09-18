function openEnvelope() {
    const envelopeContainer = document.getElementById('envelope-container');
    const fullLetter = document.getElementById('full-letter');
    const messageOverlay = document.querySelector('.message-overlay');

    if (!envelopeContainer.classList.contains('open')) {
        messageOverlay.style.opacity = '0';
        envelopeContainer.classList.add('open');

        setTimeout(() => {
            envelopeContainer.classList.add('hidden');
            fullLetter.classList.add('visible-letter');
        }, 1000);
    }
}

function returnToRosa() {
    const rosaContainer = document.getElementById('rosa-container');
    const fullLetter = document.getElementById('full-letter');
    const envelopeContainer = document.getElementById('envelope-container');
    const body = document.body;

    // Oculta la carta con efecto
    fullLetter.classList.remove('visible-letter');
    envelopeContainer.classList.add('hidden');
    envelopeContainer.style.opacity = '0';

    // Muestra el contenedor de la rosa
    rosaContainer.classList.remove('hidden');
    setTimeout(() => {
        rosaContainer.style.opacity = '1';
        body.style.backgroundColor = '#0c0f1e';
    }, 10);
}

function showEnvelope() {
    const rosaContainer = document.getElementById('rosa-container');
    const envelopeContainer = document.getElementById('envelope-container');
    const messageOverlay = document.querySelector('.message-overlay');
    const body = document.body;

    // Cambia el fondo suavemente
    body.style.backgroundColor = '#fffde7';

    // Oculta la rosa
    rosaContainer.classList.add('hidden');
    rosaContainer.style.opacity = '0';

    // Muestra el sobre
    envelopeContainer.classList.remove('hidden', 'open');
    envelopeContainer.style.opacity = '1';
    envelopeContainer.style.display = 'flex';
    messageOverlay.style.opacity = '1';
}