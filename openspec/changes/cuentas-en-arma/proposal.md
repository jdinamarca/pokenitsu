# Proposal

## Why

"Arma tu colección" ya tiene su propio login (#65), pero las cuentas siguen en la API de Nitsu: el front le pasa `/api/auth/*` al puerto 3000. Si Nitsu no está corriendo, no se puede entrar (`ECONNREFUSED 127.0.0.1:3000`), como le pasó al usuario. Para avanzar en la transición ([ADR 0021](../../../docs/adr/0021-arma-tu-coleccion-reemplaza-a-nitsu.md)), el usuario pidió que la app nueva funcione **sola**. Mover las cuentas es la única dependencia real de Nitsu que tiene hoy.

## What Changes

- **Paquete compartido `@pokenitsu/auth`** con la configuración de Better Auth y los correos, que hoy viven en `apps/api/src/auth.js` y `mail.js`:
  - invitados de la alfa, contraseña de 10 caracteres y verificación de correo;
  - recuperación con un token de 1 hora y Google si está configurado;
  - sesiones de 30 días y la cookie `pokenitsu`;
  - plantillas de correo y envío con Resend, o el link en la consola si no está configurado.

  Las dos APIs lo usan, cada una con su dirección. Así no se duplica nada mientras convivan.
- **La API de "Arma tu colección" atiende las cuentas:** `/api/auth/*` y `/api/auth-options` en su propio servidor, con la dirección de la app nueva (`ARMA_AUTH_URL`, por defecto `http://localhost:5180`). Los links de los correos y la vuelta de Google llegan a la app nueva sin pasar por Nitsu.
- **La sesión se lee con Better Auth** (`auth.api.getSession`) en vez de buscar el token a mano. Así también se verifica la firma de la cookie, que hoy no se revisa.
- **Sin dependencia de Nitsu:** el proxy de `/api/auth` al 3000 desaparece, y `pnpm arma` basta para entrar.
- **Nitsu sigue funcionando igual**, con su propio login y las mismas cuentas. Ambas APIs usan las mismas tablas, el mismo secreto y la misma cookie, así que una sesión sirve en las dos.
- **Google:** su vuelta pasa a `http://localhost:5180/api/auth/callback/google`, que **el usuario tiene que agregar** en la consola de Google Cloud. Mientras tanto, entrar con email funciona igual.
- **ADR 0022:** las cuentas pasan a la app nueva, con la configuración compartida en un paquete.

**Fuera del alcance:**
- Retirar Nitsu o su login.
- Cambiar las reglas de cuentas (invitados, contraseña, duración de la sesión).
- Despliegue.
- Mover otras pantallas o tareas de fondo.

## Capabilities

### New Capabilities

(ninguna)

### Modified Capabilities

- `acceso-a-la-app`: las cuentas las atiende la propia app; ya no hace falta que Nitsu esté corriendo.

## Impact

- **Nuevo** `packages/auth` (TypeScript, compilado como `packages/core`): `createAuth({ pool, baseURL, trustedOrigins })`, `allowedEmails`, `googleEnabled`, `mails` y `sendMail`.
- **`apps/api`:**
  - `auth.js` y `mail.js` pasan a usar el paquete, sin cambiar su comportamiento;
  - se quita el origen de la app nueva de sus `trustedOrigins`, porque ya no usa sus links.
- **`apps/arma`:**
  - `server/auth.ts` (nuevo), con la ruta `/api/auth/*` y `/api/auth-options`;
  - `server/session.ts` con `getSession`;
  - `vite.config.ts` sin el proxy a Nitsu;
  - `package.json` con la dependencia.
- **Raíz:** `pnpm build` compila también el paquete; `pnpm-lock.yaml`.
- **Docs:** `docs/adr/0022-…`, el índice de ADRs y el README.
- **Datos:** no se tocan. Mismas tablas de Better Auth y mismas cuentas.
