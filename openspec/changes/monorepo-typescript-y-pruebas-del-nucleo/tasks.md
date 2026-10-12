# Tasks

## 1. Preparación y respaldo

- [x] 1.1 Crear la rama `monorepo-core` desde `main` y verificar con `git status` que está limpia
- [x] 1.2 Respaldar la base con `pg_dump` en el scratchpad y verificar que el archivo existe y no está vacío
- [x] 1.3 Anotar valores de referencia desde la app en marcha (total de cartas y filas, valor total, valor de venta, valor de la colección Eevee, cantidad por ubicación, precios propios) y guardarlos en un archivo para comparar al final

## 2. Monorepo pnpm

- [x] 2.1 Activar pnpm con corepack (o `npx pnpm` como respaldo), agregar `packageManager`, `pnpm-workspace.yaml` y los scripts raíz (`build`, `start`, `dev`, `sync`, `test`, `typecheck`, `lint`), y verificar que `pnpm -v` responde
- [x] 2.2 Mover `server/` → `apps/api/src/` y `db/` → `apps/api/db/` con `git mv`, crear `apps/api/package.json` (Fastify, pg, scripts con `--env-file=../../.env`) y ajustar las rutas de migraciones, estáticos (`../web/public`) y fotos (`ART_DIR`); verificar que `pnpm install` termina sin errores
- [x] 2.3 Mover `public/` → `apps/web/public/` con `git mv` (incluido `art/`) y crear `apps/web/package.json`; verificar con `pnpm start` que la app abre en localhost:3000, que `/alfa` responde 200 y que cada URL `/art/...` guardada en la base responde 200
- [x] 2.4 Actualizar `.gitignore` (`dist/`, `apps/web/public/core.js`) y la sección "Uso" del README (`pnpm install`, `pnpm start`, corepack), y verificar siguiendo el README desde cero que la app arranca

## 3. Paquete core y pruebas de equivalencia

- [x] 3.1 Crear `packages/core` (TypeScript estricto, tsup con salida ESM + tipos y salida IIFE global `Core` hacia `apps/web/public/core.js`, Vitest) y verificar que `pnpm build` genera ambos archivos y `pnpm test` corre (sin pruebas aún)
- [x] 3.2 Copiar las implementaciones actuales (del `index.html` y `pricing.js`) a `packages/core/test/legacy/` como referencia, y exportar del catálogo local un fixture JSON con las rarezas, nombres de carta y expansiones distintas (sin datos del inventario); verificar que el fixture tiene todas las rarezas presentes en `cards`
- [x] 3.3 Implementar en core rarezas y mecánica (`rarityOf`, `rarityGroup`, `mechOf`, `rarityMatches`) y series (`eraOf`), con pruebas de especificación y de equivalencia contra la referencia sobre todo el fixture; verificar `pnpm test` en verde con 0 diferencias
- [x] 3.4 Implementar la carga (`parseEntry`, `autoVariant`, `langCode`, `condCode`) con pruebas de los escenarios de `carga-de-cartas` (`25r lp*2`, `SV107` con letra, `-25`, `25 lp*2`) y equivalencia sobre entradas generadas; verificar en verde
- [x] 3.5 Implementar precios (`pickPrice`, `parseUsd`) con pruebas de los escenarios de `precios` (promo de una sola impresión, LP = 85%, exacto gana a aproximado, `349,99` → 349.99, precio propio) y equivalencia contra `pricing.js` sobre combinaciones generadas; verificar en verde
- [x] 3.6 Implementar ubicaciones (`isBulk`, `ruleAccepts`, `ruleScore`, `pickLocation`) con pruebas de los escenarios de `ubicaciones` (caja de Mega Evolution bajo la caja de la serie, carpeta de especiales por rareza o precio, `auto: false`, personal) y equivalencia sobre una grilla de reglas × copias; verificar en verde
- [x] 3.7 Implementar `slotVariants` con pruebas del escenario "Cosmos Holo" de `colecciones` y equivalencia; verificar en verde
- [x] 3.8 Configurar ESLint + Prettier para `packages/core` y `pnpm typecheck`; verificar que `pnpm lint` y `pnpm typecheck` pasan

## 4. Front y API usan core

- [ ] 4.1 En `apps/web/public/index.html`, cargar `core.js` y reemplazar los cuerpos de las funciones movidas por envoltorios que llaman a `Core` (mismos nombres y firmas); eliminar `pricing.js`; verificar con el chequeo de sintaxis de los `<script>` y con Chrome sin interfaz que todas las pestañas abren sin errores de consola
- [ ] 4.2 En `apps/api/src`, importar `pickPrice` desde `@pokenitsu/core` para el CSV en vez de `pricing.js`; verificar que `/api/export.csv` entrega los mismos precios que antes para el inventario actual
- [ ] 4.3 Verificar la carga real en Cargar: entrar y deshacer `25r lp*2` en una expansión de prueba con ubicación Automático y confirmar que la ubicación elegida y el aviso de precio son los mismos que antes; dejar el inventario como estaba

## 5. CI

- [ ] 5.1 Crear `.github/workflows/ci.yml` (Node 24, pnpm, `install --frozen-lockfile`, build, typecheck, lint, test) y verificar con `pnpm install --frozen-lockfile && pnpm build && pnpm typecheck && pnpm lint && pnpm test` en local
- [ ] 5.2 Subir la rama, abrir el pull request a `main` y verificar que el CI de GitHub Actions queda en verde

## 6. Verificación final

- [ ] 6.1 Comparar los valores de referencia de 1.3 con la app sobre la rama: deben ser idénticos; verificar también que la base no tiene migraciones nuevas (`schema_migrations` sin filas nuevas)
- [ ] 6.2 Actualizar README (estructura del repo, cómo correr pruebas, qué vive en `packages/core`) y el contexto de `openspec/config.yaml` (stack y rutas nuevas); verificar que `openspec validate --specs` sigue pasando

## Workflow follow-up

- Mergear el pull request cuando el usuario lo apruebe.
- Archivar el cambio con `/opsx:archive`.
