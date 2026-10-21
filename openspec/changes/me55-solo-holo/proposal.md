## Why

El Full muestra la Eevee 118 de 30th Celebration (me55) en dos versiones, normal y holo, pero solo existe la holo. Bulbapedia dice que en esa expansión «todas las cartas, incluidas las Energías básicas, son holo». PokeCottage y Pokedexia la registran solo en holo, y TCGplayer solo tiene precio *holofoil*. El «normal» viene de fuentes que no lo confirman: TCGdex lo marca como `generated` (deducido) y pokemontcg.io pone Normal por defecto. Lo mismo pasa en toda la expansión y en todos los idiomas: hay 63 impresiones «normal» de me55 que no existen.

## What Changes

- Una lista de expansiones que son holo completa (`ALL_HOLO_SETS` en `@pokenitsu/core`). Por ahora solo trae 30th Celebration (`me55`).
- Al juntar las fuentes, una impresión «normal» sin sello de esas expansiones se cuenta como su holo. Si la carta solo tiene holo cosmos (según la fuente que nombra la holo), se cuenta como cosmos. Así no se pierde lo que respalda cada idioma ni su foto.
- Al reimportar un Pokémon, sus impresiones «normal» de me55 desaparecen del Full, porque ninguna fuente las respalda ya (el importador ya borra esas impresiones).

**Fuera del alcance:** 30th Celebration: Classic Collection (`me55c`) y las expansiones japonesas o chinas de 30th Celebration, que el Full ya tiene en holo. No se tocan copias del inventario: la única copia de me55 que tiene el usuario (Eevee 118) ya está cargada como holo.

## Capabilities

### New Capabilities

### Modified Capabilities
- `universo-de-impresiones`: expansiones que son holo completa.

## Impact

- `packages/core/src/arma.ts` (`ALL_HOLO_SETS`, `mergeClaims`) y sus pruebas.
- Después del merge: compilar core y reimportar Eevee, Espeon, Umbreon y Sylveon, los Pokémon con impresiones de me55.
