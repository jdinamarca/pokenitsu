# Tasks

## 1. Paquete compartido

- [x] 1.1 `packages/auth` (`createAuth`, `allowedEmails`, `googleEnabled`, `mails`, `sendMail`) con compilación, typecheck, lint y una prueba de Vitest (lectura de invitados del `.env`, plantillas de correo); verificar que compila y que la prueba pasa
- [x] 1.2 `apps/api` usa el paquete (`auth.js` y `mail.js` como adaptadores; sin el origen de la app nueva); verificar en una copia de la base que el login de Nitsu sigue funcionando (entrar, `get-session` y no invitado)

## 2. Cuentas en la app nueva

- [x] 2.1 `server/auth.ts` con `/api/auth/*` y `/api/auth-options`; `session.ts` con `getSession`; `vite.config.ts` sin el proxy a Nitsu; scripts de la raíz que compilen el paquete; verificar con `curl` que una cookie con firma inventada da 401
- [x] 2.2 En Chrome sin interfaz, **con Nitsu apagado**, contra una copia de la base, sin errores de JS:
  - crear cuenta, con el link del correo en el log, que vuelve a la app nueva y entra;
  - cerrar sesión;
  - entrar;
  - recuperar la contraseña y entrar con la nueva;
  - email no invitado;
  - luego, con Nitsu de prueba encendido, que la misma sesión sirve allí.

## 3. Documentación y cierre

- [x] 3.1 ADR 0022 y su índice; README (la app ya no necesita Nitsu; la URI de Google que hay que agregar); verificar que lo explica
- [x] 3.2 `pnpm build && pnpm typecheck && pnpm lint && pnpm test` en verde; base real sin cambios; borrar la copia, las cuentas de prueba y el worktree (confirmar que la carpeta desapareció)
