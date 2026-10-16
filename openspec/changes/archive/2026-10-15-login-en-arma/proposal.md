# Proposal

## Why

El usuario decidió que "Arma tu colección" (`apps/arma`, Vite + React) pase a ser la app donde se va a ir moviendo Nitsu, funcionalidad por funcionalidad. Hoy es una app aparte que depende de Nitsu para entrar: sin sesión muestra un enlace "Entrar en Nitsu" al puerto 3000. El primer paso es que tenga **su propio login**, rediseñado en su mundo visual. Eligió en el canvas la opción **AK · Mostrador** y mantener las cuentas en el **mismo Better Auth**.

## What Changes

- **Pantalla de acceso en la app nueva** (`/entrar`), diseño AK · Mostrador:
  - **Izquierda:** fieltro verde con el titular y una repisa de cartas reales bajo la luz del vidrio. Al escribir, la luz se intensifica y las cartas apagadas se encienden.
  - **Derecha:** el formulario en grafito.
  - **En celular:** se apila, con el formulario primero y la repisa abajo.
- **Todos los flujos del login actual, sin perder ninguno:**
  - **Entrar** con email y contraseña.
  - **Crear cuenta:** solo emails invitados durante la alfa, contraseña de 10 caracteres o más y repetirla.
  - **Confirmar el correo:** pantalla "Revisa tu correo", reenviar el link, y "¡Correo confirmado!" al volver.
  - **¿Olvidaste tu contraseña?** (pedir el link) y **contraseña nueva** (con el token del link).
  - **Continuar con Google**, solo si está configurado.
  - Mensajes de error en lenguaje claro: no invitado, credenciales malas, correo sin confirmar, link vencido.
- **Cerrar sesión** desde la app nueva.
- **Las cuentas siguen en Better Auth, en la API de Nitsu:**
  - la app nueva pasa `/api/auth/*` y `/api/auth-options` a esa API;
  - los links de los correos y de Google vuelven a la app nueva;
  - nadie pierde su cuenta ni su sesión, y Nitsu (puerto 3000) sigue funcionando igual.
- **ADR 0021:** "Arma tu colección" es la app que reemplaza a Nitsu, por etapas. Actualiza la ADR 0020, que la definía como app aparte.

**Fuera del alcance:**
- Mover Better Auth a la API nueva.
- Las demás pantallas de Nitsu (inventario, cargar, colecciones, perfil, aportes): llegan en cambios propios.
- Despliegue y dominio.
- Cambiar las reglas de invitación o de contraseña.
- Quitar el login de Nitsu.

## Capabilities

### New Capabilities

- `acceso-a-la-app`: entrar, crear cuenta, confirmar el correo, recuperar la contraseña, Google y cerrar sesión en la app nueva.

### Modified Capabilities

(ninguna)

## Impact

- `apps/arma`:
  - `vite.config.ts`: proxy de `/api/auth` y `/api/auth-options` al puerto de Nitsu (`NITSU_PORT`, por defecto 3000);
  - `src/Login.tsx` (nuevo) y `src/auth.ts` (nuevo), y en `App.tsx` la ruta `/entrar`, que reemplaza el "Entrar en Nitsu", y "Cerrar sesión";
  - los estilos en `styles.css` y `DESIGN.md`.
- `apps/api/src/auth.js`: el origen de la app nueva (`http://localhost:5180`, o `ARMA_WEB_ORIGIN`) entra en `trustedOrigins`, para que Better Auth acepte sus `callbackURL`.
- `docs/adr/0021-…`, el índice de ADRs y el README.
- **Datos:** no se tocan. Las cuentas y sesiones siguen en las tablas de Better Auth.
