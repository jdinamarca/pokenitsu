# Proposal

## Why

Las reglas que más importan (cuánto vale una copia, qué significa `25r lp*2`, a qué caja va una carta, qué copia cuenta para un espacio de una colección) viven dentro de un `index.html` de ~2.700 líneas, sin tipos ni pruebas, y en parte repetidas en el servidor. El próximo cambio grande (cuentas y multiusuario, ADR 0010/0011) toca casi todo el código: antes hay que poder cambiarlo sin romper esas reglas sin darse cuenta. Este cambio es el primer paso del stack acordado (ADR 0008 y 0014).

## What Changes

- El repositorio pasa a ser un **monorepo pnpm**:
  - `apps/api`: el servidor actual (`server/`) y las migraciones (`db/`), sin cambios de lógica.
  - `apps/web`: el front actual (`public/`) sin cambios visibles, incluidas las fotos subidas por el usuario (`public/art/`).
  - `packages/core`: lógica de negocio pura en **TypeScript**, sin red, sin base de datos y sin DOM.
- Se mueven a `packages/core`, con el mismo comportamiento que hoy:
  - **Precios:** la elección de precio (`Pricing.pick`: fuente preferida, exacto vs. aproximado, una sola impresión, % por estado, precio propio) y la lectura de precios en USD (`349,99`, `1.234,56`).
  - **Carga:** el parser de entradas (`25`, `25r`, `25*4`, `-25`, `25r lp`, `25 lp*2`), la variante automática y los códigos de idioma y estado.
  - **Rarezas:** rareza → grupo (base, rara, ultra, IR, SIR, secreta…) y la mecánica desde el nombre (ex, GX, V, VMAX…).
  - **Ubicaciones:** si una regla acepta una copia, si una copia es "challa", el puntaje de especificidad y la elección de la ubicación ganadora.
  - **Colecciones:** qué variantes del inventario cuentan para un espacio de checklist (la regla "Cosmos Holo").
  - **Series:** la serie en inglés de una expansión (incluida la deducción para japonesas y chinas por código).
- El front y el servidor usan `packages/core` compilado (el front como un script global, igual que hoy usa `pricing.js`; el servidor como módulo ESM). Se elimina `public/pricing.js`.
- **Pruebas con Vitest** de todo `packages/core`, escritas a partir de los escenarios de `openspec/specs/` y de casos reales (Wizards #11, `349,99`, caja de Mega Evolution bajo la caja de la serie).
- **CI en GitHub Actions** en cada push y pull request: instalación, chequeo de tipos, lint (ESLint + Prettier sobre el código nuevo) y pruebas.
- `npm start` se reemplaza por `pnpm start` (compila `core` y arranca la API); el README se actualiza.

**Fuera del alcance:**
- Convertir `apps/api` o el front a TypeScript, React, Kysely o TypeBox (cambios posteriores).
- Cambiar cualquier comportamiento visible, aunque las pruebas encuentren algo mejorable: se anota para un cambio aparte.
- La consulta SQL del servidor que repite la regla de espacios de colección (se unificará al migrar la API).
- Pruebas de integración con Postgres y Playwright (siguiente cambio).
- Lint sobre el código heredado (`apps/api`, `apps/web`).

**Datos del usuario:** no se tocan la base de datos ni las migraciones. Las fotos subidas (`public/art/`) se mueven con `git mv` a `apps/web/public/art/` y se siguen sirviendo en la misma URL `/art/...`, así que los links guardados en la base siguen funcionando. Antes de empezar se hace un respaldo (`pg_dump`) y se verifica al final que el inventario, los precios propios y las ubicaciones muestran lo mismo que antes.

## Capabilities

### New Capabilities

Ninguna: no cambia el comportamiento del sistema. El cambio declara `skip_specs: true`.

### Modified Capabilities

Ninguna.

## Impact

- **Estructura del repo:** `server/` → `apps/api/src/`, `db/` → `apps/api/db/`, `public/` → `apps/web/public/`, nuevo `packages/core/`, `pnpm-workspace.yaml`, `.github/workflows/ci.yml`.
- **Código:** `apps/web/public/index.html` reemplaza sus funciones de precio, parser, rarezas, ubicaciones, slots y series por llamadas a `Core`; `apps/api/src/index.js` importa `@pokenitsu/core` en vez de `../public/pricing.js` y ajusta rutas (`ART_DIR`, estáticos, migraciones).
- **Dependencias nuevas (desarrollo):** pnpm (vía corepack), TypeScript, Vitest, tsup, ESLint, Prettier.
- **Forma de arrancar:** `pnpm install` y `pnpm start` en lugar de `npm install` / `npm start`.
- **ADR:** implementa parte de 0008 (monorepo + TypeScript) y 0014 (pruebas + CI); no requiere ADR nuevo.
