## Context

El paso de PokeCottage (`pokecottageStep` en `catalogPhotos.ts`) agrupa por Pokémon las cartas japonesas sin foto, pide (o lee guardado) el álbum de cada Pokémon y cruza sus entradas con `matchPokecottage`, que hoy solo acepta `jpn_` y cruza la expansión por su nombre en inglés. Las expansiones chinas (`source='asia'`) tienen id `zh-cn-<CODE>`, armado desde `pc:scn_<code>` con `codeOfKey`/`crossCode`/`asiaSetId` de `asiaSets.ts`.

## Goals / Non-Goals

**Goals:** fotos solo locales para las cartas ZH-CN sin foto, reutilizando el paso y las reglas de PokeCottage.

**Non-Goals:** chino tradicional (sin fuente hoy); Limitless o Bill's Archive para chinas; cambiar las reglas de ritmo.

## Decisions

- **Cruce por código, no por nombre.** Para `scn_` la expansión sale de `asiaSetId(crossCode(code, 'ZH-CN'))` sobre los ids de expansiones chinas existentes, igual que al armar las expansiones; un nombre en inglés de PokeCottage no calza con los nombres chinos del catálogo.
- **Número.** `plainNumber` del número antes de "/". Se aplica también a `jpn_` (inofensivo: los japoneses no traen "/").
- **Pokédex obligatorio** como en las japonesas, para no darle a una carta la foto de otro Pokémon en el mismo número.
- **Consulta del paso:** `s.lang IN ('JA','ZH-CN')` solo en el paso de PokeCottage; Limitless y Bill's Archive siguen con `s.lang = 'JA'`.

## Risks / Trade-offs

- Si una expansión china comparte código con otra en ZH-TW, el cruce filtra por ZH-CN porque PokeCottage `scn_` es simplificado.
- 379 fotos nuevas de PokeCottage: con la pausa actual entre peticiones toma unos minutos; corre a pedido.
