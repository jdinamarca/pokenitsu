## Why

El usuario tiene la Eevee 62/100 de Burger King 2009 (reimpresión Reverse de Majestic Dawn con el sello «Platinum») **en español**, y no la encuentra en el Full. En el #111 todas las fuentes decían que esa promoción solo salió en inglés: Bulbapedia, PokeCottage, TCGdex y el catálogo de Elite Fourum. WikiDex además dice que Majestic Dawn nunca salió en español. La foto de su carta lo contradice. El texto está en español («Llamar a la Familia», «Embestida», «Un extraño Pokémon que se adapta…»), es 62/100, reverse holo, tiene el sello «Platinum» y dice ©2009 Pokémon/Nintendo y DPBP#157. Es la promoción de Burger King en Latinoamérica, que ninguna fuente registra.

## What Changes

- **Impresiones confirmadas con la carta del usuario:** una lista en `@pokenitsu/core` (`CONFIRMED_PRINTINGS`) de impresiones que ninguna fuente registra, cada una comprobada contra una foto: idioma del texto, número, acabado y sello. Al importar, el Pokémon suma esas impresiones con su propia fuente.
- **Fuente nueva «Confirmada con tu carta»** (`confirmada`, permiso propio ✍️). Va separada de `own` (las fotos subidas por el usuario), porque al importar se reemplazan los datos de cada fuente que respondió, y si fuera `own` se borrarían esas fotos.
- **Primera impresión:** Eevee · Majestic Dawn 62 · Reverse · Burger King 2009 (sello Platinum) · Español.

**Fuera del alcance:**
- Glaceon 20/100 y Leafeon 24/100 de Burger King en español: probablemente existen, pero no hay prueba. Se agregan cuando haya foto.
- No se tocan las copias del usuario. Hoy tiene Majestic Dawn #62 cargada como Normal · Inglés; si es esta carta, la cambia él.

## Capabilities

### New Capabilities

### Modified Capabilities
- `universo-de-impresiones`: impresiones confirmadas con la carta del usuario.

## Impact

- `packages/core/src/arma.ts` (`CONFIRMED_PRINTINGS`, `ownCardClaims`) y sus pruebas.
- `apps/arma/server/importer.ts`: suma esas impresiones al importar.
- Migración `016_impresiones_confirmadas.sql`: la fuente `confirmada`.
- Después del merge: compilar core, reiniciar la API (migración) y reimportar Eevee.
