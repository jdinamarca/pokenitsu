# Spec Delta

## ADDED Requirements

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
