# Proposal

## Why

De las 4.551 cartas japonesas del catálogo, a muchas les falta el número de Pokédex o el ilustrador. Sin Pokédex no tienen imagen de referencia en Cargar ni en Mi inventario, y sin ilustrador no aparecen en Ilustradores. Hoy solo el trabajo de detalles de Nitsu (`apps/api/src/details.js`) los completa, al arrancar Nitsu, y el usuario ya trabaja en Arma. Al 2026-10-17 la base real tiene:

- **Inferno X (`ja-M2`, 116 cartas) sin nada**: ni Pokédex, ni ilustrador, ni tipo. Nadie les pidió los detalles; TCGdex ya los tiene.
- **223 Pokémon sin Pokédex**, casi todos ex de Terastal Fest, SV3 y SV5a: TCGdex no trae `dexId` en esas cartas, y Nitsu no vuelve a preguntar porque ya tienen ilustrador. El nombre japonés basta: con la lista de nombres de PokéAPI, 203 calzan con un solo Pokémon, sin error en la muestra revisada (Eevee ex → 133, Ogerpon いどのめんex → 1017). Las otras 20 son Entrenadores de M2 todavía sin tipo y una errata de TCGdex.
- **≈490 cartas de sets antiguos sin ilustrador** (419 Pokémon de 213 especies y 74 Entrenadores: Golden Sky Silver Sea, serie E, Holon, neo, promos): TCGdex no lo tiene. Su carta inglesa equivalente, del catálogo de pokemontcg.io, sí lo trae.

## What Changes

- **Al cargar una carta japonesa** en Arma sin ilustrador o sin Pokédex, el servidor completa esa carta en segundo plano, sin demorar la carga: TCGdex si nunca se le preguntó, y el Pokédex por el nombre si sigue vacío.
- **En Por reemplazar (solo el administrador)** hay una sección "Detalles de las japonesas". Dice cuántas cartas faltan en cada caso y tiene el botón **Completar detalles**. El trabajo pasa por tres pasos y muestra el avance de cada uno:
  1. **TCGdex**, para las japonesas a las que nunca se les preguntó (`details_at` vacío): ilustrador, rareza, tipo, Pokédex y variantes, igual que Nitsu.
  2. **Pokédex por nombre**, para los Pokémon que siguen sin número: se quitan los adornos del nombre (ex, GX, V, Mega, "de …", la forma) y se busca en la lista oficial de nombres japoneses de PokéAPI, que se baja **una vez** como un solo archivo. Si el nombre calza con más de un Pokémon, o con ninguno, no se pone nada.
  3. **Ilustrador desde la carta inglesa equivalente**, para los Pokémon que siguen sin ilustrador. Por cada especie se lee su lista de cartas en Bulbapedia, la misma fuente que ya usa Arma para las equivalencias de Eevee, que dice qué japonesa es la misma carta que qué inglesa. Se copia el ilustrador de esa inglesa del catálogo. Las requests van **de a una, con pausa**, y quedan guardadas en cache.
- Pedirlo otra vez mientras corre muestra el avance en curso; no empieza otro trabajo.
- **Solo se rellenan campos vacíos.** Nunca se reemplaza un ilustrador, un Pokédex o un tipo que ya está. Cada carta revisada en TCGdex queda marcada (`cards.details_at`), así que ni Arma ni Nitsu la vuelven a preguntar.
- **Core gana `dexFromJaName`**: deduce el Pokédex de un nombre japonés, maneja TAG TEAM con `&` y devuelve vacío si hay duda. Tiene pruebas.

**Fuera del alcance:**
- el ilustrador de los Entrenadores y las Energías antiguos (Bulbapedia no los lista por especie);
- las cartas internacionales (las completa Nitsu como hoy);
- cambiar el trabajo de detalles de Nitsu, que sigue igual;
- las fotos, que siguen en "Bajar fotos locales del catálogo japonés".

## Capabilities

### New Capabilities
- `detalles-del-catalogo-en-arma`: completar el Pokédex, el ilustrador, la rareza y el tipo de las cartas japonesas desde Arma. Incluye completar al cargar, el botón con su avance en Por reemplazar, el Pokédex por nombre, el ilustrador desde la inglesa equivalente y la cortesía con las fuentes.

### Modified Capabilities
(ninguna)

## Impact

- **Datos:** sin migración. Se escriben solo campos vacíos del catálogo compartido (`cards.artist`, `rarity`, `dex`, `supertype`, `variants`, `details_at`) y respuestas en `arma.source_cache`. No toca `inventory`, `locations` ni nada de la cuenta. Las pruebas corren contra la copia `pokemon_fotos`, y al final se compara la huella de las tablas del usuario en la base real. El trabajo completo en la base real lo lanza el usuario con el botón.
- **Fuentes:**
  - TCGdex: API abierta, ≈163 requests, de a 3.
  - PokéAPI: un archivo CSV de GitHub, datos abiertos, una vez.
  - Bulbapedia: ≈213 páginas, de a una y con pausa. Es CC BY-NC-SA y solo local; de ella se toma solo qué carta es igual a cuál, y el ilustrador sale del catálogo propio.
- **Código:**
  - `packages/core`: `dexFromJaName` y el lector de la lista de nombres, con pruebas.
  - `apps/arma/server/details.ts`: completar una carta y el trabajo de tres pasos.
  - Rutas `GET/POST /api/catalog-details` (solo el administrador) y el aviso desde `/api/inventory/add`.
  - `apps/arma/src/Reemplazar.tsx`: la sección y su avance.
- **Documentación:** README, `apps/arma/DESIGN.md` y el ADR 0025 (Arma completa los detalles del catálogo japonés).
- Al mergear cambia `packages/core`, así que hay que recompilar los paquetes en la carpeta del usuario.
