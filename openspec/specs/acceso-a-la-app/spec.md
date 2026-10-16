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

### Requirement: La app atiende sus propias cuentas
La app SHALL atender las cuentas en su propia API (`/api/auth/*` y `/api/auth-options`), sin necesitar que Nitsu esté corriendo, con las mismas cuentas, tablas, secreto y cookie que Nitsu, de modo que una sesión sirva en las dos apps mientras convivan. Los links de los correos y la vuelta de Google SHALL apuntar a la dirección de la app. La configuración de las cuentas (invitados, contraseña, verificación, recuperación, Google, duración de la sesión, correos) SHALL ser la misma en las dos apps.

#### Scenario: Entrar sin Nitsu
- **WHEN** Nitsu no está corriendo y el usuario entra con su email y contraseña en la app nueva
- **THEN** entra, y la Vitrina carga con su sesión

#### Scenario: La misma sesión en Nitsu
- **WHEN** el usuario entra en la app nueva y después abre Nitsu
- **THEN** Nitsu lo reconoce con la misma sesión

### Requirement: Sesión verificada
La API SHALL obtener la sesión con Better Auth, verificando la firma de la cookie, y MUST NOT aceptar una cookie cuyo token exista pero cuya firma no calce.

#### Scenario: Cookie falsificada
- **WHEN** alguien envía `pokenitsu.session_token` con un token real y una firma inventada
- **THEN** la API responde 401
