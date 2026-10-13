/* =========================================================
   CONFIGURACIÓN — cambiá desde acá
   ========================================================= */
const CONFIG = {
    TITULO: "Diario de Iris",
    CLAVE_DIGITOS: "260426",             // contraseña (solo dígitos): 26/04/26
    MAX_LARGO_TEXTO: 6000,
    FOTO_MAX_DIM: 1400,
    FOTO_MAX_BYTES: 500000               // tamaño máximo de la foto comprimida (~375KB)
};

/* =========================================================
   ELEMENTOS
   ========================================================= */
const book = document.querySelector("#book");

const lockModal = document.querySelector("#lock-modal");
const lockCombo = document.querySelector("#lock-combo");
const comboDia = document.querySelector("#combo-dia");
const comboMes = document.querySelector("#combo-mes");
const comboAnio = document.querySelector("#combo-anio");
const unlockBtn = document.querySelector("#unlock-btn");
const errorMessage = document.querySelector("#error-message");

const readerModal = document.querySelector("#reader-modal");
const readerFecha = document.querySelector("#reader-fecha");
const readerTitulo = document.querySelector("#reader-titulo");
const readerFoto = document.querySelector("#reader-foto");
const readerTexto = document.querySelector("#reader-texto");

const editorModal = document.querySelector("#editor-modal");
const editorHeading = document.querySelector("#editor-heading");
const editorFecha = document.querySelector("#editor-fecha");
const editorTitulo = document.querySelector("#editor-titulo");
const editorFoto = document.querySelector("#editor-foto");
const editorPreview = document.querySelector("#editor-preview");
const editorQuitarFoto = document.querySelector("#editor-quitar-foto");
const editorTexto = document.querySelector("#editor-texto");
const editorError = document.querySelector("#editor-error");
const editorGuardar = document.querySelector("#editor-guardar");

const fab = document.querySelector("#new-page-fab");
const closeBookBtn = document.querySelector("#close-book-btn");

const confirmModal = document.querySelector("#confirm-modal");
const confirmEmoji = document.querySelector("#confirm-emoji");
const confirmTitulo = document.querySelector("#confirm-titulo");
const confirmMensaje = document.querySelector("#confirm-mensaje");
const confirmOk = document.querySelector("#confirm-ok");
const confirmCancel = document.querySelector("#confirm-cancel");

const toastEl = document.querySelector("#toast");

const helpModal = document.querySelector("#help-modal");
const helpOk = document.querySelector("#help-ok");

/* =========================================================
   ESTADO
   ========================================================= */
let entries = [];
let currentLocation = 1;
let isBookUnlocked = false;
let editingId = null;
let pendingPhotoData = null;   // dataURL de la foto elegida o existente
let pendingPhotoIsNew = false;
let previewBlobUrl = null;     // blob temporal de la foto elegida
let ubicacionAntesNueva = null;

/* =========================================================
   GUARDADO (IndexedDB con respaldo en localStorage)
   ========================================================= */
const Storage = (() => {
    const LS_KEY = "diario_iris_v1";
    let db = null;
    let lsMode = false;

    function openDB() {
        return new Promise((resolve, reject) => {
            if (!("indexedDB" in window)) return reject(new Error("sin IDB"));
            let req;
            try { req = indexedDB.open("diario_iris", 1); }
            catch (e) { return reject(e); }
            req.onupgradeneeded = () => {
                const d = req.result;
                if (!d.objectStoreNames.contains("entradas")) {
                    d.createObjectStore("entradas", { keyPath: "id", autoIncrement: true });
                }
            };
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error || new Error("IDB error"));
            req.onblocked = () => reject(new Error("IDB blocked"));
        });
    }

    function idbPut(entry) {
        return new Promise((resolve, reject) => {
            const t = db.transaction("entradas", "readwrite");
            const store = t.objectStore("entradas");
            const isNew = entry.id == null;
            const data = isNew ? Object.assign({}, entry) : entry;
            if (isNew) delete data.id; // la base genera el id solo
            const r = store.put(data);
            r.onsuccess = () => {
                if (isNew) entry.id = r.result;
                resolve(entry.id);
            };
            t.onerror = () => reject(t.error);
            t.onabort = () => reject(t.error);
        });
    }

    function idbAll() {
        return new Promise((resolve, reject) => {
            const t = db.transaction("entradas", "readonly");
            const r = t.objectStore("entradas").getAll();
            r.onsuccess = () => resolve(r.result || []);
            r.onerror = () => reject(r.error);
        });
    }

    function idbDelete(id) {
        return new Promise((resolve, reject) => {
            const t = db.transaction("entradas", "readwrite");
            const r = t.objectStore("entradas").delete(id);
            r.onsuccess = () => resolve();
            t.onerror = () => reject(t.error);
        });
    }

    function lsRead() {
        try { return JSON.parse(localStorage.getItem(LS_KEY)) || []; }
        catch (e) { return []; }
    }

    function lsWrite(list) {
        localStorage.setItem(LS_KEY, JSON.stringify(list));
    }

    async function init() {
        try {
            db = await openDB();
            // Si había páginas guardadas "de respaldo", las paso a la base principal
            const guardadas = await idbAll();
            if (guardadas.length === 0) {
                const viejas = lsRead();
                for (const item of viejas) {
                    await idbPut(item);
                }
                if (viejas.length > 0) localStorage.removeItem(LS_KEY);
            }
        } catch (e) { lsMode = true; }
    }

    async function all() {
        if (!lsMode && db) {
            try { return await idbAll(); }
            catch (e) { lsMode = true; }
        }
        return lsRead();
    }

    async function save(entry) {
        if (!lsMode && db) {
            try {
                await idbPut(entry);
                return entry;
            } catch (e) { lsMode = true; }
        }
        const list = lsRead();
        if (entry.id == null) {
            entry.id = list.reduce((m, x) => Math.max(m, x.id || 0), 0) + 1;
        }
        const i = list.findIndex(x => x.id === entry.id);
        if (i >= 0) list[i] = entry;
        else list.push(entry);
        lsWrite(list); // puede lanzar si no hay espacio
        return entry;
    }

    async function remove(id) {
        if (!lsMode && db) {
            try { await idbDelete(id); return; }
            catch (e) { lsMode = true; }
        }
        lsWrite(lsRead().filter(x => x.id !== id));
    }

    return { init, all, save, remove };
})();

/* =========================================================
   UTILIDADES
   ========================================================= */
function esc(s) {
    return String(s == null ? "" : s)
        .replace(/&/g, "&amp;").replace(/</g, "&lt;")
        .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function todayISO() {
    const d = new Date();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return d.getFullYear() + "-" + m + "-" + day;
}

/* =========================================================
   PALABRAS CON COLOR Y ESTILO DE LETRA
   ========================================================= */
const FONTES = {
    script: "'Dancing Script', cursive",
    caveat: "'Caveat', cursive",
    pacifico: "'Pacifico', cursive",
    sil: "'Shadows Into Light', cursive",
    serif: "Georgia, 'Times New Roman', serif",
    mono: "'Courier New', monospace"
};

const PALETA = [
    "#ff4081", "#e91e63", "#d40000", "#ff8d00", "#ffd400",
    "#a2d900", "#00c853", "#1de9b6", "#00bcd4", "#2979ff",
    "#651fff", "#9c27b0", "#795548", "#000000"
];

const ESTILOS = [
    { key: "none", label: "Automática", cls: "clean" },
    { key: "script", label: "Romántica", css: "font-family:'Dancing Script',cursive;font-size:1.2em;line-height:1.1" },
    { key: "caveat", label: "Escrita", css: "font-family:'Caveat',cursive;font-size:1.2em;line-height:1.1" },
    { key: "pacifico", label: "Redonda", css: "font-family:'Pacifico',cursive;font-size:1.05em;line-height:1.2" },
    { key: "sil", label: "Tiza", css: "font-family:'Shadows Into Light',cursive;font-size:1.15em;line-height:1.1" },
    { key: "serif", label: "Clásica", css: "font-family:Georgia,serif" },
    { key: "mono", label: "Máquina", css: "font-family:'Courier New',monospace;font-size:.92em" }
];

let formatoActivo = { color: null, font: null };

function actualizarEstiloEditor() {
    const color = formatoActivo.color || "#4f4f4f";
    const font = formatoActivo.font && FONTES[formatoActivo.font]
        ? FONTES[formatoActivo.font]
        : "'Georgia', serif";
    editorTexto.style.color = color;
    editorTexto.style.fontFamily = font;
}

function elegirFormatoActivo(atributo, valor) {
    if (atributo === "c") formatoActivo.color = valor === "none" ? null : valor;
    if (atributo === "f") formatoActivo.font = valor === "none" ? null : valor;
    actualizarEstiloEditor();
}

function textoConFormatoActivo(texto) {
    const attrs = [];
    if (formatoActivo.color) attrs.push("c=" + formatoActivo.color);
    if (formatoActivo.font) attrs.push("f=" + formatoActivo.font);
    if (!texto || !attrs.length) return texto;
    return texto.split(/(⟦[^⟧]*⟧)/g).map(parte => {
        if (!parte || parte.startsWith("⟦")) return parte;
        return `⟦${attrs.join(" ")}⟧${parte}⟦/⟧`;
    }).join("");
}

function renderFormato(raw) {
    const tokens = String(raw == null ? "" : raw).split(/(⟦[^⟧]*⟧)/g);
    let html = "";
    const pila = [{ color: null, font: null }];
    for (const tok of tokens) {
        if (!tok) continue;
        if (tok === "⟦/⟧") {
            if (pila.length > 1) pila.pop();
            continue;
        }
        if (tok.charAt(0) === "⟦") {
            const base = Object.assign({}, pila[pila.length - 1]);
            const mC = tok.match(/c=#([0-9a-fA-F]{3,8})/);
            const mF = tok.match(/f=([a-z0-9]+)/);
            if (mC) base.color = "#" + mC[1];
            if (/c=none/.test(tok)) base.color = null;
            if (mF) base.font = mF[1];
            pila.push(base);
            continue;
        }
        const st = pila[pila.length - 1];
        const css = [];
        if (st.color) css.push("color:" + st.color);
        if (st.font && FONTES[st.font]) css.push("font-family:" + FONTES[st.font]);
        let chunk = esc(tok);
        if (css.length) chunk = `<span style="${css.join(";")}">${chunk}</span>`;
        html += chunk;
    }
    return html;
}

function wrapFormato(stAttr, msj) {
    const ta = editorTexto;
    const s = ta.selectionStart, e = ta.selectionEnd;
    if (s == null || s === e) {
        const [atributo, valor] = stAttr.split("=");
        elegirFormatoActivo(atributo, valor);
        editorError.textContent = "";
        if (msj) mostrarToast("Formato listo para escribir " + (atributo === "c" ? "con color 💕" : "con esa letra ✍️"));
        ta.focus();
        return;
    }
    let nuevo;
    const sel = ta.value.slice(s, e);
    const m = sel.match(/^⟦([^⟧]*)⟧/);
    if (m && sel.endsWith("⟦/⟧")) {
        const inner = sel.slice(m[0].length, sel.length - "⟦/⟧".length);
        const key = stAttr.split("=")[0];
        const rest = m[1].split(/\s+/).filter(Boolean).filter(a => !a.startsWith(key + "="));
        if (rest.length === 0) {
            nuevo = inner;
        } else {
            rest.push(stAttr);
            nuevo = "⟦" + rest.join(" ") + "⟧" + inner + "⟦/⟧";
        }
    } else {
        nuevo = "⟦" + stAttr + "⟧" + sel + "⟦/⟧";
    }
    ta.value = ta.value.slice(0, s) + nuevo + ta.value.slice(e);
    ta.focus();
    ta.selectionStart = ta.selectionEnd = s + nuevo.length;
    editorError.textContent = "";
    if (msj) mostrarToast(msj);
}

function limpiarFormatoSel() {
    const ta = editorTexto;
    const s = ta.selectionStart, e = ta.selectionEnd;
    if (s == null || s === e) {
        editorError.textContent = "Primero seleccioná las palabras 🌸";
        ta.focus();
        return;
    }
    const limpio = ta.value.slice(s, e).replace(/⟦[^⟧]*⟧/g, "");
    ta.value = ta.value.slice(0, s) + limpio + ta.value.slice(e);
    ta.focus();
    ta.selectionStart = ta.selectionEnd = s + limpio.length;
    editorError.textContent = "";
    mostrarToast("Formato quitado 🧽");
}

function initFormatToolbar() {
    const cCont = document.getElementById("format-colores");
    const fCont = document.getElementById("format-letras");
    if (!cCont || !fCont) return;

    PALETA.forEach(color => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "format-swatch";
        b.style.background = color;
        b.setAttribute("aria-label", "Color " + color);
            b.addEventListener("click", () => {
                elegirFormatoActivo("c", color);
                wrapFormato("c=" + color, "Color aplicado 💕");
            });
        cCont.appendChild(b);
    });

    const full = document.createElement("button");
    full.type = "button";
    full.className = "format-swatch special";
    full.title = "Cualquier color";
    full.textContent = "✨";
    full.addEventListener("click", () => document.getElementById("editor-color-full").click());
    cCont.appendChild(full);

    const none = document.createElement("button");
    none.type = "button";
    none.className = "format-swatch none";
    none.title = "Sin color";
    none.textContent = "✕";
    none.addEventListener("click", () => {
        elegirFormatoActivo("c", "none");
        wrapFormato("c=none");
    });
    cCont.appendChild(none);

    ESTILOS.forEach(est => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "format-font" + (est.cls ? " " + est.cls : "");
        b.textContent = est.label;
        if (est.css) b.style.cssText = est.css;
        b.addEventListener("click", () => {
            elegirFormatoActivo("f", est.key);
            wrapFormato("f=" + est.key, "Estilo aplicado ✍️");
        });
        fCont.appendChild(b);
    });

    const limp = document.createElement("button");
    limp.type = "button";
    limp.className = "format-font clean";
    limp.textContent = "✂️ Quitar formato";
    limp.addEventListener("click", () => {
        elegirFormatoActivo("c", "none");
        elegirFormatoActivo("f", "none");
        limpiarFormatoSel();
    });
    fCont.appendChild(limp);

    const colorFull = document.getElementById("editor-color-full");
    if (colorFull) {
        colorFull.addEventListener("change", () => {
            elegirFormatoActivo("c", colorFull.value);
            wrapFormato("c=" + colorFull.value, "Color aplicado 💕");
        });
    }
}

function fmtFecha(iso) {
    if (!iso) return "";
    const d = new Date(iso + "T12:00:00");
    if (isNaN(d)) return iso;
    try {
        return d.toLocaleDateString("es-AR", {
            weekday: "long", day: "numeric", month: "long", year: "numeric"
        });
    } catch (e) {
        return iso;
    }
}

function findEntry(id) {
    return entries.find(e => e.id === id) || null;
}

function modalAbierto() {
    return !lockModal.classList.contains("hidden") ||
           !readerModal.classList.contains("hidden") ||
           !editorModal.classList.contains("hidden") ||
           !confirmModal.classList.contains("hidden") ||
           !helpModal.classList.contains("hidden");
}

function abrirModal(el) { el.classList.remove("hidden"); }
function cerrarModal(el) { el.classList.add("hidden"); }

function cerrarEditor() {
    cerrarModal(editorModal);
    if (ubicacionAntesNueva !== null) {
        currentLocation = ubicacionAntesNueva;
        ubicacionAntesNueva = null;
        aplicarEstado();
    }
}

function comprimirImagen(file) {
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
            try {
                let w = img.naturalWidth, h = img.naturalHeight;
                const max = CONFIG.FOTO_MAX_DIM;
                if (w > max || h > max) {
                    if (w >= h) { h = Math.round(h * max / w); w = max; }
                    else { w = Math.round(w * max / h); h = max; }
                }
                const canvas = document.createElement("canvas");
                canvas.width = w; canvas.height = h;
                const ctx = canvas.getContext("2d");
                ctx.fillStyle = "#ffffff";
                ctx.fillRect(0, 0, w, h);
                ctx.drawImage(img, 0, 0, w, h);
                URL.revokeObjectURL(url);

                let q = 0.82;
                let data = canvas.toDataURL("image/jpeg", q);
                while (data.length > CONFIG.FOTO_MAX_BYTES && q > 0.45) {
                    q -= 0.12;
                    data = canvas.toDataURL("image/jpeg", q);
                }
                resolve(data);
            } catch (e) { reject(e); }
        };
        img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("imagen inválida")); };
        img.src = url;
    });
}

/* =========================================================
   DIBUJO DEL LIBRO
   ========================================================= */
function sideHTML(side, cara, sideIndex, totalSides) {
    if (side.tipo === "portada") {
        return `
            <div class="page-inner cover-content">
                <button class="help-btn" data-action="help" aria-label="Abrir ayuda" title="Abrir ayuda">Ayuda</button>
                <span class="corner corner-tl"></span>
                <span class="corner corner-tr"></span>
                <span class="corner corner-bl"></span>
                <span class="corner corner-br"></span>
                <span class="sparkle sparkle-1">✧</span>
                <span class="sparkle sparkle-2">✦</span>
                <span class="sparkle sparkle-3">✧</span>
                <span class="sparkle sparkle-4">✦</span>
                <span class="mini-heart heart-1">♥</span>
                <span class="mini-heart heart-2">♥</span>
                <div class="cover-ornament">❦</div>
                <h1>${esc(CONFIG.TITULO)}</h1>
                <div class="cover-divider"><span>♥</span></div>
                <p class="cover-sub">Un día a la vez, guardado con amor</p>
                <button class="next-btn" data-action="next">Abrir ❤️</button>
                <div class="cover-signatures">
                    <img class="sign" src="firma-rm.png" alt="Firma de RM">
                    <img class="sign" src="firma-jin.png" alt="Firma de Jin">
                    <img class="sign" src="firma-suga.png" alt="Firma de Suga">
                    <img class="sign" src="firma-jhope.png" alt="Firma de J-Hope">
                    <img class="sign" src="firma-jimin.png" alt="Firma de Jimin">
                    <img class="sign" src="firma-v.png" alt="Firma de V">
                    <img class="sign" src="firma-jk.png" alt="Firma de Jungkook">
                </div>
                <p class="cover-est"><span class="est-heart">♥</span> Pachuchitaa <span class="est-heart">♥</span></p>
            </div>`;
    }

    if (side.tipo === "cta") {
        return `
            <div class="page-inner cta-content">
                <div class="cta-emoji">✍️</div>
                <h2>Escribir nueva página</h2>
                <p>Contá qué pasó hoy y sumá una foto que lo represente.</p>
                <button class="cta-btn" data-action="new">＋ Nueva página</button>
                <button class="prev-btn" data-action="prev">&larr; Anterior</button>
            </div>`;
    }

    if (side.tipo === "vacio") {
        return `<div class="page-inner"></div>`;
    }

    const e = side.e;
    const numPagina = entries.indexOf(e) + 1;
    const prevBtn = `<button class="prev-btn" data-action="prev" aria-label="Página anterior" title="Página anterior">&larr;</button>`;
    const nextBtn = `<button class="next-btn" data-action="next" aria-label="Página siguiente" title="Página siguiente">&rarr;</button>`;
    const lastBtn = `<button class="last-btn" data-action="last" aria-label="Última página" title="Ir a la última página">⏭</button>`;
    const esUltimaEntrada = sideIndex === entries.length;

    return `
        <div class="page-inner entry${e.foto ? "" : " sin-foto"}">
            <div class="entry-head">
                <span class="entry-date">${esc(fmtFecha(e.fecha))}</span>
                <span class="entry-tools">
                    <button class="icon-btn" data-action="edit" data-id="${e.id}" title="Editar">✏️</button>
                    <button class="icon-btn" data-action="new" title="Nueva página">＋</button>
                    <button class="icon-btn" data-action="delete" data-id="${e.id}" title="Eliminar">🗑️</button>
                </span>
            </div>
            ${e.titulo ? `<h2 class="entry-title">${esc(e.titulo)}</h2>` : ""}
            ${e.foto ? `<img class="entry-photo" src="${e.foto}" alt="Foto del día" data-action="read" data-id="${e.id}">` : ""}
            ${e.texto ? `<p class="entry-text">${renderFormato(e.texto)}</p>` : ""}
            <span class="page-num">Pág. ${numPagina}</span>
            <div class="page-nav">
                <div class="nav-side">${prevBtn}</div>
                <div class="nav-center">
                    <button class="read-btn hidden" data-action="read" data-id="${e.id}">📖 Leer todo</button>
                </div>
                <div class="nav-side nav-right">${!esUltimaEntrada && entries.length >= 2 ? lastBtn : ""}${nextBtn}</div>
            </div>
        </div>`;
}

function getPapers() {
    return Array.from(book.querySelectorAll(".paper"));
}

function renderBook() {
    getPapers().forEach(p => p.remove());

    const sides = [{ tipo: "portada" }];
    entries.forEach(e => sides.push({ tipo: "entrada", e }));
    sides.push({ tipo: "cta" });
    if (sides.length % 2 === 1) sides.push({ tipo: "vacio" });

    const N = sides.length / 2;
    for (let i = 0; i < N; i++) {
        const paper = document.createElement("div");
        paper.className = "paper";
        paper.innerHTML =
            `<div class="front">${sideHTML(sides[i * 2], "front", i * 2, sides.length)}</div>` +
            `<div class="back">${sideHTML(sides[i * 2 + 1] || { tipo: "vacio" }, "back", i * 2 + 1, sides.length)}</div>`;
        book.appendChild(paper);
    }

    currentLocation = Math.min(currentLocation, N + 1);
    aplicarEstado();
    ajustarBotonesLectura();
}

function aplicarEstado() {
    const papers = getPapers();
    const N = papers.length;
    papers.forEach((p, i) => {
        const loc = i + 1;
        const flipped = loc < currentLocation;
        p.classList.toggle("flipped", flipped);
        p.style.zIndex = flipped ? loc : (N - (loc - 1)) + N;
    });
    book.classList.toggle("open", currentLocation > 1);
    actualizarBotonCerrar();
    actualizarBotonNuevaPagina();
}

function actualizarBotonCerrar() {
    // La "✕" aparece cuando ya no hay más hojas para adelante
    const N = getPapers().length;
    closeBookBtn.classList.toggle("hidden", !(isBookUnlocked && currentLocation > N));
}

function actualizarBotonNuevaPagina() {
    fab.classList.add("hidden");
}

function cerrarDiario() {
    isBookUnlocked = false;
    currentLocation = 1;
    aplicarEstado();
    closeBookBtn.classList.add("hidden");
}

function ajustarBotonesLectura() {
    document.querySelectorAll(".entry").forEach(el => {
        const txt = el.querySelector(".entry-text");
        const btn = el.querySelector(".read-btn");
        if (!txt || !btn) return;
        const desborda = txt.scrollHeight > txt.clientHeight + 4;
        btn.classList.toggle("hidden", !desborda);
    });
}

/* =========================================================
   NAVEGACIÓN
   ========================================================= */
function goNextPage() {
    if (!isBookUnlocked) { showLockModal(); return; }
    const papers = getPapers();
    if (currentLocation > papers.length) return;

    const p = papers[currentLocation - 1];
    if (!p.classList.contains("flipped")) {
        p.classList.add("flipped");
        if (p._t) clearTimeout(p._t);
        p._t = setTimeout(() => { p.style.zIndex = currentLocation; p._t = null; }, 620);
    }
    currentLocation++;
    book.classList.add("open");
    actualizarBotonCerrar();
}

function goPrevPage() {
    if (currentLocation <= 1) return;
    currentLocation--;
    const papers = getPapers();
    const p = papers[currentLocation - 1];
    if (p) {
        if (p._t) { clearTimeout(p._t); p._t = null; }
        p.style.zIndex = (papers.length - (currentLocation - 1)) + papers.length;
        p.classList.remove("flipped");
    }
    if (currentLocation === 1) book.classList.remove("open");
    actualizarBotonCerrar();
}

function irAEntrada(id) {
    const idx = entries.findIndex(e => e.id === id);
    if (idx < 0) return;
    const si = idx + 1; // 0 es la portada
    const k = Math.floor(si / 2) + 1;
    currentLocation = si % 2 === 0 ? k : k + 1;
    currentLocation = Math.max(1, Math.min(currentLocation, getPapers().length + 1));
    aplicarEstado();
}

function irAHojaCreacion() {
    const indiceCta = entries.length + 1; // portada + entradas
    // La CTA es el lado siguiente a la última entrada y debe quedar visible.
    currentLocation = Math.ceil((indiceCta + 1) / 2);
    currentLocation = Math.max(1, Math.min(currentLocation, getPapers().length + 1));
    aplicarEstado();
}

/* =========================================================
   CANDADO (combinación día / mes / año)
   ========================================================= */
const comboState = { dia: 0, mes: 0, anio: 0 };
const comboMax = { dia: 31, mes: 12, anio: 99 };

function pad2(n) { return String(n).padStart(2, "0"); }

function renderCombo() {
    comboDia.textContent = pad2(comboState.dia);
    comboMes.textContent = pad2(comboState.mes);
    comboAnio.textContent = pad2(comboState.anio);
}

function resetCombo() {
    comboState.dia = 0;
    comboState.mes = 0;
    comboState.anio = 0;
    renderCombo();
    lockCombo.classList.remove("shake");
}

function stepCombo(group, dir) {
    const max = comboMax[group];
    let v = comboState[group] + dir;
    if (v > max) v = 0;
    else if (v < 0) v = max;
    comboState[group] = v;
    renderCombo();
}

/* Si mantenés apretada una flecha, el número sube/baja rapidísimo y acelera */
let holdTimeout = null;
let holdRepeat = null;
let holdBtn = null;
let holdDesdePuntero = false;

function detenerHold() {
    if (holdTimeout) { clearTimeout(holdTimeout); holdTimeout = null; }
    if (holdRepeat) { clearTimeout(holdRepeat); holdRepeat = null; }
    if (holdBtn) { holdBtn.classList.remove("holding"); holdBtn = null; }
}

function empezarHold(btn) {
    detenerHold();
    holdBtn = btn;
    btn.classList.add("holding");
    stepCombo(btn.dataset.step, Number(btn.dataset.dir));
    // Pausita inicial y después repite cada vez más rápido
    holdTimeout = setTimeout(() => {
        let delay = 130;
        const tick = () => {
            if (!holdBtn) return;
            stepCombo(holdBtn.dataset.step, Number(holdBtn.dataset.dir));
            delay = Math.max(40, delay - 9);
            holdRepeat = setTimeout(tick, delay);
        };
        tick();
    }, 380);
}

lockCombo.addEventListener("pointerdown", (e) => {
    const btn = e.target.closest("[data-step]");
    if (!btn) return;
    holdDesdePuntero = true;
    empezarHold(btn);
});

window.addEventListener("pointerup", detenerHold);
window.addEventListener("pointercancel", detenerHold);

lockCombo.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-step]");
    if (!btn) return;
    // Ya lo manejó pointerdown (mouse/dedo); sólo acá caemos por teclado
    if (holdDesdePuntero) { holdDesdePuntero = false; return; }
    stepCombo(btn.dataset.step, Number(btn.dataset.dir));
});

function showLockModal() {
    abrirModal(lockModal);
    resetCombo();
    errorMessage.style.display = "none";
    unlockBtn.focus();
}

function checkPassword() {
    const digitos = pad2(comboState.dia) + pad2(comboState.mes) + pad2(comboState.anio);
    const clave = CONFIG.CLAVE_DIGITOS.replace(/\D/g, "");
    const variantes = [clave];
    if (clave.length === 6) variantes.push(clave + "20" + clave.slice(4)); // 260426 -> 26042026
    if (clave.length === 8) variantes.push(clave.slice(0, 6));

    if (variantes.includes(digitos)) {
        isBookUnlocked = true;
        cerrarModal(lockModal);
        goNextPage(); // siempre arranca desde la primera hoja
    } else {
        errorMessage.style.display = "block";
        lockCombo.classList.remove("shake");
        void lockCombo.offsetWidth;
        lockCombo.classList.add("shake");
    }
}

unlockBtn.addEventListener("click", checkPassword);
renderCombo();

/* =========================================================
   LECTOR (página completa)
   ========================================================= */
function openReader(entry) {
    if (!entry) return;
    readerFecha.textContent = fmtFecha(entry.fecha);
    readerTitulo.textContent = entry.titulo || "";
    readerTitulo.classList.toggle("hidden", !entry.titulo);
    if (entry.foto) { readerFoto.src = entry.foto; readerFoto.classList.remove("hidden"); }
    else { readerFoto.removeAttribute("src"); readerFoto.classList.add("hidden"); }
    readerTexto.innerHTML = renderFormato(entry.texto) || "";
    abrirModal(readerModal);
    readerModal.querySelector(".reader-scroll").scrollTop = 0;
}

/* =========================================================
   EDITOR (crear / editar páginas)
   ========================================================= */
function revPreviewBlob() {
    if (previewBlobUrl) {
        URL.revokeObjectURL(previewBlobUrl);
        previewBlobUrl = null;
    }
}

function openEditor(entry) {
    editingId = entry ? entry.id : null;
    if (entry) ubicacionAntesNueva = null;
    editorHeading.textContent = entry ? "Editar página" : "Nueva página";
    editorFecha.value = entry ? entry.fecha : todayISO();
    editorTitulo.value = entry ? (entry.titulo || "") : "";
    editorTexto.value = entry ? (entry.texto || "") : "";
    editorError.textContent = "";
    editorFoto.value = "";
    revPreviewBlob();

    pendingPhotoData = entry ? entry.foto : null;
    pendingPhotoIsNew = false;
    formatoActivo = { color: null, font: null };
    actualizarEstiloEditor();
    actualizarPreview();

    abrirModal(editorModal);
}

function abrirFormularioNuevaEntrada() {
    ubicacionAntesNueva = currentLocation;
    irAHojaCreacion();
    openEditor(null);
}

function actualizarPreview() {
    if (pendingPhotoData) {
        editorPreview.src = pendingPhotoData;
        editorPreview.classList.remove("hidden");
        editorQuitarFoto.classList.remove("hidden");
    } else {
        editorPreview.removeAttribute("src");
        editorPreview.classList.add("hidden");
        editorQuitarFoto.classList.add("hidden");
    }
}

editorFoto.addEventListener("change", () => {
    const file = editorFoto.files && editorFoto.files[0];
    if (!file) return;
    revPreviewBlob();
    pendingPhotoIsNew = true;
    previewBlobUrl = URL.createObjectURL(file);
    pendingPhotoData = previewBlobUrl; // vista previa temporal
    actualizarPreview();
});

editorQuitarFoto.addEventListener("click", () => {
    revPreviewBlob();
    pendingPhotoData = null;
    pendingPhotoIsNew = false;
    editorFoto.value = "";
    actualizarPreview();
});

editorGuardar.addEventListener("click", async () => {
    const fecha = editorFecha.value || todayISO();
    const titulo = editorTitulo.value.trim();
    const texto = textoConFormatoActivo(editorTexto.value.trim());

    editorError.textContent = "";

    if (!texto && !pendingPhotoData) {
        editorError.textContent = "Escribí algo o agregá una foto para guardar la página.";
        return;
    }
    if (texto.replace(/⟦[^⟧]*⟧/g, "").length > CONFIG.MAX_LARGO_TEXTO) {
        editorError.textContent = "El texto es demasiado largo. Acortalo un poco.";
        return;
    }

    editorGuardar.disabled = true;
    editorGuardar.textContent = "Guardando…";

    const esEdicion = editingId != null;

    try {
        let foto = pendingPhotoData;
        if (pendingPhotoIsNew && editorFoto.files && editorFoto.files[0]) {
            foto = await comprimirImagen(editorFoto.files[0]);
        }

        const entry = {
            id: editingId != null ? editingId : null,
            fecha, titulo, texto, foto: foto || null
        };

        await Storage.save(entry);

        // Actualizamos en memoria sin volver a leer todo el diario (más rápido)
        const idx = entries.findIndex(x => x.id === entry.id);
        if (idx >= 0) entries[idx] = entry;
        else entries.push(entry);
        entries.sort((a, b) =>
            String(a.fecha || "").localeCompare(String(b.fecha || "")) ||
            ((a.id || 0) - (b.id || 0))
        );

        revPreviewBlob();
        ubicacionAntesNueva = null;
        cerrarModal(editorModal);
        renderBook();
        if (entry.id != null) irAEntrada(entry.id);
        mostrarToast(esEdicion ? "Cambios guardados" : "Página guardada", "💖");
    } catch (err) {
        editorError.textContent = "No se pudo guardar: no hay más espacio. Probá con una foto más liviana o borrá alguna página.";
    } finally {
        editorGuardar.disabled = false;
        editorGuardar.textContent = "Guardar página 💾";
    }
});

/* =========================================================
   CONFIRMACIÓN BONITA + AVISOS
   ========================================================= */
let confirmResolver = null;

function pedirConfirmacion(opc) {
    return new Promise((resolve) => {
        confirmResolver = resolve;
        confirmEmoji.textContent = opc.emoji || "💫";
        confirmTitulo.textContent = opc.titulo || "¿Estás seguro?";
        confirmMensaje.textContent = opc.mensaje || "";
        confirmOk.textContent = opc.ok || "Sí";
        confirmCancel.textContent = opc.cancelar || "Cancelar";
        abrirModal(confirmModal);
        confirmOk.focus();
    });
}

function cerrarConfirm(respuesta) {
    cerrarModal(confirmModal);
    if (confirmResolver) {
        const r = confirmResolver;
        confirmResolver = null;
        r(respuesta);
    }
}

confirmOk.addEventListener("click", () => cerrarConfirm(true));
confirmCancel.addEventListener("click", () => cerrarConfirm(false));

let toastTimer = null;
function mostrarToast(mensaje, emoji) {
    toastEl.innerHTML = `${emoji ? `<span>${emoji}</span>` : ""}${esc(mensaje)}`;
    toastEl.classList.remove("hidden");
    toastEl.classList.remove("toast-show");
    void toastEl.offsetWidth; // reinicia la animación
    toastEl.classList.add("toast-show");
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
        toastEl.classList.remove("toast-show");
        setTimeout(() => toastEl.classList.add("hidden"), 400);
    }, 2300);
}

/* =========================================================
   BORRAR
   ========================================================= */
async function borrarEntrada(id) {
    const ok = await pedirConfirmacion({
        emoji: "🗑️",
        titulo: "¿Eliminar esta página?",
        mensaje: "Se va a borrar del diario y no se puede deshacer.",
        ok: "Sí, eliminar",
        cancelar: "Mejor no"
    });
    if (!ok) return;
    try {
        await Storage.remove(id);
        await loadEntries();
        renderBook();
        mostrarToast("Página eliminada", "🗑️");
    } catch (e) {
        mostrarToast("No se pudo eliminar", "❌");
    }
}

/* =========================================================
   EVENTOS
   ========================================================= */
book.addEventListener("click", (e) => {
    const target = e.target.closest("[data-action]");
    if (!target) return;
    const action = target.dataset.action;

    if (action === "next") { e.stopPropagation(); goNextPage(); }
    else if (action === "prev") { e.stopPropagation(); goPrevPage(); }
    else if (action === "last") {
        e.stopPropagation();
        if (entries.length) irAEntrada(entries[entries.length - 1].id);
    }
    else if (action === "read") { e.stopPropagation(); openReader(findEntry(Number(target.dataset.id))); }
    else if (action === "edit") { e.stopPropagation(); openEditor(findEntry(Number(target.dataset.id))); }
    else if (action === "delete") { e.stopPropagation(); borrarEntrada(Number(target.dataset.id)); }
    else if (action === "new") { e.stopPropagation(); abrirFormularioNuevaEntrada(); }
    else if (action === "help") { e.stopPropagation(); abrirModal(helpModal); }
});

fab.addEventListener("click", abrirFormularioNuevaEntrada);
closeBookBtn.addEventListener("click", cerrarDiario);
helpOk.addEventListener("click", () => cerrarModal(helpModal));

document.addEventListener("click", (e) => {
    const closeBtn = e.target.closest("[data-close]");
    if (closeBtn) {
        const which = closeBtn.dataset.close;
        if (which === "lock") cerrarModal(lockModal);
        if (which === "reader") cerrarModal(readerModal);
        if (which === "editor") cerrarEditor();
        return;
    }
    if (e.target === lockModal) cerrarModal(lockModal);
    if (e.target === readerModal) cerrarModal(readerModal);
    if (e.target === editorModal) cerrarEditor();
    if (e.target === confirmModal) cerrarConfirm(false);
    if (e.target === helpModal) cerrarModal(helpModal);
});

document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
        if (!confirmModal.classList.contains("hidden")) cerrarConfirm(false);
        else if (!editorModal.classList.contains("hidden")) cerrarEditor();
        else if (!readerModal.classList.contains("hidden")) cerrarModal(readerModal);
        else if (!helpModal.classList.contains("hidden")) cerrarModal(helpModal);
        else if (!lockModal.classList.contains("hidden")) cerrarModal(lockModal);
        return;
    }
    if (modalAbierto()) return;
    if (e.target.matches("input, textarea")) return;
    if (e.key === "ArrowRight") goNextPage();
    if (e.key === "ArrowLeft") goPrevPage();
});

/* Deslizar para pasar de página (celular) */
let touchStart = null;
book.addEventListener("touchstart", (e) => {
    if (modalAbierto()) { touchStart = null; return; }
    const t = e.changedTouches[0];
    touchStart = { x: t.clientX, y: t.clientY };
}, { passive: true });

book.addEventListener("touchend", (e) => {
    if (!touchStart || modalAbierto()) { touchStart = null; return; }
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStart.x;
    const dy = t.clientY - touchStart.y;
    if (Math.abs(dx) > 60 && Math.abs(dy) < 50) {
        if (dx < 0) goNextPage();
        else goPrevPage();
    }
    touchStart = null;
}, { passive: true });

window.addEventListener("resize", ajustarBotonesLectura);

/* =========================================================
   INICIO
   ========================================================= */
async function loadEntries() {
    const list = await Storage.all();
    entries = list.sort((a, b) =>
        String(a.fecha || "").localeCompare(String(b.fecha || "")) ||
        ((a.id || 0) - (b.id || 0))
    );
}

(async function init() {
    await Storage.init();
    await loadEntries();
    initFormatToolbar();
    renderBook();
})();
