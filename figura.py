import cv2
import numpy as np
import pygame
import sys
import os

# --- CONFIGURACIÓN ---
IMAGE_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "Iriss.png")
ANCHO, ALTO = 700, 800
FPS = 60
LINEAS_POR_FRAME = 25
COLOR_FONDO = (5, 4, 11)
COLOR_LINEA = (205, 130, 255)
COLOR_LINEA_ROSA = (255, 150, 200)
SUPER_MUESTREO = 2

# 1. Procesar la imagen y extraer bordes con OpenCV
img = cv2.imread(IMAGE_PATH, cv2.IMREAD_GRAYSCALE)
if img is None:
    print("Error: No se encontró la imagen. Revisá la ruta.")
    sys.exit()

# Redimensionar manteniendo la proporción para que entre en la ventana
h, w = img.shape
escala = min(ANCHO / w, ALTO / h)
nuevo_w, nuevo_h = int(w * escala), int(h * escala)
img_resized = cv2.resize(img, (nuevo_w, nuevo_h))

# Suavizar ruido y detectar bordes (Canny)
clahe = cv2.createCLAHE(clipLimit=2.4, tileGridSize=(8, 8))
img_eq = clahe.apply(img_resized)
blur = cv2.bilateralFilter(img_eq, 5, 45, 45)
mediana = np.median(blur)
limite_bajo = int(max(0, 0.66 * mediana))
limite_alto = int(min(255, max(limite_bajo + 1, 1.33 * mediana)))
bordes = cv2.Canny(blur, limite_bajo, limite_alto)

# Encontrar todos los contornos como listas de coordenadas
contornos = cv2.findContours(bordes, cv2.RETR_LIST, cv2.CHAIN_APPROX_NONE)[-2]

# Centrar el dibujo en la pantalla
offset_x = (ANCHO - nuevo_w) // 2
offset_y = (ALTO - nuevo_h) // 2

# Convertir los contornos en segmentos de línea dibujables
segmentos = []
for contorno in contornos:
    if len(contorno) > 8:
        for i in range(len(contorno) - 1):
            p1 = (contorno[i][0][0] + offset_x, contorno[i][0][1] + offset_y)
            p2 = (contorno[i+1][0][0] + offset_x, contorno[i+1][0][1] + offset_y)
            segmentos.append((p1, p2))

# 2. Inicializar Pygame para la animación
pygame.init()
pantalla = pygame.display.set_mode((ANCHO, ALTO))
lienzo = pygame.Surface((ANCHO * SUPER_MUESTREO, ALTO * SUPER_MUESTREO))
pygame.display.set_caption("Retrato de Iris")
reloj = pygame.time.Clock()

pantalla.fill(COLOR_FONDO)
lienzo.fill(COLOR_FONDO)
indice_actual = 0


def color_linea(y):
    t = min(1.0, max(0.0, y / ALTO))
    return (
        int(COLOR_LINEA_ROSA[0] + (COLOR_LINEA[0] - COLOR_LINEA_ROSA[0]) * t),
        int(COLOR_LINEA_ROSA[1] + (COLOR_LINEA[1] - COLOR_LINEA_ROSA[1]) * t),
        int(COLOR_LINEA_ROSA[2] + (COLOR_LINEA[2] - COLOR_LINEA_ROSA[2]) * t),
    )


# Bucle principal
corriendo = True
while corriendo:
    for evento in pygame.event.get():
        if evento.type == pygame.QUIT:
            corriendo = False

    # Dibujar un lote de segmentos en cada frame
    for _ in range(LINEAS_POR_FRAME):
        if indice_actual < len(segmentos):
            p1, p2 = segmentos[indice_actual]
            color = color_linea(p1[1])
            p1_hd = (p1[0] * SUPER_MUESTREO, p1[1] * SUPER_MUESTREO)
            p2_hd = (p2[0] * SUPER_MUESTREO, p2[1] * SUPER_MUESTREO)
            pygame.draw.line(lienzo, color, p1_hd, p2_hd, 2)
            indice_actual += 1

    pantalla.blit(pygame.transform.smoothscale(lienzo, (ANCHO, ALTO)), (0, 0))
    pygame.display.flip()
    reloj.tick(FPS)

pygame.quit()
