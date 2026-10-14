# imagenes Specification

## Purpose
Tener una copia propia de las imágenes de las cartas del catálogo, para no depender de otros sitios para mostrarlas, y servirla desde la app (en local o desde un storage en producción).

## Requirements

### Requirement: Copia propia de las imágenes del catálogo
El sistema SHALL poder copiar la imagen de cada carta del catálogo a `IMAGE_DIR` como WebP en dos tamaños (245 y 600 px de ancho), descargando una sola imagen por carta, solo desde `images.pokemontcg.io` o `assets.tcgdex.net`, identificándose como Nitsu. MUST NOT descargar imágenes de PokeCottage ni de Scrydex; para las cartas con imagen de Scrydex SHALL usar la de TCGdex si existe. La descarga SHALL poder cortarse y retomarse sin repetir lo hecho.

#### Scenario: Carta internacional
- **WHEN** se copia Caterpie de 151 (`sv3pt5-10`)
- **THEN** quedan `cards/sv3pt5/sv3pt5-10-small.webp` (245 px) y `-large.webp` (600 px), y la carta apunta a `/img/cards/sv3pt5/sv3pt5-10-small.webp`

#### Scenario: Imagen de Scrydex
- **WHEN** la imagen original de una carta es de `images.scrydex.com`
- **THEN** se copia la de TCGdex, y si TCGdex no la tiene la carta queda omitida con el motivo

#### Scenario: Cortar y retomar
- **WHEN** la descarga se corta a mitad de camino y se vuelve a ejecutar
- **THEN** sigue con las cartas que faltan, sin archivos a medias

### Requirement: Registro de las imágenes
Por cada carta y tamaño, el sistema SHALL guardar el estado (copiada, sin foto, omitida o con error), el archivo, el link original, el peso, las dimensiones, la huella sha256, la fecha y cuándo se subió al storage. Una sincronización del catálogo MUST NOT reemplazar la imagen de una carta ya copiada.

#### Scenario: Sincronizar una expansión ya copiada
- **WHEN** se vuelve a sincronizar 151 desde pokemontcg.io
- **THEN** las cartas copiadas siguen apuntando a `/img/…` y las demás a su link original

### Requirement: Servir las imágenes copiadas
`GET /img/<archivo>` SHALL servir el archivo de `IMAGE_DIR` con caché de una semana; si no está, SHALL redirigir al storage (`IMAGE_BASE_URL`) o, sin storage, al link original de la carta. Rutas que no sean de una imagen de carta MUST responder 404.

#### Scenario: Archivo que falta
- **WHEN** se pide la imagen grande de una carta copiada cuyo archivo no está en esta máquina y no hay storage
- **THEN** la respuesta redirige a su link original de pokemontcg.io
