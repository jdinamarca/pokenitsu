# Tasks

## 1. Base

- [x] 1.1 Proxy de `/api/auth` y `/api/auth-options` en `vite.config.ts`, y el origen de la app nueva en `trustedOrigins` de `auth.js`; verificar con `curl` a través del 5180 que `/api/auth-options` y `/api/auth/get-session` responden desde Nitsu
- [x] 1.2 ADR 0021 y el índice de ADRs; verificar que la ADR 0020 no se editó

## 2. Login

- [x] 2.1 `src/auth.ts` y `src/Login.tsx` con los modos entrar, crear, pedir link, contraseña nueva y revisa tu correo, más Google y los mensajes de error; ruta `/entrar` y redirección sin sesión con `volver`
- [x] 2.2 Estilos AK · Mostrador (repisa, luz al enfocar, celular apilado, reducir movimiento) y `DESIGN.md`
- [x] 2.3 "Cerrar sesión" en el riel

## 3. Verificación

- [x] 3.1 En Chrome sin interfaz, contra una copia de la base (Nitsu en 3010 y la app nueva en 3012/5190), sin errores de JS:
  - sin sesión → `/entrar`;
  - entrar con una cuenta de prueba → vuelve a la Vitrina con sesión, y la misma sesión sirve en Nitsu;
  - credenciales malas → mensaje;
  - email no invitado → mensaje;
  - pedir el link de recuperación → "Revisa tu correo" (el link queda en el log de correos de desarrollo) y, con ese token, poner la contraseña nueva y entrar con ella;
  - cerrar sesión → `/entrar`;
  - capturas a 1440 y 390 px.
- [x] 3.2 README: cómo se entra a la app nueva y que Nitsu tiene que estar corriendo; verificar que lo explica
- [x] 3.3 `pnpm build && pnpm typecheck && pnpm lint && pnpm test` en verde; base real sin cambios; borrar la copia y las cuentas de prueba
