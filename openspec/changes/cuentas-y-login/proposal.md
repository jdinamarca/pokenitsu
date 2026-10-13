# Proposal

## Why

La app no tiene login: cualquiera que llegue al servidor ve y modifica el inventario. Para la alfa con testers se necesitan cuentas (ADR 0010 y 0011). Este cambio es la **fase 1**: cuentas e inicio de sesión. Los datos por usuario son la fase 2, y el correo y Google la fase 3.

## What Changes

- Cuentas con Better Auth dentro de la API, guardadas en nuestro Postgres: crear cuenta con email + contraseña (mínimo 10 caracteres), entrar y cerrar sesión. Sesiones de 30 días en cookie `HttpOnly` y `SameSite=Lax`.
- Solo los emails de `AUTH_ALLOWED_EMAILS` (en `.env`) pueden crear cuenta.
- Toda la API exige sesión, salvo `/api/auth/*` y el formulario de la landing (`/api/alpha`). Sin sesión responde 401.
- Pantalla de inicio de sesión (Entrar / Crear cuenta) antes de abrir la app, y "Cerrar sesión" en **Datos ▾**. Si la sesión vence, vuelve a la pantalla de inicio.
- Un servidor sin cuentas (versión anterior) sigue abriendo la app sin pedir login.

**Fuera del alcance (fases siguientes):**
- Datos por usuario (`user_id` + RLS) e invitar testers: fase 2. Mientras tanto, `AUTH_ALLOWED_EMAILS` debe tener solo el email del dueño.
- Verificación de correo, recuperar contraseña e inicio con Google: fase 3 (requiere Resend y credenciales de Google).
- Usar `alpha_signups` como lista de invitados.
- Datos del usuario: no se tocan. La migración solo crea las tablas de cuentas; el inventario no cambia.

## Capabilities

### New Capabilities
- `cuentas`: crear cuenta, iniciar y cerrar sesión, y protección de la API con la sesión.

### Modified Capabilities
<!-- Ninguna. -->

## Impact

- Dependencia nueva `better-auth` (1.7.7) en `apps/api`, sin telemetría.
- Migración `026_auth.sql` (tablas `user`, `session`, `account`, `verification`, generadas por Better Auth).
- `apps/api/src/auth.js` (configuración), `index.js` (ruta `/api/auth/*` y verificación de sesión en cada llamada a la API).
- `apps/web/public/index.html`: pantalla de inicio de sesión, arranque solo con sesión, cerrar sesión.
- `.env`: `BETTER_AUTH_SECRET`, `AUTH_ALLOWED_EMAILS` (y opcional `BETTER_AUTH_URL`, `BETTER_AUTH_TRUSTED_ORIGINS`). README.
