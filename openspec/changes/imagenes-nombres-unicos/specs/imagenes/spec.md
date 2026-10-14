## MODIFIED Requirements

### Requirement: Copia propia de las imágenes del catálogo
El sistema SHALL poder copiar la imagen de cada carta del catálogo a `IMAGE_DIR` como WebP en dos tamaños (245 y 600 px de ancho), descargando una sola imagen por carta, solo desde `images.pokemontcg.io` o `assets.tcgdex.net`, identificándose como Nitsu. MUST NOT descargar imágenes de PokeCottage ni de Scrydex; para las cartas con imagen de Scrydex SHALL usar la de TCGdex si existe. La descarga SHALL poder cortarse y retomarse sin repetir lo hecho. Cada carta SHALL tener un nombre de archivo distinto aunque su id tenga signos que no sirven en un archivo.

#### Scenario: Carta internacional
- **WHEN** se copia Caterpie de 151 (`sv3pt5-10`)
- **THEN** quedan `cards/sv3pt5/sv3pt5-10-small.webp` (245 px) y `-large.webp` (600 px), y la carta apunta a `/img/cards/sv3pt5/sv3pt5-10-small.webp`

#### Scenario: Imagen de Scrydex
- **WHEN** la imagen original de una carta es de `images.scrydex.com`
- **THEN** se copia la de TCGdex, y si TCGdex no la tiene la carta queda omitida con el motivo

#### Scenario: Cortar y retomar
- **WHEN** la descarga se corta a mitad de camino y se vuelve a ejecutar
- **THEN** sigue con las cartas que faltan, sin archivos a medias

#### Scenario: Unown con signos
- **WHEN** se copian las Unown `ex10-?` y `ex10-!`
- **THEN** cada una queda en su propio archivo (`ex10-_3f-small.webp` y `ex10-_21-small.webp`) y ninguna queda con error
