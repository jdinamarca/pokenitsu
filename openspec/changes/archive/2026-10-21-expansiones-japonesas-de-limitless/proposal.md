## Why

El usuario quiere cargar cualquier carta japonesa, y no puede cargar la Eevee-GX 019/038 de los Starter Sets de Eevee GX (SMI, 2018). El Full sí la tiene (`EEV·PC:JPN_SMI·19`), pero no existe en el catálogo. Cargar solo muestra las expansiones de `sets`, y las japonesas vienen de TCGdex, que no tiene SMI, ni SML (Family Pokémon Card Game), ni casi ningún mazo, starter set o caja.

Comparamos las 264 expansiones japonesas de Limitless TCG con el catálogo. **145 no existen en el catálogo**, con unas 7.500 cartas:
- Todas las de Black & White: TCGdex no tiene ninguna japonesa de BW.
- Las promos SM-P, S-P, BW-P y XY-P.
- Los mazos y starter sets desde 2010 (SMA…SMN, SA…SO, SVA…SVOM, MBD, MEE, etc.).

Además hay dos errores del #117. Limitless y TCGdex usan códigos distintos en ocho expansiones de XY. Por ejemplo, Collection X es XY1a en TCGdex y XY1x en Limitless. Y en XY8 y XY11 el mismo código nombra expansiones distintas:
- Limitless XY8b es Blue Shock (青い衝撃). TCGdex llama XY8b a Red Flash (赤い閃光).
- Limitless XY11b es Fiery Fighter (爆熱の闘士). TCGdex llama XY11b a Cruel Traitor (冷酷の反逆者).

El #117 llenó `ja-XY8b` y `ja-XY11b` con la lista del mismo código en Limitless. Por eso quedaron con las cartas de la otra expansión: 122 cartas y sus 122 fotos locales. Collection X/Y, Gaia Volcano/Tidal Storm, Blue Shock y Fiery Fighter quedaron vacías, porque Limitless no tiene sus códigos de TCGdex.

## What Changes

- **Expansiones japonesas de Limitless:** solo en modo local (`ARMA_FOTOS_LOCALES=1`), al arrancar el servidor se lee el índice de expansiones japonesas de Limitless. Cada expansión que el catálogo no tiene se agrega con su nombre en inglés, fecha, era, código y cantidad de cartas (`sets.source = 'limitless'`). Después se agrega su lista de cartas, igual que en el #117: número, nombre japonés, tipo, rareza, Pokédex por el nombre y `list_source = 'limitless'`. Una expansión que el catálogo ya tiene (por código, o por las equivalencias de abajo) no se duplica.
- **Ids:** `ja-<código de Limitless>` (`ja-SMI`, `ja-SML`, `ja-BW4`). Las promos usan el código de TCGdex (`ja-SM-P`, `ja-S-P`, `ja-BW-P`, `ja-XY-P`), así funcionan las fotos locales de Limitless que ya existen.
- **Equivalencias de códigos XY**, comprobadas carta por carta contra las listas y los nombres de ambas fuentes. Se usan para la lista y para las fotos:

  | TCGdex | Limitless | Expansión |
  |---|---|---|
  | XY1a / XY1b | XY1x / XY1y | Collection X / Y |
  | XY5a / XY5b | XY5g / XY5t | Gaia Volcano / Tidal Storm |
  | XY8a / XY8b | XY8b / XY8r | Blue Shock / Red Flash |
  | XY11a / XY11b | XY11b / XY11r | Fiery Fighter / Cruel Traitor |

- **Reparar XY8 y XY11:** una migración mueve las cartas de Limitless de `ja-XY8b` a `ja-XY8a`, y las de `ja-XY11b` a `ja-XY11a`, con sus fotos locales. Son las expansiones a las que de verdad pertenecen. `ja-XY8b` y `ja-XY11b` se llenan después con la lista correcta. Ninguna copia del inventario, impresión del Full ni colección usa esas cartas (lo revisamos).
- **El Full se enlaza** con las cartas nuevas: las impresiones `pc:jpn_<código>` cuyo código es el de Limitless (`pc:jpn_smi` → `ja-SMI`), y las que PokeCottage llama distinto (`jpn_bw8t` Thunder Knuckle → BW8n, `jpn_smxy` → XY, `jpn_swshp` → S-P, `jpn_svs` → SD, `jpn_sfp` → SH, `jpn_bwsc` → SC, `jpn_bw8s` → BW8f, `jpn_sm1+` → SM1p). Solo se enlaza cuando la carta tiene el mismo número y el mismo Pokédex. También se enlazan las impresiones `ja-*` que se importaron antes de que su carta existiera (Leafeon V de S12a, Gardevoir & Sylveon GX de SM9a). El enlace se repite después de cada importación.

**Fuera del alcance:**
- Las expansiones japonesas anteriores a Black & White (PCG, ADV, DP, Pt, LEGEND): Limitless no las tiene. Quedan como están.
- Los nombres japoneses de las expansiones nuevas: Limitless solo da el nombre en inglés.
- Producción: sin modo local no se pide nada a Limitless.
- No se tocan copias del inventario del usuario.

## Capabilities

### New Capabilities

### Modified Capabilities
- `detalles-del-catalogo-en-arma`: expansiones japonesas que solo tiene Limitless, equivalencias de códigos XY y enlace del Full con ellas.

## Impact

- `apps/arma/server/jaSets.ts` (nuevo): índice de Limitless, alta de expansiones, enlace del Full.
- `apps/arma/server/limitless.ts`: equivalencias de códigos XY.
- `apps/arma/server/jaLists.ts`: llenar también las expansiones `limitless`.
- `apps/arma/server/index.ts`: correr la sincronización al arrancar y después de importar.
- Migración `015_expansiones_japonesas_de_limitless.sql`: fuente `limitless` en `sets` y reparación de XY8/XY11.
- `README.md`.
