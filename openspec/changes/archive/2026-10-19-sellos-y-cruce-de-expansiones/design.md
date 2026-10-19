# Design

## Context

- `variantFromPokecottage` da `finish: 'normal'` a todo sello que no conoce, como `setStamp`, `gamestop` o `trickOrTrade24`. Solo algunas entradas de PokeCottage traen `foil` ("Normal").
- `mergeClaims` ya concilia acabados por carta (holo de TCGplayer = cosmos de TCGdex) y nombres de sello (`jun-hasebe` es el final de `world-championships-deck2007-jun-hasebe`).
- `bulbapediaLanguages` ya descarga el wikitexto de la página de cada expansión del Full (de a 50 por request) y lee la frase de los idiomas. Las cartas adicionales están en esa misma página, como `{{Setlist/nmentry|086/197|{{TCG ID|Obsidian Flames|Espeon|86}}|Psychic|||<nota>}}`.
- `loadCatalog` cruza las expansiones de TCGdex por `sets.tcgdex_en` y después por nombre exacto (`nameKey`) cuando no hay ambigüedad.

## Goals / Non-Goals

**Goals:** una impresión por carta física sellada, con su acabado verdadero, y las impresiones de TCGdex enlazadas al catálogo cuando la expansión existe.

**Non-Goals:** expansiones que el catálogo no tiene (`catalogo-desde-tcgdex`); otras notas de Bulbapedia.

## Decisions

1. **El sello de PokeCottage marca que no trae acabado.** `pokecottageClaims` pone `finishUnknown: true` en un claim con sello y sin `foil`. En `mergeClaims`, por carta:
   - se juntan los acabados que TCGdex da a ese sello (comparando con `compactStamp`);
   - si es uno solo, el claim de PokeCottage toma ese acabado y el nombre de sello de TCGdex cuando son el mismo sin guiones (`gamestop` / `game-stop`).
2. **`parseAdditionalCards(wikitext, setName)` en core.** Lee cada `Setlist/nmentry` con un `{{TCG ID|…|número}}` y una nota.
   - El acabado sale del comienzo de la nota: `Reverse Holo` → reverse, `Cosmos Holo` → cosmos, `Holo` → holo, `Non-Holo` → normal. Si no dice ninguno, null.
   - El sello sale del primer texto entre comillas, pasado por `stampKey`. Si es el nombre de la expansión, es `set-logo`.
   - Devuelve `{ number, stamp, finish }`.
3. **El importador lo aplica antes de fusionar.** Por cada carta adicional con acabado:
   - todo claim de esa expansión, número y sello (comparando con `compactStamp`) toma el acabado;
   - se agrega un claim de la fuente `bulbapedia-adicionales` con ese acabado y sello, y su `exists`;
   - solo vale para inglés: las notas de Bulbapedia son de la versión en inglés.
4. **El sello con año.** Junto a la regla de `endsWith`, `mergeClaims` une un sello de TCGdex con uno de PokeCottage del mismo acabado cuando `compactStamp(pc) === compactStamp(td) + dígitos`. Queda el de PokeCottage.
5. **El cruce por identificador.** En `loadCatalog`, después del cruce por nombre, cada expansión de TCGdex que quedó sin cruzar y cuyo `id` es el de una expansión del catálogo que nadie tomó, cruza con esa. Hoy son `base1`, `hgss2`, `hgss3`, `hgss4`, `sve` y `svp`.
6. **Migración `010_bulbapedia_adicionales.sql`:** agrega la fuente a `arma.sources`, con permiso `review` y sin fotos.

## Risks / Trade-offs

- **Notas de Bulbapedia con otra redacción** ("Holofoil", "Reverse Holofoil") no cambian nada. Las pruebas cubren las formas de Obsidian Flames y Prismatic Evolutions.
- **Un mismo identificador puede no ser la misma expansión.** Solo se usa cuando el nombre no cruzó y nadie más tomó ese identificador. Se revisó la lista actual: las 6 coinciden.
- **Undaunted y las promos SVP cambian mucho:** salen 136 impresiones `td:` y sus datos se juntan con las de las otras fuentes. Se verifica en la copia que no se pierdan impresiones verdaderas.
