# acceso-a-la-app Specification

## Purpose
TBD - created by archiving change login-en-arma. Update Purpose after archive.

## Requirements

### Requirement: Pantalla de acceso
La app SHALL tener una pantalla de acceso en `/entrar`, con el diseño Mostrador: la repisa de cartas bajo la luz a la izquierda y el formulario a la derecha (apilados en pantallas angostas). Sin sesión, cualquier ruta de la app SHALL llevar a `/entrar`, y después de entrar SHALL volver a la ruta pedida. La pantalla SHALL tener las pestañas "Entrar" y "Crear cuenta", y el botón "Continuar con Google" solo si la API dice que Google está configurado.

#### Scenario: Sin sesión
- **WHEN** alguien sin sesión abre la Vitrina
- **THEN** ve la pantalla de acceso y, al entrar, vuelve a la Vitrina

### Requirement: Entrar y crear cuenta con las cuentas de siempre
La app SHALL entrar y crear cuentas con el mismo Better Auth de Nitsu, a través de `/api/auth/*`, de modo que la misma cuenta y la misma sesión sirvan en las dos apps. Crear cuenta SHALL pedir nombre, email, una contraseña de 10 caracteres o más y repetirla, y SHALL mostrar el mensaje de "no invitado" cuando la API lo rechaza.

#### Scenario: Entrar
- **WHEN** el usuario entra con su email y contraseña
- **THEN** queda con sesión en la app nueva, y también en Nitsu

#### Scenario: Email no invitado
- **WHEN** alguien crea una cuenta con un email no invitado
- **THEN** ve "Este email no está invitado. Durante la alfa solo pueden crear cuenta los emails invitados."

### Requirement: Correo, contraseña y Google
La app SHALL cubrir:
- **Confirmar el correo:** "Revisa tu correo" con un botón para reenviar el link, y "¡Correo confirmado!" al volver del link.
- **Recuperar la contraseña:** pedir el link y poner la contraseña nueva con el token del link.
- **Google:** entrar con Google.

Los links de los correos y la vuelta de Google SHALL llegar a la app nueva.

#### Scenario: Contraseña nueva
- **WHEN** el usuario abre el link del correo de recuperación
- **THEN** llega a `/entrar` de la app nueva, pone su contraseña nueva y luego puede entrar con ella

### Requirement: Cerrar sesión
La app SHALL permitir cerrar sesión, y SHALL quedar en la pantalla de acceso.

#### Scenario: Salir
- **WHEN** el usuario pulsa "Cerrar sesión"
- **THEN** su sesión termina y ve la pantalla de acceso
