# Tasks

## 1. API

- [x] 1.1 `better-auth` 1.7.7, `auth.js` (email + contraseña, invitación por `AUTH_ALLOWED_EMAILS`, cookies, orígenes, sin telemetría) y migración `026_auth.sql` generada por la librería; verificar que la migración se aplica en un arranque desde cero sin "schema mismatch"
- [x] 1.2 Ruta `/api/auth/*` y sesión obligatoria en `/api/*` salvo `/api/auth/*` y `/api/alpha`; verificar con un servidor de prueba (17 pruebas): 401 sin sesión, landing pública, invitado sí / no invitado no, contraseña corta, cookie `HttpOnly`, cerrar sesión, contraseña equivocada, origen ajeno rechazado

## 2. Front

- [x] 2.1 Pantalla Entrar / Crear cuenta, arranque solo con sesión, 401 → pantalla de inicio, "Cerrar sesión" en Datos, y arranque sin login con un servidor sin cuentas; verificar en Chrome sin interfaz los 7 casos y que el servidor actual sigue abriendo la app

## 3. Cierre

- [x] 3.1 README (`.env`, primera vez, fases) y `.env` local (`BETTER_AUTH_SECRET`, `AUTH_ALLOWED_EMAILS` vacío a completar); borrar los usuarios de prueba; `pnpm build && pnpm typecheck && pnpm lint && pnpm test`; inventario 32/33

## Workflow follow-up

- Commit en `login` y PR contra `main`; mergear a pedido y luego archivar.
- Fase 2 (`user_id` + RLS) y fase 3 (correo y Google) como cambios aparte.
