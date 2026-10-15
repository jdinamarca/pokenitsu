# cuentas Specification

## Purpose
Cuentas de usuario de la app: crear cuenta solo con invitación, iniciar y cerrar sesión, y que los datos solo se puedan leer o modificar con una sesión válida.

## Requirements

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

### Requirement: Fondo animado del inicio de sesión
La pantalla de inicio de sesión SHALL verse como una carpeta abierta: en una página, 9 bolsillos con cartas reales nítidas (7 llenos y 2 vacíos) que se deslizan a su lugar al abrirla; en la otra, el formulario, que se sacude cuando el inicio de sesión falla. Mientras el usuario escribe en un campo, el bolsillo vacío "Tu próxima carta" SHALL iluminarse. Con mouse, la carta de un bolsillo SHALL levantarse al pasar sobre ella. En pantallas angostas SHALL verse una sola fila de bolsillos sobre el formulario. Con "reducir movimiento" SHALL quedar sin deslizamientos ni cartas que se levantan.

#### Scenario: Abrir el login
- **WHEN** el usuario abre `/entrar`
- **THEN** ve la carpeta con las cartas deslizándose a sus bolsillos y el formulario en la otra página, sin que nada tape los campos

#### Scenario: Escribir el email
- **WHEN** el usuario pone el cursor en el campo de email
- **THEN** el bolsillo "Tu próxima carta" se ilumina en dorado

#### Scenario: Celular
- **WHEN** el usuario abre `/entrar` en una pantalla de 390 px de ancho
- **THEN** ve una fila de 3 bolsillos sobre el formulario, sin scroll horizontal

#### Scenario: Contraseña incorrecta
- **WHEN** el inicio de sesión falla
- **THEN** la tarjeta del formulario se sacude y aparece el mensaje de error

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
