# Design

## Context

- `mergeClaims()` (`packages/core/src/arma.ts`) agrupa los datos por carta y ya concilia algunos acabados, pero solo los de TCGplayer contra TCGdex. pokemontcg.io queda fuera, por eso aparece "Holo" junto a "Holo cosmos".
- `pokecottageClaims()` decide el idioma por `region` (International → EN), y PokeCottage marca "International" algunas promos japonesas (`jpn_unp-157`).
- `tcgdexClaims()` usa `variants_detailed`. TCGdex pone la variante con `stamp: ["jr-stamp-rally"]` en `en/basep-11`. Su "holo" sin `foil` no dice si es cosmos.
- Revisamos el Full de Eevee el 15-10-2026. Hay 92 impresiones que solo una fuente conoce (63 de PokeCottage, 17 de TCGdex, 12 de pokemontcg.io), 14 cartas con holo y holo cosmos a la vez, 3 casos de región y 12 variantes "code" de PokeCottage.

## Goals / Non-Goals

**Goals:**
- Corregir solo lo que tiene una explicación segura.
- Que todo lo dudoso quede a la vista con un motivo claro, para cualquier Pokémon.

**Non-Goals:**
- Editar impresiones a mano.
- Borrar dudosos.

## Decisions

**1. Acabado genérico** (`Claim.genericFinish?: boolean`):
- pokemontcg.io y TCGplayer siempre son genéricos. TCGdex lo es cuando su variante no trae `foil`.
- En `mergeClaims`, por carta: una holo genérica sin sello pasa a holo cosmos si alguna fuente no genérica dice holo cosmos y ninguna no genérica dice holo normal.
- Se mantiene la regla actual de "normal" de TCGplayer y TCGdex.
- *Alternativa descartada:* preferir siempre la holo cosmos. Rompería cartas donde existen las dos de verdad (30th Celebration #116 tiene holo y holo cosmos según PokeCottage, que es específico).

**2. Idioma por prefijo en PokeCottage:** `jpn_` → `JA` (busca la expansión por nombre japonés o queda `pc:jpn_*`); `scn_` → `ZH-CN`; si no, por `region`.

**3. Sellos exclusivos de Japón** (`JAPAN_ONLY_STAMPS = ['jr-stamp-rally']`, con el alias `jr-east-rally2000`/`jreast-rally2000`):
- `misfiled(claim)` es verdadero si el idioma es occidental y el sello está en esa lista.
- El importador separa esos datos antes de `mergeClaims` y cuenta `misfiled` por fuente en el resumen.

**4. Alias por sufijo:** en `mergeClaims`, por carta y acabado, si un sello de TCGdex es el final (separado por `-`) de un sello de PokeCottage, se usa el de PokeCottage. Solo aplica entre esas dos fuentes, para no unir sellos distintos de la misma fuente.

**5. `auditPrintings(printings, sourceNames)` en core** devuelve `{ code, reasons: { kind, text }[] }` para cada impresión dudosa:
- **región:**
  - sello en `JAPAN_ONLY_STAMPS ∪ ['pokemon-card-gym']` con idioma occidental;
  - `set_key` que empieza por `ja-`, `pc:jpn_` o `td-ja` con idioma occidental;
  - idioma `JA` con una expansión que no es japonesa.
- **acabado:** la carta (sin sello) tiene `holo` y `cosmos` y ninguna de las dos la dicen las mismas fuentes.
- **una sola fuente:** `exists` con una sola fuente, y otras fuentes conocen la carta. El texto nombra la fuente y las demás.
- **sin nombre:** la etiqueta de la variante calza con `^[A-Z0-9]{3}-[A-Z0-9]{3}-[A-Z0-9]{3}$`.

El servidor la calcula sobre lo que hay en la base: `/api/audit/:dex` devuelve la lista y `/api/full` la incluye como `audit: { code: reasons }`.

**6. Front:**
- **Etiqueta de la vitrina:** un icono lucide `CircleHelp` de 12 px antes del sticker, con `aria-label` "Por verificar". No es un sticker de color, así que la Regla del Sticker se mantiene.
- **Filtro:** un botón "Por verificar (N)" junto al selector de orden, que filtra las repisas. El conteo de "bajo luz" no cambia: es un filtro de vista.
- **Ficha:** una caja "Por verificar" con un `<ul>` de motivos, antes de "De dónde sale cada dato".

## Risks / Trade-offs

- **[La regla de holo genérica une dos impresiones reales]** → Solo actúa si ninguna fuente específica dice holo normal. Si una carta tiene las dos de verdad, PokeCottage o TCGdex con brillo lo dicen y la regla no actúa.
- **[Muchas marcas de "una sola fuente"]** → Con Eevee son ~90, la mayoría variantes especiales que solo PokeCottage conoce. Es el costo de la rigurosidad pedida; el filtro permite recorrerlas.
- **[Reimportar cambia códigos de impresión]** → Las impresiones que desaparecen se borran como huérfanas. Sus marcas de foto y fotos subidas quedan sin uso. El inventario del usuario se lee en solo lectura y no se toca.
