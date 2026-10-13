// ===== CONTADOR DE DÍAS =====
// Poné acá la fecha en que empezaron a hablar (formato: AAAA-MM-DD)
const FECHA_INICIO = '2026-04-26';

function actualizarContador() {
    const inicio = new Date(FECHA_INICIO + 'T00:00:00');
    const ahora = new Date();
    const diffMs = Math.max(0, ahora - inicio);

    const totalDias = Math.floor(diffMs / 86400000);
    const anios = Math.floor(totalDias / 365);
    const dias = totalDias % 365;
    const segDelDia = Math.floor(diffMs / 1000) % 86400;

    const horas = Math.floor(segDelDia / 3600);
    const minutos = Math.floor((segDelDia % 3600) / 60);
    const segundos = segDelDia % 60;

    document.getElementById('c-anios').textContent = anios.toLocaleString('es');
    document.getElementById('c-anios-label').textContent = anios === 1 ? 'año' : 'años';
    document.getElementById('c-anios-wrap').style.display = anios === 0 ? 'none' : 'flex';
    document.getElementById('c-dias').textContent = dias.toLocaleString('es');
    document.getElementById('c-horas').textContent = String(horas).padStart(2, '0');
    document.getElementById('c-min').textContent = String(minutos).padStart(2, '0');
    document.getElementById('c-seg').textContent = String(segundos).padStart(2, '0');
}

actualizarContador();
setInterval(actualizarContador, 1000);
