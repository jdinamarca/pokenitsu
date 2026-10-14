## ADDED Requirements

### Requirement: Verificar el correo de las cuentas nuevas
Al crear una cuenta con email y contraseña, el sistema SHALL enviar un correo con un link de confirmación válido por 24 horas y MUST NOT permitir entrar hasta confirmarlo. Al abrir el link, la cuenta SHALL quedar verificada y con la sesión iniciada. Las cuentas que existían antes de este cambio SHALL quedar verificadas.

#### Scenario: Crear cuenta
- **WHEN** un email invitado crea su cuenta
- **THEN** ve "Revisa tu correo" con su email y un botón para reenviar, y no entra todavía

#### Scenario: Confirmar el correo
- **WHEN** abre el link del correo
- **THEN** entra a la app y ve "¡Correo confirmado!"

#### Scenario: Entrar sin confirmar
- **WHEN** intenta entrar con su contraseña antes de confirmar
- **THEN** ve que falta confirmar el correo y se le reenvía el link

### Requirement: Recuperar la contraseña
La pantalla de inicio SHALL ofrecer "¿Olvidaste tu contraseña?", que pide el email y responde siempre "Si hay una cuenta con ese email, te enviamos un link", exista o no. El link SHALL valer 1 hora y abrir "Nueva contraseña", que pide la nueva dos veces (al menos 10 caracteres). Al cambiarla, las demás sesiones SHALL cerrarse.

#### Scenario: Cambiar la contraseña olvidada
- **WHEN** el usuario pide el link, lo abre y escribe una contraseña nueva válida dos veces
- **THEN** vuelve a "Entrar" con "Listo: entra con tu nueva contraseña" y la anterior deja de funcionar

#### Scenario: Link vencido o usado
- **WHEN** abre un link de recuperación vencido o ya usado
- **THEN** ve "El link venció o ya se usó. Pide uno nuevo."

### Requirement: Entrar con Google
Si la API tiene credenciales de Google, la pantalla de inicio SHALL mostrar "Continuar con Google". Entrar con Google SHALL respetar la lista de invitados y, si el email ya tiene cuenta, vincularse a ella. Sin credenciales, el botón MUST NOT aparecer.

#### Scenario: Email invitado
- **WHEN** un invitado entra con Google por primera vez
- **THEN** se crea su cuenta, ya verificada, y queda adentro

#### Scenario: Email no invitado
- **WHEN** alguien no invitado intenta entrar con Google
- **THEN** vuelve a la pantalla de inicio con "Este email no está invitado…"

### Requirement: Envío de correos
Los correos SHALL enviarse con Resend cuando hay `RESEND_API_KEY`, desde `EMAIL_FROM`. Sin `RESEND_API_KEY`, el sistema SHALL escribir el link en la consola del servidor en vez de enviarlo.

#### Scenario: Modo desarrollo
- **WHEN** no hay `RESEND_API_KEY` y alguien pide recuperar su contraseña
- **THEN** la consola del servidor muestra el link y la pantalla responde igual que con correo

## MODIFIED Requirements

### Requirement: Crear cuenta por invitación
El sistema SHALL permitir crear una cuenta con nombre, email y una contraseña de al menos 10 caracteres solo si el email está en la lista de invitados (`AUTH_ALLOWED_EMAILS`). Para cualquier otro email MUST rechazar la creación con un mensaje que lo explique. Si el email ya tiene cuenta, la pantalla SHALL responder igual que al crear una (sin revelarlo) y SHALL enviar al dueño un correo "Ya tienes una cuenta".

#### Scenario: Email invitado
- **WHEN** un email de la lista crea su cuenta con una contraseña válida
- **THEN** la cuenta se crea sin verificar y se le pide confirmar el correo antes de entrar

#### Scenario: Email no invitado
- **WHEN** un email que no está en la lista intenta crear cuenta
- **THEN** se rechaza con "Este email no está invitado…" y no se crea nada

#### Scenario: Contraseña corta
- **WHEN** la contraseña tiene menos de 10 caracteres
- **THEN** se rechaza y se pide una de al menos 10

#### Scenario: Email que ya tiene cuenta
- **WHEN** alguien intenta crear cuenta con un email que ya tiene una
- **THEN** ve "Revisa tu correo" como siempre y al dueño de esa cuenta le llega "Ya tienes una cuenta"
