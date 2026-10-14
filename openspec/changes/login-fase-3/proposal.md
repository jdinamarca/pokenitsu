# Proposal

## Why

La fase 3 del login quedó pendiente desde el ADR 0011: verificar el correo de las cuentas nuevas, recuperar la contraseña olvidada y entrar con Google. Sin esto, un alfa tester que olvida su contraseña queda afuera y cualquiera con un email invitado podría crear la cuenta de otro. El usuario dice tener Resend y Google configurados con su dominio `jdinamarca.dev`, y eligió que la verificación sea **obligatoria en cuentas nuevas**.

## What Changes

- **Correo (Resend, ADR 0016)**:
  - Módulo `mail.js` que envía con la API HTTP de Resend (`RESEND_API_KEY`, remitente `EMAIL_FROM`), sin dependencias nuevas.
  - Correos en español con la marca: "Confirma tu correo" y "Cambia tu contraseña".
  - **Modo desarrollo**: sin `RESEND_API_KEY`, el correo no se envía y el link se muestra en la consola del servidor.
- **Verificación obligatoria**:
  - Al crear una cuenta con contraseña llega un link de confirmación, y no se puede entrar hasta tocarlo; al tocarlo, la persona queda adentro.
  - Si intenta entrar sin haber confirmado, se le reenvía el link.
  - La pantalla muestra "Revisa tu correo" con el botón **Reenviar**.
  - Una migración marca como verificadas las cuentas que ya existen.
- **Recuperar contraseña**:
  - "¿Olvidaste tu contraseña?" pide el email y siempre responde lo mismo, exista o no la cuenta.
  - El link (válido 1 hora) abre la pantalla "Nueva contraseña", donde se escribe dos veces.
  - Al cambiarla se cierran las demás sesiones.
- **Google**:
  - Botón "Continuar con Google", visible solo si están `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET`.
  - Sigue la invitación: un email no invitado no crea cuenta y vuelve al login con el aviso.
  - Si el email ya tiene cuenta con contraseña, se vinculan.
- **API**:
  - `GET /api/auth-options` (pública) dice si Google está activo.
  - `/entrar` conserva los parámetros al redirigir a `/` (para mostrar "¡Correo confirmado!").
- **Email ya registrado**: crear cuenta con un email que ya tiene una responde igual en pantalla (para no revelar qué emails existen) y le envía al dueño "Ya tienes una cuenta". Un email no invitado se rechaza de inmediato (Better Auth, con verificación activa, lo ocultaría).
- README con las variables de `.env` y los pasos de Resend (dominio, API key) y Google Cloud (URI de redirección).

**Fuera del alcance:** cambiar el email de una cuenta, borrar la cuenta y correos de invitación a la alfa.

## Capabilities

### New Capabilities
<!-- Ninguna. -->

### Modified Capabilities
- `cuentas`: verificación de correo, recuperar contraseña y entrar con Google.

## Impact

- `apps/api/src/auth.js`, `apps/api/src/mail.js` (nuevo), `apps/api/src/index.js`, migración `029_email_verified_existing.sql`.
- `apps/web/public/index.html` (pantalla de login).
- README.
