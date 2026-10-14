# Tasks

## 1. Preparación

- [x] 1.1 Respaldo `pg_dump` de la base real en `db-backups/` (fuera de git) y conteos de las 13 tablas; verificar que el respaldo se restaura en una base de prueba `pokemon_fase2`

## 2. Base

- [x] 2.1 Migración 027 (user_id, claves por cuenta, `user_settings`, RLS forzado, vista con `security_invoker`, contadores de IDs); verificar en la copia: dueño 32/33, otra cuenta 0, sin usuario 0, modo sistema todo, `fx` compartido y conteos del dueño idénticos a los de antes
- [x] 2.2 ADR 0018 (RLS forzado con el usuario en la conexión) en el índice de ADRs

## 3. API

- [x] 3.1 `db.js` (conexión por petición en fila, `tx` con conexión propia, `asSystem`, `migrate` con `all_users`), hook de sesión, `ON CONFLICT` con `user_id`, configuración por usuario y consultas de sistema; verificar sobre la copia (14 pruebas): cuenta nueva vacía, carta en dos cuentas, nombre de ubicación repetido entre cuentas, dato ajeno por ID, respaldo solo propio, 40 pedidos alternados sin cruce, 401 sin sesión, y sin el aviso de `pg` por consultas simultáneas
- [x] 3.2 La app completa con la sesión del dueño sobre la copia (12 pruebas: inventario, 9 pestañas, colecciones, sin errores); borrar la cuenta de prueba borra sus datos y ninguno del dueño

## 4. Cierre

- [x] 4.1 README; `pnpm build && pnpm typecheck && pnpm lint && pnpm test`; borrar la base de prueba

## Workflow follow-up

- Commit en `datos-por-usuario` y PR contra `main`; al mergear y reiniciar, la migración corre en la base real: comparar conteos con `db-backups/conteos-antes.txt`.
- Archivar después del merge. Fase 3: correo y Google.
