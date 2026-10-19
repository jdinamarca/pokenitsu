# Proposal

## Why

El usuario dijo "no veo el radiant eevee en el arma tu set". La carta sí está, pero en un lugar donde no se espera:

- En inglés, el Radiant Eevee salió solo como promo **SWSH230**. En Pokémon GO la 055/078 en inglés es Snorlax. En japonés es la S10b 055, de 2022-06-17.
- TCGdex no trae la fecha de cada promo. Por eso la impresión en inglés tiene la fecha en que empezó toda la serie de promos SWSH (2019-11-15). La repisa toma la fecha más antigua de sus impresiones, así que queda en **2019**, entre SWSH042 y SWSH212, y no en 2022 junto a "Pokémon GO #54".
- Lo mismo pasa con otras 26 promos de la familia que tienen una fecha real en otra impresión. Por ejemplo, Vaporeon, Jolteon y Flareon SWSH150/151/149 son de 2022 pero aparecen en 2019. Varias SV promo aparecen como 2023-01-01.

## What Changes

- **En "Por diseño", la fecha de una repisa ya no usa la fecha genérica de una serie de promos** (decisión del usuario: "Fecha real"). Una impresión tiene la fecha genérica cuando su expansión es de promos ("Promo" en el nombre) y su fecha es la misma que la del catálogo para esa expansión.
- La repisa toma la fecha más antigua entre las demás impresiones. Si todas tienen la fecha genérica o ninguna tiene fecha, sigue como hoy.
- Así, SWSH230 pasa a 2022 y queda junto a Pokémon GO. Las promos que no tienen otra fecha siguen igual.
- El cálculo se hace en la vitrina, con los datos que ya trae el Full, así que no hace falta "Volver a traer". "Por expansión" no cambia: la repisa de las promos SWSH sigue en 2019, que es cuando empezó esa serie.

## Capabilities

### New Capabilities

### Modified Capabilities
- `armado-de-coleccion`: la fecha de una repisa en el orden por diseño.

## Impact

- `apps/arma/src/model.ts` (`shelvesOf`) y su prueba en `model.test.ts`.
- No cambia la base ni la API.
