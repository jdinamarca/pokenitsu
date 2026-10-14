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
La app SHALL mostrar la pantalla de inicio de sesión (Entrar / Crear cuenta) en `/entrar`, antes de cargar cualquier dato, con un enlace para volver a la home, y volver a ella si la sesión vence mientras se usa. Sin sesión, `/` SHALL mostrar la home pública en vez de la app; con sesión, `/entrar` SHALL llevar a `/`.

#### Scenario: Abrir la app sin sesión
- **WHEN** el usuario abre `/` sin haber iniciado sesión
- **THEN** ve la home pública y ningún dato del inventario

#### Scenario: Entrar
- **WHEN** el usuario inicia sesión en `/entrar`
- **THEN** queda en `/` con su colección

#### Scenario: Ya con sesión
- **WHEN** el usuario con sesión abre `/entrar`
- **THEN** lo lleva a `/`

#### Scenario: Sesión vencida
- **WHEN** la sesión vence y la app hace una llamada a la API
- **THEN** aparece la pantalla de inicio con "Tu sesión terminó. Vuelve a entrar."

### Requirement: Mi perfil
La app SHALL mostrar en la barra superior el avatar y el nombre de la cuenta conectada, y al tocarlo un panel con nombre, email, si es la cuenta del dueño, si el email está verificado, desde cuándo existe la cuenta, y un resumen de la colección de esa cuenta (cartas, distintas, valor estimado, colecciones, artes conectados, ubicaciones, idiomas y lotes abiertos).

#### Scenario: Ver el perfil
- **WHEN** el dueño toca su avatar
- **THEN** ve su nombre, email, la etiqueta Dueño y sus 33 cartas, 1 colección y 8 ubicaciones

### Requirement: Avatar de entrenador
El usuario SHALL poder elegir como avatar uno de 15 entrenadores Pokémon o sus iniciales; la elección SHALL guardarse en su cuenta y verse en la barra superior.

#### Scenario: Elegir a Cynthia
- **WHEN** el usuario elige a Cynthia en Mi perfil
- **THEN** la barra superior muestra a Cynthia y al recargar sigue igual

### Requirement: Cambiar nombre y contraseña
El usuario SHALL poder cambiar su nombre, y su contraseña indicando la actual y repitiendo la nueva (al menos 10 caracteres). Si la actual es incorrecta o las nuevas no coinciden, MUST explicarlo sin cambiar nada.

#### Scenario: Contraseña actual equivocada
- **WHEN** el usuario escribe mal su contraseña actual
- **THEN** ve "La contraseña actual no es correcta." y la contraseña no cambia

### Requirement: Sesiones
El perfil SHALL mostrar la sesión actual (equipo y navegador, desde cuándo y cuándo vence) y permitir cerrar las sesiones de otros dispositivos sin cerrar la actual, y cerrar la sesión actual.

#### Scenario: Cerrar en otros dispositivos
- **WHEN** hay una sesión abierta en un celular y el usuario toca "Cerrar 1 en otros dispositivos" en el computador
- **THEN** el celular queda sin sesión y el computador sigue conectado

### Requirement: Avance de artes conectados en el perfil
El resumen de la colección en Mi perfil SHALL mostrar cuántos grupos de artes conectados tiene completos la cuenta sobre el total de grupos, y cuántos tiene empezados, en vez del número de grupos.

#### Scenario: Ninguna carta de los grupos
- **WHEN** la cuenta no tiene ninguna carta de los 35 grupos
- **THEN** el perfil muestra "0 / 35 artes conectados completos"

#### Scenario: Un grupo empezado
- **WHEN** la cuenta tiene 1 carta de un grupo de 3
- **THEN** el perfil muestra "0 / 35 artes conectados completos · 1 empezados"

### Requirement: Accesos desde el perfil
En Mi perfil, las cifras SHALL abrir su sección y cerrar el perfil: cartas y distintas Mi colección, el valor estimado Mi colección ordenada por valor total, y colecciones, artes conectados y ubicaciones su pestaña. Con mouse, al pasar sobre ellas SHALL asomar una ball distinta para cada una que se tambalea una vez; con "reducir movimiento" MUST NOT tambalearse ni mover la tarjeta, y en pantallas táctiles la ball SHALL verse quieta como pista.

#### Scenario: Ir a ubicaciones
- **WHEN** el usuario toca "8 ubicaciones" en su perfil
- **THEN** el perfil se cierra y se abre la pestaña Ubicaciones

#### Scenario: Ir al valor
- **WHEN** el usuario toca el valor estimado en su perfil
- **THEN** se abre Mi colección ordenada por valor total, de mayor a menor

#### Scenario: Pasar el mouse
- **WHEN** el usuario pasa el mouse sobre "artes conectados"
- **THEN** la tarjeta sube un poco y asoma una Great Ball que se tambalea

#### Scenario: Reducir movimiento
- **WHEN** el sistema pide reducir movimiento y el usuario pasa el mouse sobre una tarjeta
- **THEN** la ball aparece sin tambalearse y la tarjeta no se mueve
