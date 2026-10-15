# Proposal

## Why

El usuario notó que faltan cartas en español en el Full de Eevee. Lo revisamos el 15-10-2026:
- El Full tiene 78 impresiones en español, todas de expansiones modernas. **37 cartas inglesas no tienen versión en español**, 27 expansiones no tienen la italiana y 31 no tienen la portuguesa.
- La causa es una sola: las cartas en español, italiano y portugués vienen solo de TCGdex, que tiene la **lista** de muchas expansiones en esos idiomas pero **no sus cartas** (Jungla: "64 cartas", 0 listadas).
- No todas las ausencias son errores. Hay expansiones que **nunca salieron** en algún idioma: Team Rocket "No distribuida (ES)", según WikiDex.

**WikiDex**, la wiki de Pokémon en español (licencia CC BY-SA 3.0), tiene una página por cada carta, como "Eevee (Jungla TCG)", y por cada expansión, con su fecha de salida en España o "No distribuida (ES)".

Para italiano y portugués no hay una wiki equivalente que se pueda consultar: Pokémon Central (italiana) bloquea los pedidos automáticos. Lo que sí hay es la lista de expansiones de TCGdex en cada idioma, con su nombre oficial ("Alba Suprema", "Selva").

**Español de España y de Latinoamérica:** sí son versiones distintas, pero solo desde *Aventuras Compartidas* (marzo de 2025). Antes, Latinoamérica recibía las cartas de España. TCGdex cubre las 11 expansiones en español latinoamericano, y el Full ya tiene las 3 Eevee que existen (30.º Aniversario), así que ahí no falta nada.

## What Changes

- **WikiDex como fuente de texto** (permiso "con permiso", citando CC BY-SA 3.0; sin fotos, que son de Nintendo):
  - Por cada Eevee, **confirma su versión en español**: la expansión, su nombre en español y su número, y crea la impresión en español si falta.
  - Las expansiones que WikiDex marca "No distribuida (ES)" sirven para **marcar como dudosa** cualquier impresión en español de ellas.
- **Impresiones deducidas en italiano y portugués:**
  - **Cuándo se crean:** si TCGdex lista la expansión en italiano o portugués, con su nombre oficial, y la carta existe en la versión internacional, se crea su impresión en ese idioma aunque ninguna fuente liste la carta.
  - **Qué se crea:** solo el acabado base de la carta, nunca variantes (1st Edition, reverse, sellos).
  - **Cómo se marcan:** quedan "por verificar" con el motivo "deducida".
- **Español latinoamericano:** no se deduce nada; sigue viniendo de TCGdex, que lo cubre completo. El README explica la diferencia.
- **Números normalizados:** "la misma carta" se compara con el número normalizado (`074` = `74`) en la ficha (variantes hermanas), en la regla de fotos y en las fotos locales.

**Fuera del alcance:**
- Deducir variantes en otros idiomas (1st Edition en español, reverse en italiano).
- Expansiones que salieron en italiano o portugués pero TCGdex no lista: siguen faltando y se cuentan en el resumen.
- Fotos de WikiDex.
- Otros idiomas (alemán y francés están mucho más completos en TCGdex).
- Pokémon Central y otras wikis bloqueadas.

## Capabilities

### New Capabilities

(ninguna)

### Modified Capabilities

- `universo-de-impresiones`: la fuente WikiDex, las impresiones deducidas y la comparación con números normalizados.
- `armado-de-coleccion`: los motivos nuevos en "Por verificar".

## Impact

- **Datos:** migración 005 con las fuentes `wikidex` y `tcgdex-expansiones`.
- `apps/arma/server/sources/wikidex.ts` (nuevo).
- `apps/arma/server/importer.ts` (impresiones confirmadas y deducidas, con su resumen).
- `packages/core`:
  - `auditPrintings` suma los motivos "deducida" y "no salió en este idioma";
  - una función para elegir el acabado base de una carta.
- `apps/arma/src/model.ts` y `server/localPhotos.ts` (números normalizados).
- **Reimportar el Full:** solo agrega impresiones del esquema `arma`; el inventario del usuario (`public`) no se toca.
- README.
