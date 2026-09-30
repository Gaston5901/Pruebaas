# 20 Rosas — Para Iriss

Doble clic en **`index.html`**. No necesita internet.

El original quedó como `20 Rosas.html` (backup).

---

## Lo que pediste en esta ronda

| Pediste | Cómo quedó |
|---|---|
| Rosa del hero más linda | Tu foto recortada sin fondo (solo la rosa, borde difuminado) con halo cálido y sombra abajo. De respaldo, un SVG de 4 capas de pétalos por si el PNG falta |
| Que no se vea el fondo de la foto | `rosa.png` ahora tiene el fondo transparente. La original quedó en `rosa-original.png` |
| Fondo en la primera parte | Hero usa `fondo.jpg` con velo atardecer |
| Otro fondo en las rosas | Papel cálido con textura de lino en tonos durazno/lila |
| Otro fondo en la poesía | **Espacio profundo oscuro:** nebulosas violeta/azul/rosa y estrellas fijas que van titilando |
| Tarjetas de la poesía lindas | Vidrio oscuro con nebulosita adentro, barrita de color con brillo, chip con puntito, estrella `✦` en la esquina que gira al pasar el mouse y firma con rayita |
| (de más) | El candado, noche cálida con estrellas de plata |
| Modal al tocar la rosa | Modal centrado con la cosita linda. Se cierra con la **X** o tocando afuera |
| Cerrar con X | La X está arriba a la derecha en los dos modales. También anda `Esc` |
| La carta como ícono arriba a la derecha | Ícono de sobre redondeado fijo arriba a la derecha. Al tocarlo se abre la tapa y aparece el modal con la carta |
| Candado con fecha 26/04/26 | Cuenta regresiva día/hora/min/seg, se abre solo a la medianoche del 26 de abril |

**Extra:** el modal de las cositas tiene flechas `‹ ›` y puntitos para saltar entre las que ya descubriste. En celular se desliza bien.

---

## Las estrellas de la poesía

No son imágenes: son `radial-gradient` de 1 a 2 px repetidos en mosaico, en dos capas (`::before` y `::after` de la sección) que van **titilando con ritmos distintos** (5.5s y 3.6s), así que no se ve "todo brillando a la vez".

**Por qué no pesa en el celular:** de cada capa solo se anima `opacity`. Eso lo resuelve la GPU sin repintar un solo píxel, que es lo más barato que hay. No hay imágenes, no hay `filter` y no hay JavaScript.

Igual, en pantallas chicas se **cae la capa de polvo** (`::after`, la que se repite cada 250px) y queda una sola, más lenta. Y se saca el `will-change` para que el navegador administre la memoria como quiera. En la práctica se ve casi igual.

Para apagar el titileo: en el bloque `TODO QUIETO` del final del CSS hay una línea comentada que dice `.bg-poesia::before`. La descomentás y listo.

## La carta ahora es el ícono de arriba a la derecha

Antes la carta tenía su propia sección en el medio de la página, con un sobre 3D grande. **Esa sección se sacó.** Ahora la carta vive en el botón redondo fijo de la esquina superior derecha (`.carta-fab`).

Qué hace al tocarlo:
1. La tapa del sobre gira y se abre
2. Medio segundo después aparece el modal con la carta
3. Al cerrar el modal, el sobre vuelve a cerrarse y lo podés volver a abrir

En computadora aparece un cartelito "La carta" al pasar el mouse. En celular el ícono es de 54px (se achica un poco para no pisarse con el reproductor de música).

**El sobre 3D grande sigue en el CSS** (buscá `SOBRE (3D)`), apagado y con un comentario que lo dice, por si algún querés volver a armar la sección. El JS es el que hay que cambiar si lo revivís: ahora se llama `abrirSobre()` y usa `cartaFab` en vez de `sobreWrap`.

---

## TODO QUIETO

La página **no tiene nada moviéndose solo**, y ya **no tiene pétalos**. Eso se hizo a pedido porque el movimiento continuo hacia titilar todo (la rosa, el anillo de flores y la carta parpadeaban).

**Qué quedó quieto:**
- La rosa de arriba (y tu PNG, cuando lo pongas) — no late más
- El anillo de flores que la rodea — no gira
- Las estrellas del fondo del **sobre** y del **candado** — no titilan
- Las flores del fondo — se pintan una sola vez y quedan fijas
- El scroll dejó de ser suave

**Lo único que sí se mueve solo** son las estrellas de la poesía (eso se pidió después, a propósito) y la apertura del sobre del ícono.

**Los pétalos se eliminaron por completo.** Saqué el botón "Que lluevan pétalos", todo el código del canvas de pétalos y la lluvia que salía al tocar las rosas, al abrir el sobre y al desbloquearse el candado.

Lo único que queda con movimiento es el parpadeo de las estrellas de la poesía, el sobre del ícono al abrirlo (una sola vez) y el fundido/pop de los modales. Nada de eso es movimiento continuo de la página.

### Si algún día querés que algo vuelva a moverse

En el CSS buscá el bloque que dice `TODO QUIETO` (está cerca del final, antes del `</style>`). Borrá las líneas de lo que quieras revivir:

```css
/* borras esta linea y la rosa vuelve a latir */
.hero-rose .rosa-svg,
.hero-rose.con-png .rosa-img,
```

## El candado está oculto

Lo escondí a propósito. Para volver a mostrarlo:

1. Abrí `index.html` y buscá `lock-sec bg-candado`
2. Borrá el `hidden` y el `style="display:none"` de esa línea

Queda así:
```html
<section class="lock-sec bg-candado">
```

**No toques nada más.** El JavaScript sigue corriendo solo y la fecha 26/04/26 ya está calculada, así que cuando lo muestres aparece con los días transcurridos andando.

## Poner tu PNG en la rosa

Copiá tu imagen a esta carpeta y renombrala **`rosa.png`**. Aparece sola.

Si el archivo no existe, queda el dibujo de la rosa que hice en SVG (sirve de respaldo, no se rompe nada).

Para que te quede bien, ajustá una variable. Buscá `--rosa-alto` en el CSS (está arriba de todo, en `:root`):
```css
--rosa-alto: 260px;   /* alto de la rosa en pantalla grande */
```
Y en celular está en 205px (se cambia en el `@media(max-width:768px)`).

### Si tu foto viene con el fondo puesto

**Tu foto original (`rosa.png`) tenía el fondo gris clarito, y por eso se veía un rectángulo feo alrededor de la rosa.** Ya está recortada: ahora solo se ve la rosa, con el borde difuminado y sin manchitas.

La foto sin tocar quedó guardada como **`rosa-original.png`**. No la borres, por si algún día la querés de nuevo.

Si ponés una foto nueva con fondo, no hace falta que la recortes a mano: hay un script que lo hace por vos.

```bash
python recortar-fondo.py
```

Borra el fondo, suaviza el borde, saca el halo blanco que queda alrededor y deja la imagen al tamaño justo. Si tu foto tiene el fondo de otro color (por ejemplo rosado en vez de gris), abrí el script y subí estos dos números:

```python
TOLERANCIA_COLOR = 30   # si el fondo tiene color, subilo (ej: 45)
FONDO_CLARO = 140       # si el fondo es oscuro, bajalo (ej: 100)
```

Con "reducir animaciones" del sistema, el halo y la sombra de la rosa no se mueven, pero se ven igual.

## Lo de la carta que titilaba

Era el `backdrop-filter` (el efecto de borrar el fondo) del encabezado de la carta. Va en un elemento `sticky` dentro de una caja que scrollea, y tenía que recomponer el fondo una y otra vez mientras el canvas de las flores se redibujaba. En algunos navegadores eso se ve como un parpadeo.

Lo arreglé por dos lados:
1. Saqué el `backdrop-filter` de ahí y lo cambié por un fondo opaco
2. Le puse su propia capa de dibujo (`translateZ(0)`)
3. Y saqué las animaciones infinitas, así que el canvas pinta una sola vez y no hay nada que recomponga

> **Aviso:** una versión anterior tenía un truco que al abrir un modal congelaba todas las animaciones con la clase `pausado` en el body. Eso Was un error: congelaba también la animación del propio modal y lo dejaba invisible (la carta y las rosas no abrían). **Eliminado.** No vuelvas a agregar una regla tipo `body.pausado *{animation-play-state:paused}` porque rompe los modales.

Si todavía titilea, decime y probamos bajándole el `backdrop-filter` al modal también.

Es el **26 de abril de 2026**, el día que empezaron a hablar. Esa fecha ya pasó, así que el candado **se abre siempre** y en vez de cuenta regresiva muestra **cuántos días lleva desde ese día** (ahora mismo: 157, y sube solo).

En la página vas a ver:
- El candado ya abierto
- Un número grande con los días transcurridos
- "Todo esto empezó el 26 de abril de 2026"
- Y la carta ahora menciona esa fecha

El número de días se calcula solo, no hay que tocarlo nunca. Para cambiar la fecha, editá `FECHA_CANDADO` (la primera línea del `<script>`):
```js
new Date(AÑO, MES-1, DÍA, HORA, MIN, 0, 0)
//        2026    3      26   0     0
//             ↑
//          mes-1: abril=3, porque enero es 0
```

Si algún día ponés una fecha **futura**, la misma sección se da vuelta sola y muestra la cuenta regresiva (días / horas / min / seg) en vez de los días transcurridos. No hay que cambiar nada.

**MODO_PRUEBA**: si lo ponés en `true`, abre el candado al instante. Está en `false`, dejalo así.

---

## Dónde tocar los textos

Todo arriba de un solo `<script>`.

**Las 20 cositas** — `RAZONES` (el nombre de la variable quedó viejo, pero es solo código). Son 20, editalas y listo. Cada rosa se abre en un modal y el contador va subiendo. Ya no hay lluvia de pétalos en ninguna.

**La poesía** — `POEMAS`. Cada una:
```js
{ chip:'Poesía', text:'Tu texto acá', author:'Tu firma' },
```
`\n` = salto de línea. Chips usados: `Poesía`, `Rima`, `Frase`, `Deseo`, `Haiku`, `Carta`. Poné los que quieras.

**La carta** — buscá `<div class="carta-cuerpo" id="cartaCuerpo">`. Son `<p>` normales.

---

## Música
Copiá el mp3 a la carpeta y renombralo **`cancion.mp3`** (minúsculas). Si no está, el reproductor dice "Falta cancion.mp3" y no rompe nada.

---

## Celular

- Los fondos con `fixed` se pasan a scroll normal en pantallas chicas (si no, iPhone se traba)
- La grilla pasa a 4 columnas, los poems a una columna
- Modales con padding chico y `max-height` para que nunca se corten
- Botones de 44px mínimo (el estándar de tap en celular)
- `body.locked` frena el scroll de fondo cuando hay un modal abierto
- El ícono de la carta baja a 54px y el reproductor de música se angosta (`max-width:calc(100vw - 5.2rem)`) para que los dos quepan arriba sin pisarse

## Otros detalles
- El ícono de la carta se puede volver a abrir las veces que quieras: al cerrar el modal, el sobre se cierra solo
- Las rosas se pueden destildar; el contador baja bien y el modal no se rompe
- Con "reducir animaciones" activo en el sistema, todo se apaga
- 77 KB, todo en un archivo (salvo la foto de fondo y el mp3)
