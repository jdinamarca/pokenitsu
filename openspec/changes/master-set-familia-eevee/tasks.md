# Tasks

## 1. Familias en core

- [x] 1.1 Agregar `packages/core/src/family.ts` con `FAMILIES` (familia Eevee en el orden del abanico), los slugs, `memberFromPath` y `pathOf`. Pruebas: el orden, que `/` y `/master-set` den 133, `/master-set/espeon` dé 196, un slug desconocido dé `null` y la ida y vuelta de `pathOf`.

## 2. Servidor

- [x] 2.1 `GET /api/master-sets`, con `requireViewer`: por cada miembro, `dex`, nombres, impresiones mínimas, códigos con copias (`ownedCopies`) y retrato. En `sources/tcgdex.ts`, comparar los nombres sin acentos y quitar el alias `'Evoli'`. Verificar con curl contra la API de prueba (3015, copia `pokemon_fotos`): sin sesión 401, la segunda cuenta sin copias, y la respuesta en menos de 300 ms con los 9 importados.
- [x] 2.2 En la copia, reimportar Eevee y confirmar que conserva sus impresiones. Importar las 8 evoluciones, correr `/api/audit/:dex` de cada una, corregir los errores claros del importador y escribir `informe-auditoria.md` en este cambio.

## 3. Interfaz

- [x] 3.1 `App.tsx` toma el Pokémon de la dirección (`/`, `/master-set/<slug>`), conserva las reglas, la vista, el orden, "Ver" y "Por verificar", y muestra "Traer el Full de <Pokémon>" si está vacío o un aviso si el slug no existe. `FamilyFan.tsx` con los 9 retratos, su avance con las reglas activas y el elegido destacado. En `main.tsx`, las rutas; en `Shell`, "Arma tu Master Set" marcado en `/` y `/master-set/*`. `Reemplazar.tsx` recorre todos los Full.
- [x] 3.2 Verificar en Chrome, contra la copia, en 1440 y 390:
  - el enlace renombrado y marcado;
  - el abanico con los 9;
  - Eevee → Umbreon cambia la dirección y la vitrina, y Atrás vuelve;
  - la vista y "Me faltan" se mantienen al cambiar;
  - el avance del retrato igual al contador de la vitrina;
  - una evolución sin Full muestra "Traer el Full de…" y la importa;
  - un slug inválido muestra el aviso;
  - Por reemplazar con impresiones de varias especies;
  - reducir movimiento;
  - sin scroll horizontal.

## 4. Cierre

- [x] 4.1 Actualizar README y `apps/arma/DESIGN.md`. Correr `pnpm test`, `pnpm typecheck` y `pnpm lint` sin errores.
- [x] 4.2 Verificar que la base real no cambió (huella de `inventory`, `inventory_log`, `locations` y `arma.printings`). Borrar la copia y el clon de imágenes.

## Workflow follow-up

- PR contra `main`; mergear solo cuando el usuario lo pida.
- Después del merge: actualizar la carpeta del usuario, compilar `packages/*`, comprobar que `main.tsx` responde 200, avisar que trae cada evolución con su botón y archivar el cambio.
