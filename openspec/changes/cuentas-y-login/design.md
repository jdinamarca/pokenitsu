# Design

## Context

API Fastify en JS con `pg` (sin Kysely todavía); el front es un `index.html` que el mismo servidor entrega, así que página y API comparten origen (sin CORS). ADR 0011 eligió Better Auth (email + contraseña con verificación, Google, invitación) y ADR 0010 los datos por usuario con RLS. Este cambio implementa una parte de esas decisiones, sin cambiarlas, así que no hay ADR nuevo.

## Decisions

### 1. Fases
1) Cuentas y login (este cambio). 2) `user_id` + RLS y migrar el inventario actual a la cuenta del dueño. 3) Verificación de correo, recuperar contraseña y Google (Resend + OAuth). Hasta la fase 2 todas las cuentas ven los mismos datos, por eso la lista de invitados es solo del dueño.

### 2. Better Auth montado en Fastify
`/api/auth/*` convierte la petición a un `Request` web y llama `auth.handler` (patrón de la guía oficial de Fastify). Las cookies vienen en varios `Set-Cookie`: se reenvían todas con `getSetCookie()` (copiar con `reply.header` una por una dejaría solo la última).

### 3. Tablas generadas por la propia librería
`getMigrations()` de Better Auth compila el SQL de `user`, `session`, `account` y `verification`; se guardó tal cual como `026_auth.sql`, así siguen el flujo normal de migraciones numeradas.

### 4. Instancia creada después de migrar
Better Auth revisa sus tablas al iniciar; si se crea al importar el módulo (antes de `migrate()`), en el primer arranque queda con "schema mismatch" hasta reiniciar. `createAuth()` se llama después de las migraciones y antes de escuchar.

### 5. Protección de la API
Hook `onRequest` para `/api/*` (excepto `/api/auth/*` y `/api/alpha`): `auth.api.getSession()`; sin sesión, 401 `{ login: true }`. El `cookieCache` de 5 minutos evita leer la tabla `session` en cada llamada.

### 6. Invitación
`databaseHooks.user.create.before` rechaza con 403 si el email no está en `AUTH_ALLOWED_EMAILS`. `alpha_signups` queda para la fase 2, cuando invitar no exponga datos ajenos.

### 7. Orígenes confiables
Better Auth rechaza inicios de sesión desde orígenes desconocidos. Se confía en `BETTER_AUTH_URL`, `http://localhost:<port>`, `http://127.0.0.1:<port>` y lo que diga `BETTER_AUTH_TRUSTED_ORIGINS` (para abrir la app desde el celular en la red local).

### 8. Front
Antes de `boot()`, `GET /api/auth/get-session`: sin sesión muestra la pantalla de inicio; con sesión arranca. Si el servidor no tiene `/api/auth` (404, versión anterior) arranca sin login, para no dejar a nadie fuera durante la actualización. `api()` muestra la pantalla de inicio ante un 401 con `login: true`. Entrar/crear cuenta recargan la página.

## Risks / Trade-offs

- [Sin verificación de correo ni recuperar contraseña] → solo emails invitados; si se olvida la contraseña, borrar la cuenta en la base y crearla de nuevo (no afecta el inventario en la fase 1).
- [Imágenes subidas en `public/art/` siguen públicas] → sin datos sensibles; se revisa en la fase 2.
- [Las pruebas de front con Chrome sin interfaz] → necesitarán iniciar sesión contra servidores con cuentas.

## Migration Plan

Al arrancar se crean las tablas de cuentas. En `.env`: `BETTER_AUTH_SECRET` (ya agregado) y `AUTH_ALLOWED_EMAILS` con el email del dueño. Primera vez: Crear cuenta. Rollback: revertir el commit; las tablas de cuentas no molestan.
