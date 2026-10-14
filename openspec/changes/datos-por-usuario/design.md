# Design

## Context

Ver [ADR 0018](../../../docs/adr/0018-rls-forzado-con-usuario-por-conexion.md): la API se conecta con el dueño de las tablas (sin permiso para crear roles), tiene ~180 consultas con `pg`, y algunas tareas de sistema deben ver los datos de todos.

## Decisions

### 1. Migración 027
- Dueño = primera cuenta (`"user"` por `createdAt`); si hay datos y no hay cuenta, `RAISE EXCEPTION` con instrucciones.
- `user_settings (user_id, key)` recibe `prices` y `lots`; `settings` queda solo con `fx` (compartido).
- 13 tablas: `user_id text NOT NULL REFERENCES "user" ON DELETE CASCADE DEFAULT current_setting('app.user_id', true)` + índice.
- Claves por cuenta: `inventory` (user_id + carta + variante + idioma + estado + ubicación), `price_overrides` y `variant_images` (user_id, card_id, variant), `favorite_artists` (user_id, name), `locations` UNIQUE (user_id, name). Las tablas hijas con IDs globales (`lot_items`, `collection_cards`, `art_group_cards`…) mantienen su clave.
- RLS `ENABLE` + `FORCE`, política `por_usuario` con `app.user_id` o `app.all_users = 'on'`; `inventory_full` con `security_invoker`.
- Contadores de IDs al máximo en uso (arregla `locations_id_seq`).

### 2. `db.js`
- `rawPool`: Better Auth y trabajo sin usuario.
- `runAsUser(userId, done)` desde el hook `onRequest` (estilo callback para que el resto de la petición corra dentro del AsyncLocalStorage); `pool.query` usa la conexión de la petición, en fila; `endUser` en `onResponse`/`onRequestAbort` borra `app.user_id` y la devuelve.
- `tx()` en una petición: conexión propia con el mismo usuario (igual que antes de este cambio, cuando cada `tx` tenía su conexión).
- `asSystem(fn)`: conexión con `app.all_users = 'on'`; `migrate()` lo fija localmente en cada migración.

### 3. Código
- `ON CONFLICT` de `inventory`, `price_overrides` y `variant_images` incluyen `user_id`; `putSetting` usa `user_settings` para `prices`/`lots`.
- Sistema: `refreshPrices` y `unpricedIntl` (precios compartidos de las cartas de todos), `startDetailsJob` y `startVariantsForMySets` (prioridad por cartas de todos), y la limpieza de cartas de checklist sin uso en `importChecklist` (`set_config('app.all_users', 'on', true)` dentro de su transacción). `staleCount` (lo que ve el usuario) queda por usuario.

## Risks / Trade-offs

- [Una conexión por petición] → pool de 10; las peticiones son cortas. Revisar si hay muchos usuarios a la vez.
- [Olvidar `asSystem` en una tarea nueva] → la tarea ve tablas vacías (falla segura); documentado en README.
- [Fallo a mitad de la migración] → corre en una transacción: o se aplica completa o nada.

## Migration Plan

1. Respaldo `pg_dump` (hecho: `db-backups/`, fuera de git) y conteos.
2. Al reiniciar el servidor con este código, la migración 027 corre sola.
3. Verificar que los conteos coinciden.
Rollback: restaurar el respaldo (`pg_restore --clean`) y volver al commit anterior.
