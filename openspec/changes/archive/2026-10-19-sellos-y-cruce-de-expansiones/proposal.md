# Proposal

## Why

Al revisar Obsidian Flames y Prismatic Evolutions contra Bulbapedia aparecieron sellos duplicados o con el acabado equivocado. Además, hay impresiones que no se pueden cargar porque TCGdex no logró cruzar su expansión con la del catálogo:

- **Prismatic Evolutions:** las 9 ex con el sello "Prismatic Evolutions" (de la Surprise Box) aparecen dos veces, como "Holo con sello" (TCGdex) y "Normal con sello" (PokeCottage). Son holo.
- **Obsidian Flames, Espeon #86:** existe una sola carta con el sello "Obsidian Flames", Reverse Holo (regalo de Best Buy). El Full tiene 3: Holo y Reverse con sello (TCGdex) y Normal con sello (PokeCottage).
- **Obsidian Flames, Umbreon #130:**
  - la Reverse Holo con el sello "Obsidian Flames" aparece dos veces;
  - las de GameStop y EB Games, que son Reverse Holo, están como Normal;
  - la de Trick or Trade está dos veces, porque TCGdex la llama `trick-or-trade` y PokeCottage `trick-or-trade24`.
- **Expansiones de TCGdex sin cruzar:** se cruzan con el catálogo por nombre, y "Undaunted" no es "HS—Undaunted" ni "SVP Black Star Promos" es "Scarlet & Violet Black Star Promos". En la familia hay 136 impresiones de TCGdex sin carta del catálogo (62 de Undaunted y 74 de las promos SVP), que no se pueden cargar y duplican las de las otras fuentes.

## What Changes

1. **El acabado de los sellos de PokeCottage.**
   - PokeCottage no dice el acabado de sus sellos (salvo cuando trae `foil`), y hoy se toman como Normal.
   - Si TCGdex tiene el mismo sello en la misma carta con un solo acabado, el de PokeCottage toma ese acabado y se une a él.
2. **El acabado según las cartas adicionales de Bulbapedia.**
   - De la página de cada expansión, que el importador ya descarga para los idiomas, se lee la lista de cartas adicionales: número, sello entre comillas y acabado al comienzo de la nota ("Reverse Holo", "Cosmos Holo", "Holo", "Non-Holo").
   - Cuando la nota dice el acabado, ese acabado manda sobre TCGdex y PokeCottage para esa carta con ese sello.
   - Si el sello entre comillas es el nombre de la misma expansión ("Obsidian Flames"), es el sello de la expansión.
   - Fuente nueva "Bulbapedia (cartas adicionales)": solo texto, uso local, con permiso por revisar, como el resto de Bulbapedia.
3. **Un sello con su año.** Dos nombres de sello de la misma carta y acabado son uno si uno es el otro con un número al final (`trick-or-trade` y `trick-or-trade24`). Queda el más completo.
4. **Las expansiones de TCGdex por identificador.** Si el nombre no cruza, una expansión de TCGdex con el mismo identificador que una del catálogo (`hgss3`, `svp`, `hgss2`, `hgss4`, `sve`, `base1`) es esa.

**Resultado esperado en la familia**, al volver a traer los Full:
- Prismatic Evolutions: 9 impresiones menos.
- Obsidian Flames: Espeon #86 con una sola "Reverse · Sello de la expansión", y Umbreon #130 con un solo sello de la expansión, GameStop y EB Games como Reverse, y un solo Trick or Trade.
- Undaunted y las promos SVP: las impresiones de TCGdex se juntan con las de las otras fuentes y quedan enlazadas a su carta del catálogo.

**Fuera del alcance:**
- agregar al catálogo las expansiones que pokemontcg.io no tiene (Trainer Kits, McDonald's 2024, promos MEP): es el cambio `catalogo-desde-tcgdex`;
- leer otras notas de Bulbapedia que no sean el acabado.

## Capabilities

### New Capabilities

### Modified Capabilities
- `universo-de-impresiones`: cuatro reglas más al fusionar las fuentes, y la fuente "Bulbapedia (cartas adicionales)".

## Impact

- **Datos:** una migración que agrega la fuente `bulbapedia-adicionales` a `arma.sources`.
  - No toca el inventario.
  - Las impresiones que se unen conservan el código de la que queda. Una copia que ya esté en una impresión que desaparece (por ejemplo, una Umbreon GameStop cargada como Normal) deja de contar en el Master Set hasta que se mueva. Hoy no hay ninguna de esas copias.
- **Fuentes:** ninguna request nueva. Las páginas de las expansiones ya se descargan para los idiomas, de a 50 por request y con cache.
- **Código:**
  - `packages/core/src/arma.ts`: `mergeClaims` (puntos 1 y 3) y `parseAdditionalCards`, con pruebas;
  - `apps/arma/server/sources/bulbapedia-idiomas.ts`: devuelve también las cartas adicionales;
  - `apps/arma/server/importer.ts`: las aplica (punto 2);
  - `apps/arma/server/sources/catalog.ts`: el cruce por identificador (punto 4);
  - la migración `010`.
