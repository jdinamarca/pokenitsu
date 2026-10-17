# Tasks

## 1. Inventario compartido

- [ ] 1.1 `undo(c, { logId?, batch? })` en `packages/inventory`. Pruebas con la base de prueba del paquete o con una consulta simulada, como las que ya tiene:
  - con `logId` revierte solo esa entrada aunque haya otra más nueva;
  - con `batch` revierte todo el grupo;
  - con un `logId` que ya no existe devuelve `{ undone: null }` sin cambios;
  - sin parámetros, la de siempre.

  Verificar con `pnpm --filter @pokenitsu/inventory test`.
- [ ] 1.2 `/api/inventory/undo` de arma recibe `{ logId?, batch? }` (validados: entero positivo o UUID). `api.undo(target?)` en `apps/arma/src/api.ts`. Verificar con `curl` en una copia de la base:
  - cargar dos, deshacer la primera por `logId`: solo esa vuelve;
  - repetir: `{ undone: null }`.

## 2. Cargar

- [ ] 2.1 Lista "En esta sesión":
  - `SessionEntry` con `logId` o `batch`, de lo más nuevo a lo más viejo, con el total y las nuevas;
  - "↶ Deshacer" solo en el primero, con la explicación;
  - ⌘Z hace lo mismo, y con la lista vacía avisa sin tocar el inventario;
  - se quita el botón "Deshacer" de la ficha.

  Verificar typecheck y lint.
- [ ] 2.2 Tus copias en la ficha: "Tienes N copias" y las filas (variante · idioma · estado · ubicación ×N, personales) con "−1", que entra a la lista y se puede deshacer. Verificar typecheck y lint.
- [ ] 2.3 En Chrome sin interfaz, contra una copia de la base:
  - abrir Cargar y ⌘Z tres veces: el inventario no cambia y aparece el aviso;
  - cargar #47 y #49: la lista las muestra y solo la #49 tiene "Deshacer";
  - deshacer dos veces: vuelven en orden inverso y la lista queda vacía;
  - cargar un rango y deshacerlo completo;
  - con dos filas de la #47 (NM y LP), "−1" en LP quita esa y la lista lo muestra; "Deshacer" la devuelve a la misma fila;
  - la ficha no tiene el botón "Deshacer";
  - sin errores de JS.

  Comprobar que la base real no cambió.

## 3. Documentación y cierre

- [ ] 3.1 README (Cargar en arma: la lista de la sesión, Deshacer y tus copias con −1) y DESIGN.md de arma (la ficha). Verificar leyendo ambas secciones.
- [ ] 3.2 `pnpm build && pnpm typecheck && pnpm lint && pnpm test` en verde. Borrar la copia de la base y confirmar que se borró.

## Workflow follow-up

- PR contra `main`; merge solo a pedido; después, archivar este cambio.
