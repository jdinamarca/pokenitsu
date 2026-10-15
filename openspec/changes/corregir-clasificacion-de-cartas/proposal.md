# Proposal

## Why

El usuario detectó, porque conoce el master set de Eevee, dos errores de clasificación en "Arma tu colección":

- **"Wizards Black Star Promos #11 · Inglés · JR Stamp Rally" no existe.** La Eevee de la JR East Pokémon Stamp Rally 2000 es una promo **japonesa**, no holo y sin número. TCGdex la cataloga como variante de la carta inglesa `basep-11`. PokeCottage la registra bien (`jpn_unp-157`), pero con región "International", así que la app la dejó en inglés: la misma carta japonesa aparece dos veces, en inglés.
- **La misma holo aparece dos veces.** La Wizards Promo #11 inglesa es una holo cosmos (Pokémon League). pokemontcg.io la llama "Holo" a secas y el resto "Holo cosmos", así que quedó como dos impresiones.

Al revisar con más cuidado aparecieron más casos del mismo tipo:
- **La misma holo duplicada** en 6 promos SWSH, BW94, BW97, SM184 y SVP 43.
- **Una variante con dos nombres:** "Jun Hasebe" según TCGdex y "World Championships 2007 (Jun Hasebe)" según PokeCottage.
- **Dudosos que nadie confirma:** sellos que solo una fuente conoce, variantes de PokeCottage sin nombre (solo un código), y el sello japonés "Pokémon TCG Gym" en una carta inglesa.

El usuario pidió volver esto una **regla**: con otro Pokémon no lo va a notar. La clasificación debe verificarse de forma rigurosa y lo dudoso debe quedar a la vista.

## What Changes

- **Correcciones automáticas al importar** (solo donde hay certeza):
  - **Holo genérica:** "Holo" a secas (pokemontcg.io, TCGplayer, o TCGdex sin tipo de brillo) es la holo cosmos cuando una fuente específica (PokeCottage, o TCGdex con tipo de brillo) dice holo cosmos y ninguna dice holo normal.
  - **Expansiones japonesas y chinas de PokeCottage:** `jpn_*` va siempre en japonés y `scn_*` en chino simplificado, aunque la entrada diga "International".
  - **Sellos exclusivos de Japón** (JR Stamp Rally): "JR East Rally 2000" es el mismo sello. Si una fuente lo pone en una carta en idioma occidental, ese dato se descarta (está mal catalogado) y se informa en el resumen de la importación.
  - **Mismo sello con dos nombres:** dentro de una misma carta y acabado, el sello de TCGdex cuyo nombre es el final del de PokeCottage ("jun-hasebe" en "world-championships-deck2007-jun-hasebe") es el mismo; queda el nombre más completo.
- **Revisión de clasificación:** cada impresión dudosa queda marcada con sus motivos:
  - **Región:** un sello exclusivo de Japón en un idioma occidental, o una expansión japonesa en un idioma occidental (y al revés).
  - **Acabado:** la misma carta, sin sello, como holo y como holo cosmos.
  - **Una sola fuente:** solo una fuente dice que existe, aunque otras conocen la carta.
  - **Sin nombre:** variantes que la fuente registra solo con un código.

  Se ve en la ficha ("Por verificar" con sus motivos), con una marca en la etiqueta de la vitrina y con un filtro "Por verificar (N)". También se consulta con `GET /api/audit/:dex`.
- **La regla queda registrada** en el contexto del proyecto (`openspec/config.yaml`): al importar o cambiar cualquier Pokémon, se corre la revisión y se investiga cada marca contra Bulbapedia y las demás fuentes.

**Fuera del alcance:**
- Corregir a mano una impresión desde la app (editar expansión, idioma o variante).
- Decidir automáticamente los dudosos: quedan marcados, no se borran.
- Averiguar qué son las variantes "code" de PokeCottage (queda como pregunta abierta para el usuario).
- Otras fuentes de verificación.

## Capabilities

### New Capabilities

(ninguna)

### Modified Capabilities

- `universo-de-impresiones`: las correcciones al fusionar fuentes y la revisión de clasificación.
- `armado-de-coleccion`: la marca "Por verificar" en la vitrina y en la ficha, y su filtro.

## Impact

- `packages/core/src/arma.ts`: reconciliación del acabado genérico, sellos exclusivos de Japón y alias por sufijo, y `auditPrintings()`, todo con pruebas.
- `apps/arma/server`:
  - `sources/pokecottage.ts` (idioma por prefijo de la expansión) y `sources/tcgdex.ts` (acabado genérico);
  - `importer.ts` (descartar los datos mal catalogados y contarlos);
  - `index.ts` (`/api/audit/:dex` y `audit` en el Full).
- `apps/arma/src`: la ficha, la etiqueta de la vitrina y el filtro.
- **Datos:** hay que **reimportar el Full**. Cambian solo filas del esquema `arma` (impresiones, datos); el inventario del usuario (`public`) no se toca. Las fotos solo locales y las marcas de fotos de impresiones que desaparecen quedan huérfanas y el importador ya borra las impresiones huérfanas.
- README.
