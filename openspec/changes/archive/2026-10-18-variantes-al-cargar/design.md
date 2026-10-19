# Design

## Context

- `planRow` en `load.ts` decide la variante con `e.v || autoVariant(card.rarity)`. La ficha de Cargar solo muestra la automática.
- El inventario guarda la variante como texto `^[a-z0-9]{1,60}$`. `variant_labels` le da nombre: `fxewtfg7z` → FXE-WTF-G7Z, `reverseholohd5chxcnz`, `cosmosholo`…
- El Full (`arma.printings`) describe cada impresión con `card_id`, `lang`, `finish` (normal, holo, reverse, cosmos, pokeball, masterball, reversecosmos) y `stamp` (`1st-edition`, `fxewtfg7z`, `ba-charizard-26`…).
- `variantFromInventory` (core) convierte un nombre del inventario en finish + sello; `session.ts` lo usa para saber qué impresión del Full es cada copia.
- `cards.variants` está vacío en 19.084 de 20.663 cartas internacionales.

## Goals / Non-Goals

**Goals:** cargar cualquier variante conocida de una carta sin recordar sufijos.

**Non-Goals:** sufijos nuevos; elegir la variante desde la vitrina; completar `cards.variants`.

## Decisions

1. **`inventoryVariant(finish, stamp)` en core**, la inversa de `variantFromInventory`:
   - sin sello: `normal`, `holo`, `reverse`, `cosmosholo`, `pokeballholo`, `masterballholo`, `reversecosmos`;
   - `normal` + `1st-edition` → `firstedition`;
   - `normal` + sello → el sello sin guiones (`fxewtfg7z`, `bacharizard26`);
   - `holo` + sello → `holo` + sello; `reverse` + sello → `reverseholo` + sello, como el catálogo (`reverseholohd5chxcnz`);
   - todo recortado a 60 caracteres.

   `variantFromInventory` reconoce los prefijos `reverseholo` y `holo` (con algo detrás) antes de leer el resto como sello.
2. **El sello se compara sin guiones** en `session.ts` (`compact(stamp)`), así `bacharizard26` del inventario encuentra `ba-charizard-26` del Full. Es lo mismo que ya hace `isWcd`.
3. **`/api/sets/:id/cards` agrega `full: { lang, variant }[]`** a cada carta, con `variant` ya convertido por `inventoryVariant` en el servidor.
4. **`variantsOf(card, lang)` en `load.ts`** arma la lista: el Full en `lang` (o todos sus idiomas si no hay ninguna en `lang`), después `card.variants` y los `copies`, y si queda vacía, `normal`, `holo` y `reverse`. Ordena por un rango fijo de los básicos y después por nombre.
5. **La variante elegida vive en `Cargar.tsx`** como `{ num, variant }`, y vale solo para la carta marcada. `planRow` recibe `chosen` y usa `e.v || chosen || autoVariant`. Al marcar otra carta se descarta.
6. **Las fichas usan `role="radiogroup"`**, con cada ficha como `role="radio"` y `aria-checked`. Envuelven en varias líneas, de modo que en 390 no hay scroll horizontal.

## Risks / Trade-offs

- **Un sello que empiece por `holo`** se leería como holo con sello. Hoy no hay ninguno en el Full ni en `variant_labels`.
- **Sin Full ni catálogo**, Normal, Holo y Reverse pueden ofrecer una variante que la carta no tiene. Es la misma libertad que hoy dan los sufijos.
