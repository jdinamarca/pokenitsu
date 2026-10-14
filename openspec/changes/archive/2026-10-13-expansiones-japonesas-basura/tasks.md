# Tasks

## 1. Ocultar

- [x] 1.1 Revisar las 184 expansiones japonesas en TCGdex: 68 sin cartas; de esas, 20 basura (15 `CS*` y 5 duplicados `+` de `SM1p`…`SM5p`, que sí tienen cartas) y 48 reales; confirmar que las 20 no tienen cartas, inventario ni colecciones
- [x] 1.2 Lista `hidden` en `ja-sets.json`, `syncJaSets` las salta y `applyJaNames` borra las existentes sin cartas; verificar en una copia: 184 → 164 al arrancar, 164 con nombre en inglés, una nueva sincronización no las recrea y cada expansión antes duplicada queda con una sola entrada

## 2. Cierre

- [x] 2.1 README; `pnpm build && pnpm typecheck && pnpm lint && pnpm test`; borrar la copia

## Workflow follow-up

- Commit en `expansiones-basura` y PR contra `main`; al mergear y reiniciar, la limpieza corre sola. Archivar después.
