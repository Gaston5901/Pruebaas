# -*- coding: utf-8 -*-
"""
Recorta el fondo de rosa.png y lo deja con transparencia.

Sirve para cuando la foto de la rosa viene con el fondo (cuadro gris/blanco)
y se ve ese rectángulo feo en la pagina. Deja solo la rosa.

COMO SE USA:
    python recortar-fondo.py

LISTO: ya lo corrí una vez y el archivo rosa.png quedó bien.
Si algún día cambias la foto, volvé a poner tu imagen como rosa.png
y corré este script otra vez. Te respaldo el original en rosa-original.png.
"""
import os
import shutil
import numpy as np
from PIL import Image
from scipy import ndimage

CARPETA = os.path.dirname(os.path.abspath(__file__))
ORIGINAL = os.path.join(CARPETA, 'rosa-original.png')
ENTRADA  = os.path.join(CARPETA, 'rosa.png')
SALIDA   = os.path.join(CARPETA, 'rosa.png')

# --- los dos números que se tocan si tu foto tiene otro fondo ---
# sat = cuan colorful es un pixel (0 = gris puro). Si tu foto tiene el
# fondo de otro color, subilo (ej: 45 para un fondo rosado).
TOLERANCIA_COLOR = 30
# lum = que tan claro es. Bajalo (ej: 100) si el fondo es oscuro.
FONDO_CLARO = 140


def recortar(entrada, salida):
    img = Image.open(entrada).convert('RGB')
    a = np.asarray(img).astype(np.float32)
    h, w, _ = a.shape

    mx, mn = a.max(axis=2), a.min(axis=2)
    sat, lum = mx - mn, a.mean(axis=2)

    # 1) que pixeles PODRIAN ser fondo: sin color y claros
    cand = (sat <= TOLERANCIA_COLOR) & (lum >= FONDO_CLARO)

    # 2) de esos, solo los que TOCAN el borde de la imagen. Asi un brillo
    #    blanco de la rosa no se borra nunca (no llega al borde).
    lab, _ = ndimage.label(cand)
    borde = set(np.unique(np.concatenate([
        lab[0, :], lab[-1, :], lab[:, 0], lab[:, -1]])))
    borde.discard(0)
    fondo = np.isin(lab, list(borde))
    rosa = ~fondo

    # 3) limpiar motitas sueltas de 1 o 2 pixeles que deja el recorte
    lab_r, n_r = ndimage.label(rosa)
    for i in range(1, n_r + 1):
        if (lab_r == i).sum() < 50:
            rosa[lab_r == i] = False

    # 4) borde suave: come 1px del contorno (justo el que esta mezclado
    #    con el fondo claro) y despues lo difumina. Asi no queda ni un
    #    pelo de halo blanco alrededor de la rosa.
    alfa = ndimage.gaussian_filter(ndimage.binary_erosion(rosa).astype(np.float32), 0.9)
    alfa = np.clip(alfa, 0, 1)

    # 5) devolverle el color a los pixeles del borde, que estaban
    #    mezclados con el fondo claro y se verian blanquecinos.
    #    (lo que se ve = rosa*a + fondo*(1-a), despejamos la rosa)
    FONDO_REAL = float(np.median(lum[fondo])) if fondo.any() else 245.0
    a3 = np.maximum(alfa, 0.12)[..., None]
    destapado = np.clip((a - (1 - a3) * FONDO_REAL) / a3, 0, 255)
    a_fuerte = alfa >= 0.985
    color = np.where((alfa < 0.15)[..., None], a, destapado)
    color[a_fuerte] = a[a_fuerte]

    # 6) recortar el aire de alrededor (con un margenito)
    ys, xs = np.where(alfa > 0.02)
    m = int(max(6, min(w, h) * 0.012))
    y0, y1 = max(0, ys.min() - m), min(h, ys.max() + m + 1)
    x0, x1 = max(0, xs.min() - m), min(w, xs.max() + m + 1)
    color, alfa = color[y0:y1, x0:x1], alfa[y0:y1, x0:x1]
    ch, cw = alfa.shape

    rgba = np.dstack([color, alfa * 255]).astype(np.uint8)
    out = Image.fromarray(rgba, 'RGBA')

    # donde alfa es casi 0, no importa que color quede: se borra
    arr = np.asarray(out).copy()
    arr[arr[:, :, 3] < 4] = 0
    out = Image.fromarray(arr, 'RGBA')
    out.save(salida, optimize=True)

    return dict(entrada=entrada, w=w, h=h, antes=out.size,
                salida=os.path.basename(salida),
                bytes=os.path.getsize(salida),
                con_alpha=out.mode == 'RGBA')


# --- de que foto recortamos ---
# Miramos la foto que esta puesta HOY en rosa.png. Si ya tiene el fondo
# transparente, no hacemos nada (asi podes correr el script las veces que
# quieras sin que se degrade). Si todavia tiene fondo, la respaldamos
# antes de tocar nada y recien ahi recortamos.


def ya_esta_recortada(ruta):
    """True si la imagen ya no tiene fondo (las 4 esquinas transparentes)."""
    try:
        im = Image.open(ruta)
    except Exception:
        return False
    if im.mode != 'RGBA':
        return False
    a = np.asarray(im)[:, :, 3]
    h, w = a.shape
    esquinas = [(0, 0), (0, w - 1), (h - 1, 0), (h - 1, w - 1)]
    return all(int(a[y, x]) < 12 for y, x in esquinas)


if ya_esta_recortada(ENTRADA):
    print('rosa.png ya esta recortada (tiene el fondo transparente).')
    print('No hago nada, asi no se pisa a si misma.\n')
    raise SystemExit(0)

# Todavia tiene fondo -> es una foto nueva. La guardamos entera.
shutil.copy2(ENTRADA, ORIGINAL)
print('Guarde tu foto sin tocar en: %s\n' % os.path.basename(ORIGINAL))

r = recortar(ENTRADA, SALIDA)
print('Foto original : %dx%d px' % (r['w'], r['h']))
print('Foto recortada: %dx%d px con canal alfa' % r['antes'])
print('Guardada en   : %s  (%.0f KB)' % (r['salida'], r['bytes'] / 1024))
