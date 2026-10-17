---
name: Arma tu colección
description: El Full de impresiones de un Pokémon en una vitrina de tienda; las reglas apagan la luz de lo que no cuenta.
colors:
  felt: '#0f3a31'
  felt-deep: '#0b2e27'
  felt-line: '#1d5446'
  felt-ink: '#cfe3d9'
  felt-mute: '#93b8ab'
  room: '#151513'
  room-raised: '#1c1b18'
  room-line: '#2c2a25'
  ink: '#efe9dc'
  ink-mute: '#aaa496'
  led-light: '#fff3dc'
  card-stock: '#e8dcc2'
  stock-ink: '#1a1712'
  sticker-ok: '#2fae66'
  sticker-review: '#f0a33a'
  sticker-none: '#e2453c'
  sticker-own: '#3b7fe0'
  sticker-local: '#9b6ef3'
typography:
  counter:
    fontFamily: 'Archivo Narrow, Archivo, sans-serif'
    fontSize: '66px'
    fontWeight: 700
    lineHeight: 0.9
    letterSpacing: '-0.01em'
    fontFeature: 'tnum'
  headline:
    fontFamily: 'Archivo, system-ui, sans-serif'
    fontSize: '30px'
    fontWeight: 700
    lineHeight: 1.15
  title:
    fontFamily: 'Archivo, system-ui, sans-serif'
    fontSize: '21px'
    fontWeight: 700
    lineHeight: 1.2
  body:
    fontFamily: 'Archivo, system-ui, sans-serif'
    fontSize: '14px'
    fontWeight: 500
    lineHeight: 1.45
  label:
    fontFamily: 'Archivo, system-ui, sans-serif'
    fontSize: '11px'
    fontWeight: 600
    letterSpacing: '0.12em'
  tag:
    fontFamily: 'Archivo Narrow, Archivo, sans-serif'
    fontSize: '11px'
    fontWeight: 600
    lineHeight: 1.2
rounded:
  tag: '3px'
  card: '5px'
  chip: '6px'
  control: '8px'
  panel: '10px'
  case: '14px'
spacing:
  xs: '6px'
  sm: '10px'
  md: '16px'
  lg: '22px'
components:
  rule-switch:
    backgroundColor: 'transparent'
    textColor: '{colors.felt-ink}'
    rounded: '{rounded.control}'
    padding: '9px 10px'
  rule-switch-active:
    backgroundColor: '{colors.led-light}'
    textColor: '{colors.stock-ink}'
    rounded: '{rounded.control}'
  view-chip:
    backgroundColor: '{colors.felt-deep}'
    textColor: '{colors.felt-ink}'
    rounded: '{rounded.chip}'
    padding: '6px 10px'
  view-chip-selected:
    backgroundColor: '{colors.card-stock}'
    textColor: '{colors.stock-ink}'
  printing-tag:
    backgroundColor: '{colors.card-stock}'
    textColor: '{colors.stock-ink}'
    typography: '{typography.tag}'
    rounded: '{rounded.tag}'
    padding: '5px 7px'
  button-primary:
    backgroundColor: '{colors.led-light}'
    textColor: '{colors.stock-ink}'
    rounded: '9px'
    padding: '11px 16px'
---

# Design System: Arma tu colección

## Overview

**Creative North Star: "El mostrador del coleccionista"**

El lugar donde un coleccionista serio revisa, compara y decide carta por carta, de noche, en sesiones largas frente al computador. El sistema toma su material de una tienda especializada: el riel y la vitrina son de fieltro verde profundo, la sala es grafito tibio, la luz es un LED cálido que solo toca el borde del vidrio y lo que está en juego, y cada impresión lleva una etiqueta de cartulina con un sticker de inventario que dice si su dato se puede usar.

Es denso pero se lee sin cansar. Las cartas siempre se ven grandes y con su foto real; los controles son los de siempre (interruptores, botones, campos) vestidos con el material de la tienda, nunca disfrazados de otra cosa. Lo que importa es el inventario real y la procedencia de cada dato, así que el color hace trabajo: la luz marca lo activo, el sticker marca el permiso, la penumbra marca lo que una regla dejó fuera.

**Key Characteristics:**

- Fieltro verde como cascarón y como fondo de la vitrina; grafito tibio como sala.
- Una sola luz cálida, reservada para lo activo y para el borde del vidrio.
- Etiquetas de cartulina con cifras condensadas y un sticker de color por fuente.
- Lo que una regla deja fuera se apaga en su lugar: nunca desaparece.
- Cartas grandes, con su foto; nunca miniaturas perdidas entre controles.

## Colors

Un mundo nocturno y cálido: fieltro, grafito, cartulina y una sola luz, con stickers que solo hablan de permisos.

### Primary

- **Fieltro de vitrina** (felt): cascarón de la app (riel), fondo de la vitrina, pantallas de entrada y cajas de "lo que tienes". Es el color que reconoce la app.
- **Luz LED cálida** (led-light): lo activo y nada más. La regla que se acaba de tocar, el borde superior de la vitrina, la carta elegida, la cifra del contador y el botón principal.

### Secondary

- **Cartulina de etiqueta** (card-stock): etiquetas de cada impresión y la vista guardada elegida; siempre con tinta de etiqueta (stock-ink) encima.

### Tertiary

- **Stickers de inventario**: verde (sticker-ok) con permiso o licencia abierta, ámbar (sticker-review) licencia por revisar, rojo (sticker-none) sin permiso, azul (sticker-own) dato propio, violeta (sticker-local) foto solo para uso local. Solo para procedencia. El violeta solo aparece con las fotos solo locales encendidas (`ARMA_FOTOS_LOCALES=1`).

### Neutral

- **Sala de grafito** (room): fondo de la zona de trabajo.
- **Grafito alzado** (room-raised): la ficha lateral.
- **Fieltro hondo y su línea** (felt-deep, felt-line): cajas y bordes sobre el fieltro.
- **Tinta de sala y tinta apagada** (ink, ink-mute): texto principal y secundario sobre grafito; sobre el fieltro, felt-ink y felt-mute.

### Named Rules

**La Regla de la Luz Única.** La luz cálida marca una sola cosa a la vez por zona: la regla activa en el riel, la carta elegida en la vitrina. Si dos cosas brillan, ninguna está activa.

**La Regla del Sticker.** Los colores de sticker hablan solo de permisos de una fuente. Nunca se usan como acento, estado de carga ni decoración.

## Typography

**Display Font:** Archivo Narrow (con Archivo, sans-serif)
**Body Font:** Archivo (con system-ui, sans-serif)

**Character:** Una grotesca de trabajo, firme y legible, con su versión condensada para las cifras y las etiquetas, como los números impresos en una etiqueta de precio. Ambas se sirven desde el propio paquete (@fontsource), nunca desde un CDN.

### Hierarchy

- **Contador** (700, 66px, 0.9, cifras tabulares): "bajo luz / Full", la única cifra grande de la pantalla.
- **Headline** (700, 30px, 1.15): título de las pantallas de entrada (sin sesión, vacío, error).
- **Title** (700, 21px, 1.2): nombre de la carta en la ficha; el Pokémon en el riel (700, 26px).
- **Body** (500, 14px, 1.45): texto corriente, reglas, notas; las notas largas no pasan de 62ch.
- **Label** (600, 11–12px, tracking 0.08–0.16em, mayúsculas): encabezados de sección y de repisa ("REGLAS", "JUNGLE · #51"). Son títulos en sí mismos.
- **Etiqueta** (Archivo Narrow 600, 11px): idioma y variante en cada etiqueta de cartulina.

### Named Rules

**La Regla de la Cifra Tabular.** Todo número que cambia (contador, copias, precios) usa cifras tabulares, para que no baile al cambiar.

## Layout

Una herramienta de escritorio en tres columnas fijas que ocupan toda la ventana: riel de reglas (284px), zona de trabajo fluida y ficha lateral (352px). Bajo 1360px, el riel baja a 264px y la ficha a 316px. Bajo 900px las tres zonas se apilan y la página hace scroll.

La zona de trabajo tiene arriba el contador con su nota y la leyenda de stickers, y debajo la vitrina, que hace scroll por dentro con su borde de luz pegado arriba. La vitrina se ordena en repisas por diseño (una ilustración y todas sus impresiones), de la más antigua a la más nueva; dentro de una repisa, por idioma (inglés primero), luego expansión, acabado y sello. Bajo la leyenda, "Ordenar: Por diseño · Por expansión" (dos botones como los chips de vista, en grafito; el elegido en cartulina) cambia a una repisa por expansión en una sola línea de tiempo que mezcla regiones (ロケット団, Japón 1997, antes que Team Rocket, 2000). Su subtítulo es "Región · AAAA-MM" o "Fecha por confirmar", y dentro va por número y luego idioma, acabado y sello.

**Riel de navegación:** bajo la marca, "Arma · Eevee", "Cargar" y "Mi inventario" con su icono de línea (Layers, Plus, Archive); la pantalla actual va en cartulina. Debajo, la zona propia de cada pantalla (reglas y vistas en Eevee, expansiones recientes en Cargar, ubicaciones en Mi inventario) y "Cerrar sesión" al pie. Las listas del riel (recientes, ubicaciones) son renglones con su cifra condensada a la derecha y una línea de ayuda; el elegido se ilumina con la luz cálida.

**Cargar (canvas AO):** el mismo esqueleto. Arriba, el contador "N / total encendidas", el nombre de la expansión con su idioma y la entrada grande (48px, cifras condensadas en luz cálida, borde de luz al enfocar). Debajo, los ajustes de la sesión como chips de grafito con su select (Idioma, Estado, Para, Guardar en) y, a la derecha, "Todas · Solo las que faltan". La vitrina muestra la expansión entera por número; la ficha muestra la carta marcada, lo que se va a cargar, "Cargar una" y "Deshacer", los avisos y "En esta sesión".

**Mi inventario (canvas AR):** el contador de copias con su nota (cartas distintas y valor para vender), la búsqueda y "Para". La vitrina tiene una repisa por ubicación real, en el orden del usuario; las repisas envuelven sus cartas en varias filas (nunca hay scroll horizontal escondido). La ficha usa formularios en línea (mover, personales, mi precio), nunca ventanas emergentes.

Ritmo: 6 / 10 / 16 / 22px. Las cartas van a 112px de ancho, con 14px entre columnas y 16px entre filas.

## Elevation & Depth

Profundidad por material y luz, no por tarjetas apiladas. La vitrina es un plano de fieltro hundido (un filo de luz interior arriba y una línea de fieltro alrededor). Las cartas tienen una sombra corta debajo, como apoyadas en la repisa. La ficha usa una sombra larga y suave bajo la foto grande. La regla activa es lo único que proyecta un resplandor cálido.

### Shadow Vocabulary

- **Carta en repisa** (`box-shadow: 0 12px 22px -12px rgba(0,0,0,0.9)`): cada carta de la vitrina.
- **Vitrina hundida** (`box-shadow: inset 0 1px 0 rgba(255,243,220,0.4), inset 0 0 0 1px #24584b, 0 24px 50px -30px rgba(0,0,0,0.8)`): el cuerpo de la vitrina.
- **Luz de regla activa** (`box-shadow: 0 10px 28px -12px rgba(255,236,190,0.55)`): solo la regla recién tocada.
- **Foto de ficha** (`box-shadow: 0 30px 60px -26px rgba(0,0,0,0.9)`): la carta grande de la ficha.

### Named Rules

**La Regla de la Penumbra.** Lo que una regla deja fuera no se oculta ni se mueve: se apaga en su lugar (escala de grises y brillo 0.32 en la foto, etiqueta al 38%) en 450ms con ease-out. Con "reducir movimiento" el cambio es instantáneo.

## Shapes

Esquinas suaves y chicas, como objetos impresos y de tienda: etiqueta 3px, carta 5px, chips de vista 6px, controles 8px, cajas 10px y la vitrina 14px. Los stickers son círculos de 9px. Las fotos de las cartas conservan su proporción real (63:88), recortadas sin deformar.

## Components

### Interruptor de regla

Un renglón entero que se toca, con su interruptor y una línea de ayuda.

- **Forma:** esquinas de 8px, sin borde.
- **Apagado / encendido:** el interruptor pasa de fieltro hondo a cartulina; la perilla corre 12px en 220ms.
- **Activo:** la regla recién tocada se ilumina con luz cálida, con tinta de etiqueta encima. Solo una a la vez.
- **Accesible:** `role="switch"` con `aria-checked`.

### Vistas guardadas

Chips de fieltro hondo con borde de fieltro; la elegida pasa a cartulina. "Full" siempre está. Guardar es un formulario en línea (campo y botón de cartulina), sin ventanas emergentes.

### Impresión en la vitrina (componente firma)

La carta a 112px con su foto real y, debajo, una etiqueta de cartulina con idioma y variante en Archivo Narrow y el sticker de su mejor permiso. Si la foto es solo para uso local, lleva un sticker violeta de 10px en la esquina inferior izquierda de la foto, con un anillo de grafito para separarlo de la ilustración; en la ficha, la foto lleva la nota "Foto solo para uso local · fuente". Una foto de otra variante (la 1st Edition en una unlimited) se ve atenuada como las de referencia, con la nota "Foto de la 1st Edition · falta esta variante". Bajo la foto de la ficha van las herramientas de foto en grafito: "Esta foto muestra" (un select) y "Subir tu foto" / "Quitar tu foto" (botones como los chips de vista).

- **Sin foto propia:** usa la foto de otra impresión del mismo diseño, un poco atenuada.
- **Copias:** una pastilla de luz cálida (×2) en la esquina.
- **Fuera por una regla:** penumbra en su lugar.
- **Elegida:** contorno de luz cálida a 3px.
- **Hover:** sube 3px.
- **Código de catálogo:** en su tooltip y en su etiqueta accesible.

### Carta de carga y de estantería

La misma carta de la vitrina, a 112px, con una etiqueta de cartulina: en Cargar, número y variante automática; en Mi inventario, idioma · variante y estado.

- **En Cargar:** encendida si tienes alguna copia (cualquier variante, idioma o estado), en penumbra si te falta. La marcada (al escribir su número o con un clic) lleva el contorno de luz a 3px. Una expansión de más de 250 cartas usa `content-visibility: auto`.
- **Sin foto propia ni del catálogo:** la foto de referencia del mismo Pokémon, atenuada como las de referencia de Eevee; en la ficha grande, con la nota "Foto de referencia: esta carta no tiene foto". Tu foto de la variante siempre gana.

### Ficha

Columna de grafito alzado: código de catálogo en cifras condensadas, foto grande, nombre y datos, una franja de estado ("Cuenta para tu colección" / "Fuera de tu colección por…"), la caja de fieltro con tus copias, y "De dónde sale cada dato", una lista de definiciones con una fuente y su sticker por línea.

### Botón principal

Luz cálida con tinta de etiqueta, 9px de esquinas, 11×16px, con icono de línea (lucide) a la izquierda; al presionar se encoge a 0.97.

### Acceso (Mostrador)

La pantalla `/entrar` es el mostrador de la tienda, elegido en el canvas (AK):

- **Izquierda:** el fieltro con el titular en Archivo 54px sobre luz cálida y una repisa de cinco cartas reales bajo la luz del vidrio. Dos están en penumbra.
- **Derecha:** el formulario en grafito alzado: pestañas "Entrar · Crear cuenta" como chips de vista, campos con su etiqueta arriba, el botón principal en luz cálida y "Continuar con Google" en grafito.
- **Al enfocar un campo** la luz del vidrio sube y las cartas en penumbra se encienden: el mismo lenguaje de la penumbra de las reglas, al revés. Es un cambio de luz, no de forma; con "reducir movimiento" es instantáneo.
- **En pantallas angostas** el formulario va primero y la repisa abajo, con scroll horizontal.
- **Al pie del riel**, "Cerrar sesión" como un chip con borde de fieltro.

## Do's and Don'ts

### Do:

- **Do** mostrar las cartas grandes (112px en la vitrina, ancho completo en la ficha) y con su foto real o la de su mismo diseño.
- **Do** apagar en su lugar lo que una regla deja fuera, en 450ms con ease-out, e instantáneo con "reducir movimiento".
- **Do** reservar la luz cálida (#fff3dc) para una sola cosa activa por zona.
- **Do** marcar la procedencia solo con los stickers de permiso (verde, ámbar, rojo, azul y, con las fotos solo locales, violeta).
- **Do** usar cifras tabulares en todo número que cambia.
- **Do** dibujar los iconos con una sola librería de línea (lucide), nunca con emoji ni glifos.

### Don't:

- **Don't** convertir la pantalla en un dashboard de tarjetas con métricas grandes; la única cifra grande es el contador.
- **Don't** poner un texto en mayúsculas sobre un título como "eyebrow": el nombre de la app va aparte, en el riel o en la esquina.
- **Don't** usar colores de caricatura, Poké Balls decorativas ni estética infantil.
- **Don't** usar neón, degradados decorativos, vidrio esmerilado ni texto con degradado.
- **Don't** mostrar fotos de fuentes sin permiso de imagen (PokeCottage, Bulbapedia, tiendas).
