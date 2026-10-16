# Spec Delta

## ADDED Requirements

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
