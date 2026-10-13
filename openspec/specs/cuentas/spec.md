# cuentas Specification

## Purpose
Cuentas de usuario de la app: crear cuenta solo con invitación, iniciar y cerrar sesión, y que los datos solo se puedan leer o modificar con una sesión válida.

## Requirements

### Requirement: Crear cuenta por invitación
El sistema SHALL permitir crear una cuenta con nombre, email y una contraseña de al menos 10 caracteres solo si el email está en la lista de invitados (`AUTH_ALLOWED_EMAILS`). Para cualquier otro email MUST rechazar la creación con un mensaje que lo explique.

#### Scenario: Email invitado
- **WHEN** un email de la lista crea su cuenta con una contraseña válida
- **THEN** la cuenta se crea y queda con la sesión iniciada

#### Scenario: Email no invitado
- **WHEN** un email que no está en la lista intenta crear cuenta
- **THEN** se rechaza con "Este email no está invitado…" y no se crea nada

#### Scenario: Contraseña corta
- **WHEN** la contraseña tiene menos de 10 caracteres
- **THEN** se rechaza y se pide una de al menos 10

### Requirement: Iniciar y cerrar sesión
El sistema SHALL iniciar sesión con email y contraseña, con una sesión de 30 días guardada en una cookie `HttpOnly` y `SameSite=Lax` (`Secure` con https), y SHALL cerrarla desde "Cerrar sesión". Un inicio de sesión desde un origen que no es el de la app MUST rechazarse.

#### Scenario: Contraseña equivocada
- **WHEN** el usuario escribe una contraseña incorrecta
- **THEN** ve "Email o contraseña incorrectos." y sigue en la pantalla de inicio

#### Scenario: Cerrar sesión
- **WHEN** el usuario toca "Cerrar sesión" en Datos
- **THEN** vuelve a la pantalla de inicio y la API deja de responderle datos

### Requirement: API protegida por sesión
Toda llamada a la API SHALL requerir una sesión válida, excepto las de cuentas (`/api/auth/*`) y el formulario de inscripción de la landing (`/api/alpha`). Sin sesión, la API MUST responder 401 sin datos.

#### Scenario: Sin sesión
- **WHEN** alguien sin sesión pide `/api/sets` o el inventario
- **THEN** recibe 401 "Inicia sesión para continuar"

#### Scenario: Landing pública
- **WHEN** un visitante envía el formulario de `/alfa`
- **THEN** se acepta sin sesión, como antes

### Requirement: Pantalla de inicio de sesión
La app SHALL mostrar la pantalla de inicio de sesión (Entrar / Crear cuenta) antes de cargar cualquier dato si no hay sesión, y volver a ella si la sesión vence mientras se usa.

#### Scenario: Abrir la app sin sesión
- **WHEN** el usuario abre la app sin haber iniciado sesión
- **THEN** ve la pantalla de inicio y ningún dato del inventario

#### Scenario: Sesión vencida
- **WHEN** la sesión vence y la app hace una llamada a la API
- **THEN** aparece la pantalla de inicio con "Tu sesión terminó. Vuelve a entrar."
