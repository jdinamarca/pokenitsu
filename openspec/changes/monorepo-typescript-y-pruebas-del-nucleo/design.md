# Design

## Context

- Hoy no hay build: `npm start` corre `server/index.js` (Node 24, ESM) y Fastify sirve `public/` tal cual.
- El front es un `<script>` clásico con estado global. Las funciones a mover dependen de globales: `setById` (expansiones), `meta(sid, num)` (nombre, Pokédex, ilustrador, rareza…), `priceOf(key)`, `LOCS` y `data.inv`.
- `public/pricing.js` ya es el precedente de código compartido: el front lo carga con `<script>` y deja `globalThis.Pricing`; el servidor lo carga con `await import('../public/pricing.js')` para el CSV.
- El servidor repite en SQL la regla de espacios de colección ("Cosmos Holo"); queda fuera de este cambio (ver proposal).
- pnpm no está instalado; Node 24 trae corepack.
- Las fotos subidas por el usuario viven en `public/art/` y en la base se guardan como URL `/art/<archivo>`.

## Goals / Non-Goals

**Goals:**
- Una sola implementación, con tipos y pruebas, de las reglas listadas en la proposal.
- Demostrar que el comportamiento no cambió (pruebas de equivalencia contra el código actual).
- Cambios mínimos en `index.html` y `server/index.js`: solo reemplazar implementaciones por llamadas a `core`.

**Non-Goals:**
- Reorganizar o tipar el front o la API (eso llega con React y Kysely).
- Mejorar reglas aunque se detecten casos raros: se documentan como hallazgos.

## Decisions

### 1. Funciones puras con entradas explícitas
`packages/core` no conoce globales. Cada función recibe lo que necesita:
- `pickPrice(prices, variant, cond, cfg, fx, own)`: misma firma que `Pricing.pick`.
- `parseEntry(raw)`, `autoVariant(rarity)`, `langCode(s)`, `condCode(s)`, `parseUsd(s)`.
- `rarityOf(rarity)`, `rarityGroup(rarity)`, `mechOf(name)`, `rarityMatches(group, rarity, name)`.
- `eraOf(set)`.
- `isBulk(card, variant)`, `ruleAccepts(rule, copy)`, `ruleScore(rule)`, `pickLocation(locations, copy)`, donde `copy = { setId, era, origin, name, rarity, variant, personal, price: () => number | null }`. El precio va como función para calcularlo solo si la regla tiene `minPrice`, como hoy.
- `slotVariants(slot)`.

En el front, las funciones actuales mantienen su nombre y firma (`locMatches(l, sid, num, v, cond, personal)`, `isBulk(sid, num, v)`, `suggestLoc(...)`) como envoltorios delgados que arman la entrada desde `setById`/`meta`/`priceOf` y llaman a `Core`. Así no cambia ninguna de sus decenas de llamadas.

*Alternativa:* pasar los globales a `core` como un "contexto". Se descarta porque ata `core` a la forma actual del front, que se va a reemplazar.

### 2. Un build, dos salidas (tsup)
- **ESM + tipos** (`packages/core/dist/index.js`) para la API: `import { pickPrice } from '@pokenitsu/core'`.
- **IIFE global `Core`** (`apps/web/public/core.js`) para el front, cargado con `<script src="core.js">` antes del script principal, igual que `pricing.js` hoy. Es un archivo generado: queda en `.gitignore` y se crea en `pnpm build` (que corre antes de `pnpm start` y en CI).

*Alternativas:* convertir el front en módulo ES (`type="module"`) obliga a revisar todo el orden de ejecución del archivo heredado; usar Vite ya ahora adelanta el cambio a React. Ambas se dejan para la migración del front.

### 3. Estructura y rutas
```
apps/api/      package.json, src/ (ex server/), db/migrations/
apps/web/      package.json, public/ (ex public/, incluido art/)
packages/core/ package.json, src/, test/, tsup.config.ts, tsconfig.json
```
- `apps/api` sirve estáticos desde `../web/public` y escribe fotos en `../web/public/art`. Las URL `/art/...` no cambian.
- `.env` queda en la raíz: `node --env-file=../../.env src/index.js`.
- Scripts raíz: `pnpm build` (core), `pnpm start` (build + API), `pnpm dev`, `pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm sync`.
- Se usa `git mv` para conservar el historial.

### 4. Pruebas en dos capas
- **Pruebas de especificación** (`packages/core/test/*.test.ts`): una por escenario relevante de `openspec/specs/` (carga, precios, ubicaciones, colecciones), más los casos reales conocidos.
- **Pruebas de equivalencia** (una sola vez durante la implementación, y se conservan): se extraen las funciones actuales del `index.html` y de `pricing.js` a un archivo de referencia (`test/legacy/`), y se comparan sus resultados con los de `core` sobre:
  - todas las rarezas y nombres distintos del catálogo local (para rarezas, mecánica e `isBulk`), exportados a un fixture JSON;
  - todas las expansiones (para `eraOf`);
  - una grilla de reglas de ubicación × copias sintéticas;
  - entradas de carga y precios en USD generados.

  El fixture solo contiene datos públicos del catálogo; no incluye el inventario del usuario.

*Alternativa:* solo pruebas escritas a mano. No basta para asegurar que 25.000 cartas siguen clasificándose igual.

### 5. TypeScript, lint y CI
- TypeScript estricto (`strict`, `noUncheckedIndexedAccess`), `target ES2022`, `moduleResolution bundler`.
- ESLint (flat config + typescript-eslint) y Prettier, solo sobre `packages/core`.
- GitHub Actions (`.github/workflows/ci.yml`): Node 24, `pnpm/action-setup`, `pnpm install --frozen-lockfile`, `pnpm build`, `pnpm typecheck`, `pnpm lint`, `pnpm test`.
- pnpm se fija con el campo `packageManager` y se activa con corepack.

### 6. Trabajo en una rama con pull request
Se trabaja en la rama `monorepo-core` y se integra a `main` con un pull request que debe pasar el CI. Así `main` siempre arranca.

## Risks / Trade-offs

- [El front carga `core.js` después de usarlo o con otro nombre de global] → `core.js` se incluye antes del script principal; prueba manual con Chrome sin interfaz recorriendo todas las pestañas sin errores de consola.
- [Mover `public/art/` rompe las fotos subidas] → `git mv`, misma URL; se verifica que cargan todas las imágenes `/art/...` referenciadas en la base (respuesta 200).
- [Una diferencia sutil entre el código viejo y `core` (regex, redondeos)] → pruebas de equivalencia sobre todo el catálogo; cualquier diferencia detiene el cambio.
- [corepack necesita permisos para crear el binario de pnpm] → si falla, usar `npx pnpm@<versión>` o instalar pnpm con Homebrew; queda en el README.
- [Paso de build nuevo: si no se compila `core`, el front no carga] → `pnpm start` siempre compila antes; el error del front indica qué falta.
- [Dos fuentes de verdad mientras el SQL de colecciones siga aparte] → anotado como fuera de alcance; las pruebas de `slotVariants` documentan la regla que el SQL debe respetar.

## Migration Plan

1. Respaldo de la base (`pg_dump`) y anotar valores de referencia: cantidad de cartas, valor total, valor de la colección Eevee, ubicaciones y precios propios.
2. Rama `monorepo-core`; mover carpetas con `git mv`; agregar workspace, `core`, pruebas y CI.
3. Probar: CI en verde, todas las pestañas sin errores, valores de referencia iguales, fotos cargando.
4. Pull request a `main` y merge.

**Vuelta atrás:** la base no cambia, así que basta con volver al commit anterior (`git revert` del merge) y arrancar con `npm start` como antes.
