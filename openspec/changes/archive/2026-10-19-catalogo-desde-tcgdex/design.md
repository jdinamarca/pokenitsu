# Design

## Context

- **La lista de expansiones:**
  - la sincroniza `apps/api/src/catalog.js` (`syncSets`), con las internacionales de pokemontcg.io (`ptcg`) y las japonesas de TCGdex (`tcgdex-ja`);
  - Arma la lee de la tabla `sets`.
- **Las cartas** se descargan bajo demanda con `ensureSetCards` (`packages/inventory/src/catalog.ts`), que hoy distingue `ptcg` y `tcgdex-ja`.
- **El Full** (`apps/arma/server/sources/catalog.ts`) carga el catálogo con `source IN ('ptcg', 'tcgdex-ja')`. TCGdex deja como `td:<id>` lo que no cruza, y PokeCottage como `pc:<id>`.
- **PokeCottage marca cada carta de un kit con un sello del mazo** (`sylveondeck`), y en su lista la expansión es `tk6b`, "XY Trainer Kit: Sylveon Half Deck".
- **TCGdex no tiene foto de las cartas de estas expansiones**, salvo Futsal 2020.

## Goals / Non-Goals

**Goals:**
- poder cargar las cartas de los productos que pokemontcg.io no tiene;
- que el Full las enlace.

**Non-Goals:** precios; fotos de producción para esas cartas.

## Decisions

1. **La sincronización vive en `packages/inventory`** (`syncTdSets`), para que la usen Nitsu y Arma.
   - Lee `GET /v2/en/sets` y descarta lo que cruza con `ptcg`, con el mismo cruce del Full: `tcgdex_en`, nombre e identificador (de `sellos-y-cruce-de-expansiones`).
   - Por cada expansión que queda, lee `GET /v2/en/sets/<id>` y la guarda si tiene cartas y su serie no es `tcgp`.
   - Corre junto a `syncSets` de la API, y en Arma al arrancar si no hay ninguna `tcgdex-en` o la última es de hace más de 3 días.
2. **Las cartas** se bajan con `syncTdSet`: el detalle de la expansión trae la lista, y el detalle de cada carta trae Pokédex, rareza, ilustrador y tipo. Una request por carta, con la pausa de `fetchJSON`, una sola vez por expansión, y como mucho 89 (MEP).
   - Ids: `td-<id de la carta en TCGdex>` (`td-tk-xy-sy-13`).
   - Imagen: `<image>/low.webp` y `/high.webp` cuando existe.
3. **El Full:**
   - `loadCatalog` incluye `tcgdex-en` y un mapa `fromTcgdex` que también apunta a `td-<id>`;
   - `setKeyOf` de TCGdex ya usa `fromTcgdex`, así que la impresión queda en `td-tk-xy-sy` en vez de `td:tk-xy-sy`;
   - antes de importar, el importador pide `ensureSetCards` de las expansiones `tcgdex-en` que aparecen en los claims de TCGdex, para que `cardIdOf` encuentre la carta.
4. **PokeCottage:** si su set no cruza por id (`mep` sí cruza) ni por el nombre del catálogo, prueba el nombre de los kits.
   - `/^(\w+) Trainer Kit: (.+?) Half Deck$/` se lee como `"$1 trainer Kit ($2)"`, comparado con `nameKey`.
   - El sello del mazo (`sylveondeck`) se descarta en esa carta, porque la expansión ya es el kit. Así se une con la de TCGdex.
5. **Cargar y su buscador** filtran hoy por fuente en varios lugares: se revisan para que `tcgdex-en` se trate como internacional (`origin: 'INT'`), como `ptcg`.

## Risks / Trade-offs

- **Nitsu también las ve.** Se revisa que Mi colección y Cargar de Nitsu abran una expansión `tcgdex-en`: `ensureSetCards` es compartido.
- **Sin fotos**, la vitrina de Cargar muestra fotos de referencia o las solo locales. Es lo mismo que hoy con las cartas japonesas sin foto.
- **TCGdex puede agregar una expansión que después llegue a pokemontcg.io.** El cruce la tomaría como `ptcg`, y la `tcgdex-en` quedaría sin uso. No se borra si tiene copias. Queda anotado como riesgo, sin solución automática por ahora.
