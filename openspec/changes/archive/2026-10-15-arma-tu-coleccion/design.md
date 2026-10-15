# Design

## Context

- Monorepo pnpm. Hoy hay dos apps: `apps/api`, en Fastify con JavaScript ESM y su `db.js` con RLS forzada (`app.user_id`), y `apps/web`, un `index.html` sin build. Las reglas puras viven en `packages/core` (TypeScript y Vitest). El ADR 0012 fija Vite + React + TypeScript como destino del front.
- Datos que la app actual ya tiene y que se leen sin cambios:
  - `cards`: id, `set_id`, número, nombre, ilustrador, dex, `image_small` y `image_large` (copias propias en `/img/cards/...`), `variants`.
  - `sets`: `source` ptcg o tcgdex-ja, `lang`, `name_en`, `release_date` y `tcgdex_en`, el cruce con la expansión de TCGdex.
  - `card_prices.usd`: claves de variante de TCGplayer.
  - `inventory`: `card_id`, `variant`, `lang`, `cond`, `loc`, `qty` y `personal`, con RLS por `user_id`.
  - Las sesiones de Better Auth están en la tabla `session` (`token` y `userId`). La cookie es `pokenitsu.session_token` y vale `token.firma`. Como las cookies no distinguen puerto, la app nueva en `localhost:<otro puerto>` la recibe.
- Investigación del 2026-10-15 para Eevee:
  - TCGdex trae `variants_detailed` con tipo, foil, sellos y tamaño.
  - PokeCottage trae `133-eevee.json`: 435 entradas de 301 cartas (180 internacionales, 162 de Japón, 93 de China), con `set`, `cardNumber`, `region`, `variant`, `variantType` (default, master, additional o code), `artist` y `releaseDate`. El lector anterior está en `git show f8639f9^:apps/api/src/pokecottage.js`.
  - Bulbapedia, página "Eevee (TCG)": plantillas `card list/card` (73 diseños) y `card list/release` (142 impresiones, con `enset`/`ennum` y `jpset`).
- Las maquetas y la dirección visual ya están elegidas (AE · Vitrina): ver `apps/arma/PRODUCT.md` y `apps/arma/.impeccable/surfaces/index-html.md`.

## Goals / Non-Goals

**Goals:**
- Un modelo general de impresión, procedencia, equivalencia y regla, probado con Eevee, que después sirva para cualquier Pokémon.
- Reimportar es idempotente y nunca pierde lo que ya estaba.
- La app nueva no puede romper ni modificar la actual: solo lee lo ajeno y escribe únicamente en su esquema.

**Non-Goals:**
- Una interfaz para editar el Full, equivalencias manuales o un informe de producción (v2).
- Despliegue, multiusuario real y RLS en el esquema `arma` (por ahora es local).

## Decisions

**1. Estructura: `apps/arma` con dos partes en un paquete.**
- `src/`: el front, en Vite + React + TypeScript.
- `server/`: la API, en Fastify y TypeScript ejecutado con `tsx`.
- `pnpm arma` levanta las dos: Vite en el **puerto 5180** con proxy de `/api` a la API en el **3002**.
- *Alternativa descartada:* dos paquetes, `apps/arma-web` y `apps/arma-api`. Son más piezas para algo que va siempre junto.

**2. Esquema `arma` en la misma base, con migraciones propias** (`apps/arma/server/migrations`, aplicadas al arrancar en la tabla `arma.schema_migrations`). Tablas:
- `sources`: id, nombre, url y `permission` (`ok`, `text_only`, `review`, `none`, `own`), más una nota. Se siembran: tcgdex, pokemontcg, tcgplayer, pokecottage (`text_only`), bulbapedia (`review`) y own.
- `printings`: `code` es la clave estable, más dex, `set_key`, número, idioma, `finish`, `stamp`, `deck`, `deck_no`, `design_id`, `card_id` (nulo si no está en el catálogo actual) y `equiv_id`.
- `facts`: la procedencia por dato. Columnas `printing_code`, `field` (exists, name, number, artist, image, price, equivalence), `value`, `source_id`, `ref` (el id en la fuente) y `fetched_at`. Una fila por fuente y dato.
- `designs`: id, nombre e ilustrador; agrupa una ilustración y sus fuentes.
- `views`: `user_id`, nombre y `rules jsonb`.
- `source_cache`: url, cuerpo `jsonb` y fecha, para no volver a pedir.
- La app nueva **solo escribe en `arma.*`**. Lee `public.cards`, `sets`, `card_prices`, `inventory` y `session` con un usuario de base que tiene esos permisos.
- *Alternativa descartada:* guardar todo en `public`. Mezclaría la app nueva con la actual, que el usuario pidió mantener separadas.

**3. Identidad de una impresión y cruce entre fuentes.** Cada importador produce "afirmaciones" normalizadas (`set_key`, número, idioma, variante, nombre, ilustrador, foto, fuente y referencia), y un paso de fusión las une por la clave `(set_key, número normalizado, idioma, finish, stamp)`.
- El `set_key` canónico es el id de expansión del catálogo actual: `swsh7`, `sv3pt5`, `ja-SV2a`…
- TCGdex se cruza con el catálogo por `sets.tcgdex_en` (internacionales) y por el código (`ja-*`).
- PokeCottage usa el algoritmo de su lector anterior: la misma expansión, o la misma fecha de salida más el número.
- Bulbapedia se cruza por nombre de expansión con `sets.name` / `name_en`, más el número.
- Lo que no calza con el catálogo recibe un `set_key` propio de la fuente (`pc:<expansión>`, `bp:<expansión>`) y queda en el Full sin `card_id`. Se informa cuántos quedaron así.

**4. Variantes.** Los acabados y sellos salen de una regla pura en core que mapea:
- TCGdex `variants_detailed` (`type`, `foil`, `stamp`, `size`);
- las claves de TCGplayer (`normal`, `holofoil`, `reverseHolofoil`, `1stEdition*`, `unlimited*`);
- los `variant`/`variantType` de PokeCottage.

Se reutiliza lo aprendido en el #52: el holo de TCGplayer es el cosmos de TCGdex en las promos, y el "normal" de TCGdex es el holo en las promos GX.

**5. Equivalencias.** Una regla pura en core agrupa por `(design_id, finish, stamp)` y considera de la misma equivalencia:
- las impresiones del mismo `set_key` y número internacional en distintos idiomas;
- las que unen las releases de Bulbapedia (`enset` y `jpset` del mismo `card list/card`);
- las que agrupa PokeCottage.

Cada equivalencia guarda sus fuentes en `facts` (`field = equivalence`).

**6. Reglas.** `applyRules(printings, rules)` en core devuelve para cada impresión si está dentro o fuera, y por qué regla. Es pura y probada. La regla "solo inglés" se resuelve por equivalencia y compara solo idiomas occidentales (EN y si no hay, el resto en orden alfabético); "asiáticas = japonesa" hace lo mismo entre JA, ZH, KO, TH e ID, prefiriendo JA. El front la evalúa en el navegador sobre el Full ya cargado (~700 filas), así que el contador cambia al instante sin pedir nada al servidor.

**7. Sesión e inventario.** La API lee la cookie `pokenitsu.session_token`, toma el token (lo que va antes del punto) y busca en `session` una sesión vigente. Con su `userId` abre una transacción con `set_config('app.user_id', …)` para leer `inventory` respetando la RLS. Sin sesión responde 401, y el front muestra "Entra en Nitsu" con un enlace a `localhost:3000/entrar`.
- *Alternativa descartada:* pedirle la sesión a `apps/api`. La haría depender de que esa API esté corriendo y no agrega seguridad en local.
- Un copia del inventario cuenta para una impresión si coincide `card_id`, idioma y variante. El mapeo de la variante del inventario va en core.

**8. Front.**
- React sin librería de componentes, con CSS propio y tokens del contrato de dirección: fieltro `#0f3a31`, grafito `#151513`, luz `#fff3dc`, cartulina `#e8dcc2` y los cuatro stickers.
- Tipografía Archivo y Archivo Narrow, servidas desde el paquete con `@fontsource`, no desde Google.
- Fotos: las copias propias (`/img/cards/...`, servidas por la API desde `IMAGE_DIR`) o las de TCGdex. Nunca de PokeCottage ni de Bulbapedia.
- Movimiento según Emil: penumbra de 450 ms con `ease-out` y nada con "reducir movimiento".

**9. Fuentes externas.** Un solo cliente HTTP con el User-Agent de Nitsu, 2 pedidos a la vez por fuente, caché en `arma.source_cache` (24 h) y reintentos. Bulbapedia se pide por la API de MediaWiki (`action=parse`, `prop=wikitext`).

## Risks / Trade-offs

- **[Cruces de expansión equivocados]** Mezclarían impresiones distintas o separarían iguales. → Lo que no calza con seguridad queda separado (`pc:`/`bp:`), y un resumen de importación lista cuántas impresiones quedaron sin cruzar por fuente, para revisarlas en v2.
- **[PokeCottage cambia el formato de su JSON]** → El importador valida los campos esperados. Si cambian, falla esa fuente sin tocar lo ya importado.
- **[Licencia de Bulbapedia]** → Queda marcada ⚠️ en cada dato que aporta. En local es aceptable; el informe de producción (v2) la mostrará como pendiente.
- **[El esquema `arma` comparte base con la app actual]** → La app nueva solo escribe en `arma.*`, y una prueba de integración verifica que el inventario y `public` no cambian.
- **[700 impresiones con foto en una sola pantalla]** → Las fotos se cargan diferidas (`loading="lazy"`), en tamaño chico, en la vitrina; la grande solo va en la ficha.

## Migration Plan

Todo nuevo: el esquema `arma` se crea con las migraciones de la app nueva. Para deshacerlo, basta `DROP SCHEMA arma CASCADE`, sin efecto sobre la app actual. Antes de probar se respalda la base, siguiendo la receta del proyecto.

## Open Questions

- El puerto exacto, si 5180 o 3002 chocan con algo en la máquina del usuario. Se ajusta en la implementación sin cambiar el diseño.
