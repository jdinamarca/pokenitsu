# Tasks

## 1. Datos y API

- [x] 1.1 Migración `024_set_name_en.sql` y `apps/api/src/ja-sets.json` (169 nombres en inglés + 2 correcciones); verificar con `psql` que la columna existe y que el JSON tiene `PMCG4: Rocket Gang` y `S12a: VSTAR Universe`
- [x] 1.2 Aplicar nombres en la sincronización y con `applyJaNames()` al arrancar; reiniciar el servidor y verificar con `psql` que 169 expansiones `tcgdex-ja` tienen `name_en` y que `SV4a` se llama シャイニートレジャーex
- [x] 1.3 `/api/sets` con `name` en inglés y `name_ja`, y `set_name` en inglés en las otras consultas; verificar con `curl` la fila de `ja-PMCG4`

## 2. Front

- [x] 2.1 Búsqueda por nombre japonés y muestra del japonés en resultados y expansión activa; verificar en Chrome sin interfaz que `rocket gang`, `ロケット団`, `PMCG4` y `vstar universe` encuentran la expansión correcta, y que `rocket` sigue mostrando Team Rocket

## 3. Cierre

- [x] 3.1 Actualizar README; correr `pnpm build && pnpm typecheck && pnpm lint && pnpm test`, las verificaciones de Cargar y comprobar inventario 32/33

## Workflow follow-up

- Commit en `nombres-japonesas` y PR contra `main`; mergear solo cuando el usuario lo pida y luego archivar.
