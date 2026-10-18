# Proposal

## Why

Desde el #87, casi todas las cartas japonesas tienen ilustrador y número de Pokédex. Pero Arma no muestra esos datos en ninguna parte: no hay lista de ilustradores ni Pokédex, y las cartas solo se ven en Cargar, en Mi inventario y en la vitrina del Full de Eevee. El usuario pidió dos pantallas nuevas, "atractivas, entretenidas y sofisticadas":

- una lista de **todos los ilustradores**; al entrar a uno, una galería con **todas las cartas que ilustró**, en color las que tiene y en blanco y negro las que le faltan;
- una **Pokédex** separada por generación (Kanto, Johto…), con la misma galería por Pokémon.

Nitsu tiene una sección Ilustradores, pero solo con el catálogo internacional. Arma la reemplaza por etapas ([ADR 0021](../../../docs/adr/0021-arma-tu-coleccion-reemplaza-a-nitsu.md)).

## What Changes

- **Riel:** dos enlaces nuevos, "Ilustradores" (`/ilustradores`) y "Pokédex" (`/pokedex`), para cualquier cuenta con sesión. Sin sesión, llevan a `/entrar` y vuelven a la misma pantalla.
- **Ilustradores, como galería de firmas:**
  - una grilla de tarjetas: el nombre del artista en una tipografía de firma, sus años (1996 – 2026) y un anillo de avance con "12 / 310", que son las cartas distintas suyas que tienes de las que existen en el catálogo;
  - al pasar el mouse o enfocar una tarjeta, su mejor carta asoma detrás, como en una exposición. Esa imagen se pide solo en ese momento. En el teléfono, cada tarjeta muestra una miniatura de la carta;
  - arriba hay un buscador por nombre y un orden: más avance, más cartas mías, más cartas en el catálogo o nombre.
- **Pokédex, con regiones en pestañas:**
  - Kanto · Johto · Hoenn · Sinnoh · Teselia · Kalos · Alola · Galar · Paldea, cada pestaña con su avance (especies con alguna carta tuya de las de esa región);
  - cada Pokémon es una ventanita numerada (#001) con su nombre (y en japonés debajo), el arte de tu mejor carta en color o una carta suya en blanco y negro si no tienes ninguna, y "3 / 62".
- **La galería de un ilustrador o de un Pokémon:**
  - un encabezado con el nombre, un contador grande ("12 de 310") y los filtros **Todas · Tengo · Me faltan**;
  - la vitrina de fieltro con **una repisa por expansión**, de la más nueva a la más antigua, cada una con su nombre, código y "3 / 5";
  - las cartas que tienes, en color y con cuántas copias; las que faltan, en blanco y negro;
  - en la de un Pokémon, entran también las cartas de varios Pokémon (TAG TEAM) donde aparece.
- **Un selector Todas · Internacionales · Japonesas** en las cuatro pantallas. Una japonesa y su inglesa equivalente cuentan como dos cartas distintas.
- **Qué cuenta como "tengo":** cualquier copia en el inventario de la cuenta, en cualquier idioma, variante, estado o ubicación, para vender o personal. Las fotos siguen el mismo orden de Mi inventario (foto propia, catálogo, solo local con su marca violeta).
- **Diseño:** usa los tokens de Arma (fieltro, sala, cartulina). Las cartas entran escalonadas, las tarjetas tienen hover, y al pasar de blanco y negro a color hay una transición. Con "reducir movimiento", nada se mueve.

**Fuera del alcance:**
- favoritos, niveles de carta, kits y lotes de venta de un ilustrador (están en Nitsu y pueden venir después);
- filtrar las copias por idioma o por personales;
- los cameos;
- abrir la ficha de una carta desde la galería.

## Capabilities

### New Capabilities
- `ilustradores-en-arma`: la lista de ilustradores y la galería de cartas de cada uno.
- `pokedex-en-arma`: la Pokédex por región y la galería de cartas de cada Pokémon.

### Modified Capabilities
(ninguna)

## Impact

- **Datos:** sin migración y solo lectura. Lee `cards`, `sets`, `inventory` (con `asViewer`, solo las copias de la cuenta) y las fotos de `arma.card_photos`. Los nombres de las especies salen de la lista de PokéAPI que ya está en `arma.source_cache` (#87).
- **Código:**
  - `apps/arma/server/gallery.ts`: las rutas `GET /api/artists`, `/api/artists/cards?name=`, `/api/pokedex` y `/api/pokedex/:dex`, con el parámetro `scope=all|intl|ja`;
  - `packages/core`: las regiones por número de Pokédex y el armado puro de las repisas y los avances, con pruebas;
  - `apps/arma/src`: `Ilustradores.tsx`, `Pokedex.tsx`, un componente de galería compartido, las rutas, los enlaces en `Shell`, `api.ts` y los estilos.
  - Una tipografía de firma, servida localmente con `@fontsource`.
- **Documentación:** README y `apps/arma/DESIGN.md`.
