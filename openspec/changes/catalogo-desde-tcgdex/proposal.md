# Proposal

## Why

El usuario quiso cargar una carta del XY Trainer Kit de Sylveon y no encontró la expansión en Cargar. Cargar solo muestra expansiones del catálogo, y el catálogo internacional sale de pokemontcg.io, que no tiene ese kit ni otros productos. TCGdex y PokeCottage sí los tienen, y el Full ya los muestra, pero esas impresiones no están enlazadas a ninguna carta del catálogo y no se pueden cargar. En la familia pasa con:
- **XY Trainer Kit (Sylveon):** Eevee #13 y #21, Sylveon #15 y #30;
- XY Trainer Kit (Suicune);
- McDonald's Collection 2024;
- las promos MEP;
- Futsal 2020.

## What Changes

- **El catálogo suma las expansiones internacionales que solo tiene TCGdex.** Son unas 27, todas con cartas:
  - los Trainer Kits de DP, HGSS, BW, XY y SM;
  - McDonald's 2023 y 2024;
  - las promos MEP;
  - My First Battle;
  - Unseen Forces Unown Collection;
  - Futsal 2020;
  - Poké Card Creator Pack;
  - 30th Classic Collection;
  - Yellow A Alternate;
  - Mega Evolution Energy.

  Se guardan con `source = 'tcgdex-en'` e id `td-<id de TCGdex>`, con su nombre, serie, código, fecha y totales.
- **Quedan fuera:**
  - Pokémon TCG Pocket (serie `tcgp`), porque es digital;
  - las expansiones de TCGdex sin cartas (Jumbo cards, W Promotional, Sample, Radiant Collection);
  - las que ya cruzan con el catálogo.
- **Sus cartas se descargan la primera vez que se abren**, como las demás: nombre, número, Pokédex, rareza, ilustrador y tipo, desde TCGdex.
  - TCGdex no tiene foto de casi ninguna: solo Futsal 2020.
  - Sin foto, la carta muestra la foto solo local de PokeCottage cuando el Full la tiene, o una de referencia, como cualquier carta sin foto. El usuario puede subir la suya.
- **En Cargar** aparecen en el buscador de expansiones como cualquier otra: "XY trainer Kit (Sylveon)", con su código TK6S.
- **En el Full**, las impresiones de esas expansiones quedan enlazadas a su carta.
  - TCGdex cruza directo por el id.
  - PokeCottage cruza por el id cuando es el mismo (`mep`), y si no, por el nombre. Para los Trainer Kits, "XY Trainer Kit: Sylveon Half Deck" (`tk6b`) es "XY trainer Kit (Sylveon)".
  - Así el kit de Sylveon deja de estar dos veces.

**Fuera del alcance:**
- precios de esas cartas (pokemontcg.io y TCGplayer no las tienen);
- descargar fotos de otras fuentes para producción.

## Capabilities

### New Capabilities

### Modified Capabilities
- `catalogo`: las expansiones internacionales que solo tiene TCGdex.
- `universo-de-impresiones`: las impresiones de esas expansiones se enlazan a su carta, y los Trainer Kits de PokeCottage cruzan con los de TCGdex.

## Impact

- **Depende de `sellos-y-cruce-de-expansiones`:** el cruce por identificador tiene que estar antes, para no agregar como nuevas expansiones que el catálogo ya tiene (Undaunted, las promos SVP).
- **Datos:**
  - filas nuevas en `sets` y, al abrirlas, en `cards`, en las mismas tablas que usa Nitsu, así que también aparecen en Nitsu;
  - sin migración de esquema: `source` es texto.
- **Fuentes:**
  - una request a la lista de expansiones de TCGdex, que ya se pide, y una por expansión nueva al sincronizarlas (unas 27, una vez);
  - las cartas, de a una expansión cuando se abre.
- **Código:**
  - `packages/inventory/src/catalog.ts`: `syncTdSet` y `ensureSetCards` para `tcgdex-en`;
  - la sincronización de expansiones: agrega las de TCGdex que faltan;
  - `apps/arma/server/sources/catalog.ts`: el catálogo del Full incluye `tcgdex-en`;
  - `apps/arma/server/sources/tcgdex.ts` y `pokecottage.ts`: el cruce con esas expansiones;
  - `apps/arma/server/inventory.ts`: la lista de expansiones de Cargar y el buscador las incluyen.
- **Documentación:** README.
