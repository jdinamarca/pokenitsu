# Design

## Context

- **`apps/api/src/auth.js`** arma Better Auth 1.7.7 sobre `rawPool` (sin RLS):
  - `baseURL` = `BETTER_AUTH_URL` (`http://localhost:3000` en el `.env`);
  - `trustedOrigins` = los de Nitsu, `BETTER_AUTH_TRUSTED_ORIGINS` y, desde #65, los de la app nueva;
  - email y contraseña con verificación; invitados por `AUTH_ALLOWED_EMAILS` (hook antes de `sign-up/email` y `databaseHooks.user.create`); Google con `accountLinking`;
  - sesión de 30 días con `cookieCache`; `cookiePrefix: 'pokenitsu'`;
  - los correos en `mail.js` (Resend, o la consola).
- **`apps/api/src/index.js`** monta `/api/auth/*` con `auth.handler` (Fastify → `Request`, reenviando cada `Set-Cookie`) y `/api/auth-options`, y usa `auth.api.getSession` para el resto.
- **"Arma tu colección":**
  - su API (`apps/arma/server`, TypeScript con `tsx`) lee la cookie a mano, toma el token de antes del punto y lo busca en `public.session`, **sin verificar la firma**;
  - su front pasa `/api/auth` a Nitsu (#65).

## Goals / Non-Goals

**Goals:**
- Que la app nueva entre sin Nitsu, con las mismas cuentas, sin duplicar configuración y sin que Nitsu cambie de comportamiento.

**Non-Goals:**
- Retirar Nitsu.
- Unificar las dos APIs en un proceso.

## Decisions

**1. `packages/auth`** (TypeScript, `tsup` + `tsc` como `packages/core`, ESM; dependencias `better-auth@1.7.7` y `pg`):
- `createAuth({ pool, baseURL, trustedOrigins })` devuelve la misma configuración que hoy, con `baseURL` y orígenes por parámetro.
- Exporta también `allowedEmails()`, `googleEnabled()`, `mails` y `sendMail()` (los textos de los correos dicen "Nitsu Collectibles", como hoy).
- Las variables de entorno (`AUTH_ALLOWED_EMAILS`, `RESEND_API_KEY`, `EMAIL_FROM`, `GOOGLE_*`, `BETTER_AUTH_SECRET`) se siguen leyendo del mismo `.env`.
- *Alternativa descartada:* copiar `auth.js` en la app nueva. Dos configuraciones de cuentas que pueden divergir (una invita a un email y la otra no).

**2. `apps/api`:**
- `auth.js` queda como un adaptador: `createAuth({ pool: rawPool, baseURL: BETTER_AUTH_URL || 127.0.0.1:PORT, trustedOrigins: [orígenes de Nitsu, BETTER_AUTH_TRUSTED_ORIGINS] })`, y reexporta `allowedEmails` y `googleEnabled`.
- `mail.js` reexporta del paquete, porque otros módulos lo importan.
- Se quita el origen de la app nueva que agregó #65.

**3. La API de la app nueva:**
- `server/auth.ts` crea `auth = createAuth({ pool, baseURL: ARMA_AUTH_URL || 'http://localhost:5180', trustedOrigins: [ese origen, 127.0.0.1:5180] })` después de las migraciones.
- `baseURL` es la dirección del **front**, porque el navegador llega a `/api` a través de Vite. Así los links de los correos (`…/api/auth/verify-email`) y la vuelta de Google (`…/api/auth/callback/google`) pasan por el proxy de Vite hasta esta API.
- Monta `/api/auth/*` igual que `apps/api` (Fastify → `Request`, reenviando cada `Set-Cookie`) y `GET /api/auth-options`.

**4. `session.ts`:** `viewerOf(req)` usa `auth.api.getSession({ headers })`, que verifica la firma y respeta `cookieCache`, y devuelve `{ id, name }` del usuario. `ownedCopies` no cambia.

**5. `vite.config.ts`:** vuelve a `/api` → API de la app nueva. Desaparecen `NITSU_PORT` y el proxy de `/api/auth`.

**6. Google:** la URI de vuelta autorizada cambia por la dirección.
- **Tarea del usuario:** agregar `http://localhost:5180/api/auth/callback/google` en la consola de Google Cloud.
- La pantalla muestra Google si el `.env` lo tiene, como hoy. Si la URI no está registrada, Google responde `redirect_uri_mismatch` y la vuelta a `/entrar?error=…` lo explica.

**7. ADR 0022:** las cuentas se atienden en la app nueva; la configuración vive en `@pokenitsu/auth`, compartida con Nitsu mientras conviva. Varias instancias de Better Auth sobre las mismas tablas y el mismo secreto son compatibles, porque no guarda estado en memoria.

## Risks / Trade-offs

- **[Dos instancias de Better Auth con la misma base]** → No guarda estado propio fuera de la base y la cookie. Lo que cambia entre ellas es solo `baseURL` y los orígenes.
- **[Google sin la URI nueva]** → Entrar con email funciona; el README y el resumen del PR dicen qué agregar.
- **[`pnpm build` compila un paquete más]** → Unos segundos; `pnpm arma` lo compila junto con core.
