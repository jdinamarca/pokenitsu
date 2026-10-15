# Spec Delta

## MODIFIED Requirements

### Requirement: Mi perfil
La app SHALL mostrar en la barra superior el avatar y el nombre de la cuenta conectada, y al tocarlo un panel con nombre, email, si es la cuenta del dueño, si el email está verificado, desde cuándo existe la cuenta, y un resumen de la colección de esa cuenta (cartas, distintas, valor estimado, colecciones, artes conectados, ubicaciones, idiomas y lotes abiertos).

La cabecera del panel SHALL mostrar el avatar, el nombre, las etiquetas de la cuenta y el botón "Cerrar sesión", y ese botón MUST verse al abrir el panel sin hacer scroll. Bajo la cabecera, el panel SHALL organizarse en las pestañas Colección (resumen de la colección), Aportes (aportes de fotos del usuario) y Cuenta (email, avatar, nombre, contraseña y sesiones). SHALL verse una sola pestaña a la vez. Al abrir el panel SHALL quedar en la última pestaña que el usuario abrió en ese navegador, o en Colección la primera vez. Si los aportes no se pueden cargar, la pestaña Aportes MUST NOT mostrarse. Si el contenido de la pestaña abierta no cabe en la pantalla, el panel SHALL permitir hacer scroll dentro de él.

#### Scenario: Ver el perfil
- **WHEN** el dueño toca su avatar
- **THEN** ve su nombre, la etiqueta Dueño y, en la pestaña Colección, sus 33 cartas, 1 colección y 8 ubicaciones

#### Scenario: Cerrar sesión sin scroll
- **WHEN** el usuario abre su perfil en una pantalla de 1280×700
- **THEN** el botón "Cerrar sesión" se ve en la cabecera sin hacer scroll

#### Scenario: Cambiar de pestaña
- **WHEN** el usuario toca la pestaña Cuenta
- **THEN** ve su email, avatar, nombre, contraseña y esta sesión, y deja de ver las cifras de la colección

#### Scenario: Recordar la pestaña
- **WHEN** el usuario abre la pestaña Aportes, cierra el perfil y lo vuelve a abrir
- **THEN** el perfil se abre en la pestaña Aportes

#### Scenario: Aportes no disponibles
- **WHEN** el servidor no responde los aportes del usuario
- **THEN** el perfil muestra solo las pestañas Colección y Cuenta
