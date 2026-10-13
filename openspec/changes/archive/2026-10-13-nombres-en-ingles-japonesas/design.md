# Design

## Context

`syncJaSets()` guarda la lista de TCGdex (`/v2/ja/sets`) con el nombre japonés en `sets.name`; `/api/sets` lo entrega al front, donde `searchSets()` busca por código, id, nombre y serie. `prices.js` (`tcgdexSetOf`) busca la expansión en TCGdex por `sets.name`, y otras consultas de la API devuelven `s.name` como `set_name`.

## Decisions

### 1. Columna nueva `name_en`; `name` sigue siendo el de la fuente
Guardar el inglés en `sets.name` rompería el cruce por nombre de los precios y mezclaría fuentes. `name_en` solo se usa para mostrar y buscar.

### 2. Nombres como un archivo de datos versionado (`apps/api/src/ja-sets.json`)
`{ en: { <código TCGdex>: <nombre en inglés> }, fixJa: { <código>: <nombre japonés correcto> } }`. Se generó una vez desde 42 checklists de PokeCottage (Pokémon populares que cubren casi todas las expansiones), cruzando el código de PokeCottage con el de TCGdex (`jpn_b04` → `PMCG4`, igual que `jaCode()`), más una tabla de equivalencias donde los códigos difieren (`xy1x` → `XY1a`, `l1hg` → `L1a`, `sm0p` → `SM0`…) y una lista curada para 20 expansiones que ninguna checklist trae. Revisado a mano contra el nombre japonés.
- *Alternativa descartada:* descargar las checklists en cada arranque → lento, depende de la red y de un sitio de terceros para algo que casi no cambia.

### 3. Aplicación
- `syncJaSets`/`syncJaSet`/`upsertJaCard` escriben `name = fixJa[code] ?? nombre de TCGdex` y `name_en = en[code]`.
- `applyJaNames()` al arrancar (después de las migraciones) actualiza en una sola consulta (`unnest`) las filas ya existentes, para no esperar a la próxima sincronización.

### 4. API y front
- `/api/sets` devuelve `name = coalesce(name_en, name)` y `name_ja` (el japonés cuando hay inglés). Las consultas que devuelven `set_name` al front usan `coalesce(s.name_en, s.name)`. El respaldo/exportación sigue con el nombre de la fuente.
- Front: `searchSets()` compara también contra `name_ja`; resultados de búsqueda y expansión activa muestran `name_ja` en gris al lado.

## Risks / Trade-offs

- [Un nombre en inglés equivocado] → archivo revisado a mano; corregir es editar una línea del JSON.
- [Expansiones nuevas de TCGdex sin nombre en inglés] → se ven en japonés como hoy hasta agregarlas al JSON.

## Migration Plan

La migración 024 agrega la columna (nula). Al arrancar, `applyJaNames()` la llena. Rollback: revertir el commit; la columna sobrante no molesta.
