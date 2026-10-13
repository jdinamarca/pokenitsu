# carga-de-cartas Specification

## Purpose
Cargar cartas al inventario lo más rápido posible usando solo el teclado: se elige la expansión una vez y después se escriben números.

## Requirements

### Requirement: Elegir expansión e idioma
El sistema SHALL permitir buscar la expansión por código impreso, nombre o código + idioma (ej. `MEW ES`, `PFL EN`, `151`), y recordar las expansiones recientes. `Esc` vuelve a la búsqueda de expansión.

#### Scenario: Buscar con código e idioma
- **WHEN** el usuario escribe `MEW ES` y elige el resultado
- **THEN** la expansión 151 queda activa y el idioma de carga pasa a Español

### Requirement: Sintaxis de entrada
El sistema SHALL interpretar un número solo (`25`) como una copia de esa carta con variante automática: normal si es común, poco común, rara o promo; holo en otro caso. Un sufijo fija la variante: `n` normal, `h` holo, `r` reverse, `e` 1st Edition, `p` Poké Ball, `m` Master Ball.

#### Scenario: Variante automática
- **WHEN** el usuario escribe `25` y la carta es común
- **THEN** se suma una copia normal

### Requirement: Cantidad, quitar, estado e idioma
El sistema SHALL aceptar `25*4` o `25x4` para varias copias y `-25` para quitar una. `nm`, `lp`, `mp`, `hp` o `dmg` solos cambian el estado de lo que sigue; detrás de una entrada (`25r lp`, `25 lp*2`) aplican solo a esa entrada. Un código de idioma solo (`es`, `en`, `ja`…) cambia el idioma de lo que sigue.

#### Scenario: Reverse con cantidad y estado
- **WHEN** el usuario escribe `25r lp*2` y Enter
- **THEN** se suman 2 copias reverse LP de la carta 25 y el estado de carga sigue igual que antes

#### Scenario: Número con letra que existe en la expansión
- **WHEN** el número completo (ej. `SV107` o `25a`) existe tal cual en la expansión
- **THEN** se usa ese número y no se interpreta la última letra como variante

#### Scenario: Carta que no existe
- **WHEN** el número no existe en la expansión activa
- **THEN** el sistema avisa "¿Expansión equivocada?" y no cambia el inventario

#### Scenario: Quitar sin copias
- **WHEN** el usuario escribe `-25` y no tiene copias de esa carta
- **THEN** el sistema avisa que no había copias y no cambia nada

### Requirement: Estado por defecto
El estado de carga SHALL ser NM al abrir la app, aunque en la sesión anterior se haya usado otro.

#### Scenario: Nueva sesión
- **WHEN** el usuario recarga la página después de cargar en LP
- **THEN** el estado activo vuelve a NM

### Requirement: Venta o colección personal
El sistema SHALL permitir alternar si lo que se carga es para vender o para la colección personal (🔒). Las copias personales se cuentan aparte en la misma fila.

#### Scenario: Cargar para la colección personal
- **WHEN** el modo personal está activo y se carga una carta
- **THEN** la copia suma en `qty` y en `personal`

### Requirement: Ubicación al cargar
El sistema SHALL guardar cada copia en la ubicación elegida, o en "🪄 Automático" en la ubicación que gane según las reglas de ubicaciones. Al quitar, saca la copia de una ubicación donde exista.

#### Scenario: Carga automática
- **WHEN** la ubicación activa es Automático y se carga una carta de Scarlet & Violet
- **THEN** la copia queda en la ubicación más específica que acepta esa carta

### Requirement: Confirmación y avisos
Tras cada carga, el sistema SHALL mostrar la carta en la vista previa, sonar (si está activado), agregarla a "Últimas cargas" y:
- avisar con ✨ si es IR, SIR o secreta
- celebrar la primera carta de un ilustrador
- descargar su precio si falta y avisar 💰 "¡sepárala!" si vale al menos el umbral de alerta

#### Scenario: Carta valiosa
- **WHEN** se carga una carta cuyo precio es mayor o igual al umbral (por defecto $5.000)
- **THEN** aparece el aviso dorado con su valor y, si su precio la manda a otra ubicación en modo Automático, se mueve sola

### Requirement: Deshacer
El sistema SHALL deshacer la última carga con `⌘Z` o el botón, revirtiendo cantidad, copias personales y ubicación según el registro (`inventory_log`). Si la última carga fue un rango, se deshace el rango completo.

#### Scenario: Deshacer una carga movida por precio
- **WHEN** una carga se movió de ubicación por su precio y el usuario deshace
- **THEN** la copia se quita de la ubicación donde quedó finalmente

#### Scenario: Deshacer un rango
- **WHEN** el usuario cargó `1-30` y luego deshace
- **THEN** se quitan las 30 copias de una vez y el inventario queda como antes del rango

### Requirement: Rangos de números
El sistema SHALL aceptar `<desde>-<hasta>` para cargar una copia de cada carta con número entre ambos, en la expansión activa, combinable con sufijo de variante, cantidad, estado y `-` para quitar (ej. `1-30r`, `1-30*2`, `1-30 lp`, `-1-30`).

#### Scenario: Rango con variante
- **WHEN** el usuario escribe `1-10r` en 151
- **THEN** se suma una copia reverse de cada carta del 1 al 10

#### Scenario: Rango al revés
- **WHEN** el usuario escribe `30-1`
- **THEN** se carga igual que `1-30`

### Requirement: Números inexistentes en un rango
Los números del rango que no existen en la expansión SHALL saltarse, y la confirmación SHALL indicar cuántas cartas se cargaron y cuáles se saltaron.

#### Scenario: Rango con huecos
- **WHEN** el usuario carga `1-12` y la 7 no existe en la expansión
- **THEN** se cargan 11 cartas y la confirmación dice que la 7 se saltó

### Requirement: Confirmación de rangos grandes
Un rango de más de 50 cartas SHALL pedir confirmación antes de cargar.

#### Scenario: Rango de 100
- **WHEN** el usuario escribe `1-100`
- **THEN** el sistema pregunta si quiere cargar 100 cartas y no carga nada si cancela

### Requirement: Repetir la última entrada
Enter con la entrada vacía SHALL repetir la última entrada (carta o rango, variante, cantidad y estado) en la misma expansión, mostrando qué se repitió.

#### Scenario: Repetir una carta
- **WHEN** el usuario cargó `25r` y luego presiona Enter con la entrada vacía
- **THEN** se suma otra copia reverse de la 25 y el mensaje dice "Repetido: 25r"

#### Scenario: Nada que repetir
- **WHEN** el usuario presiona Enter vacío sin haber cargado nada en esta sesión o después de cambiar de expansión
- **THEN** no pasa nada

### Requirement: Avance de la expansión al cargar
La expansión activa en Cargar SHALL mostrar su avance en el modo de completitud elegido (por defecto Base), actualizado después de cada carga y de cada deshacer.

#### Scenario: Carga que suma
- **WHEN** la expansión activa está en 88/165 y el usuario carga una carta de número impreso que no tenía
- **THEN** el indicador pasa a 89/165

#### Scenario: Copia repetida
- **WHEN** el usuario carga otra copia de una carta que ya tenía
- **THEN** el avance no cambia

### Requirement: Aviso de carta nueva para la expansión
Cuando una carga agrega una carta que el usuario no tenía en esa expansión, la confirmación SHALL decir "¡Nueva!" con el avance resultante, y al completar la expansión en el modo elegido SHALL mostrar una celebración.

#### Scenario: Última carta
- **WHEN** el usuario carga la carta que completa 165/165 en modo Base
- **THEN** aparece una celebración "¡Completaste 151!"

### Requirement: Ajustes de carga compactos
La pantalla de carga SHALL mostrar el idioma, el estado, la ubicación y el destino (vender o colección personal) como un botón cada uno con su valor actual. Las opciones de cada ajuste SHALL abrirse al tocar su botón y cerrarse al elegir una o al tocar fuera. Un estado distinto de NM y el modo colección personal SHALL verse destacados.

#### Scenario: Cambiar la ubicación
- **WHEN** el usuario toca "Guardar en: Automático" y elige "Caja 1"
- **THEN** el menú se cierra, el botón dice "Caja 1" y las cartas siguientes se guardan ahí

#### Scenario: Estado cambiado desde el teclado
- **WHEN** el usuario escribe `lp` en el campo del número y Enter
- **THEN** el botón de estado muestra LP destacado como advertencia

#### Scenario: Preferencias guardadas
- **WHEN** el usuario recarga la página
- **THEN** los botones muestran el idioma, la ubicación y el destino que tenía elegidos (el estado vuelve a NM)

### Requirement: Búsqueda de expansión a pedido
Con una expansión activa, la búsqueda SHALL quedar oculta y la pantalla SHALL mostrar la expansión con su avance y un botón "Cambiar expansión". Ese botón o `Esc` en el campo del número vacío SHALL abrir la búsqueda, que muestra las expansiones recientes; si el campo tiene texto, `Esc` SHALL borrarlo primero. Sin expansión activa, la búsqueda SHALL verse siempre.

#### Scenario: Cambiar con Esc
- **WHEN** hay una expansión activa y el usuario presiona `Esc` en el campo del número vacío
- **THEN** aparece la búsqueda con el foco y las expansiones recientes

#### Scenario: Esc con texto
- **WHEN** el campo del número tiene texto y el usuario presiona `Esc`
- **THEN** el texto se borra y la búsqueda de expansión no se abre

#### Scenario: Cancelar el cambio
- **WHEN** la búsqueda está abierta con una expansión activa y el usuario presiona `Esc`
- **THEN** la búsqueda se esconde y el foco vuelve al campo del número

### Requirement: Ayuda de atajos compacta
La pantalla de carga SHALL mostrar en una sola línea los atajos más usados y un "Todos los atajos" que abre la lista completa.

#### Scenario: Ver todos los atajos
- **WHEN** el usuario toca "Todos los atajos"
- **THEN** se muestra la lista completa de atajos y la opción de sonido

### Requirement: Historial corto
"Últimas cargas" SHALL mostrar las 5 cargas más recientes y un "Ver las 12" que muestra hasta 12.

#### Scenario: Ver más cargas
- **WHEN** hay 12 cargas y el usuario toca "Ver las 12"
- **THEN** la lista muestra las 12

### Requirement: Vista previa en el celular
En pantallas angostas, la vista previa de la carta SHALL aparecer justo debajo del campo del número, antes de "Últimas cargas", y la pantalla de carga MUST NOT desbordarse hacia los lados.

#### Scenario: Cargar desde el celular
- **WHEN** el usuario carga una carta en un celular de 390 px de ancho
- **THEN** ve la carta cargada sin bajar más allá del campo y sin desplazamiento horizontal

### Requirement: Vista previa antes de cargar
Mientras el usuario escribe en el campo del número, la pantalla SHALL mostrar, sin cargar nada, lo que hará Enter: la carta que se cargaría o quitaría en la vista previa (distinguida de una carta ya cargada) y una línea con la carta, variante, idioma, estado y ubicación; cuántas cartas tiene un rango; que un número no existe; o que Enter cambia el idioma o el estado. Un clic en la carta de la vista previa SHALL cargarla igual que Enter.

#### Scenario: Ver la carta antes de Enter
- **WHEN** en Jungle el usuario escribe `3` sin presionar Enter
- **THEN** la vista previa muestra Flareon #3 como pendiente, la línea dice "Se cargará: Flareon #3 Holo…" y el inventario no cambia

#### Scenario: Número que no existe
- **WHEN** en Jungle el usuario escribe `99`
- **THEN** la línea avisa que la 99 no existe en Jungle antes de presionar Enter

#### Scenario: Cargar con un clic
- **WHEN** hay una carta en la vista previa pendiente y el usuario hace clic en ella
- **THEN** se carga como si hubiera presionado Enter

### Requirement: Buscar la carta por nombre
Si lo escrito tiene letras y no es un número de la expansión ni un comando de idioma o estado, el sistema SHALL listar las cartas de la expansión activa cuyo nombre, o el nombre en inglés de su Pokémon según su número de Pokédex, lo contiene (sin distinguir mayúsculas ni tildes), primero las que empiezan así, con su número, rareza, variante automática y cuántas tiene el usuario.

#### Scenario: Nombre en inglés en una expansión japonesa
- **WHEN** en Rocket Gang el usuario escribe `charmander`
- **THEN** la lista muestra ヒトカゲ · Charmander #012

#### Scenario: Comando de idioma
- **WHEN** el usuario escribe exactamente `es`
- **THEN** no aparece la lista y Enter cambia el idioma a Español, como antes

### Requirement: Elegir y cargar desde la lista de nombres
En la lista de nombres, ↑/↓ SHALL elegir una carta y la vista previa SHALL mostrar la elegida; Enter o un clic SHALL cargarla con su variante automática; Tab SHALL poner su número en el campo para agregarle variante, cantidad o estado.

#### Scenario: Dos cartas con el mismo nombre
- **WHEN** en Jungle el usuario escribe `flar`, presiona ↓ y Enter
- **THEN** la lista muestra Flareon #3 y #19, y se carga una Flareon #19

#### Scenario: Agregar una variante
- **WHEN** el usuario escribe `flar`, presiona Tab, escribe `r` y Enter
- **THEN** se carga una Flareon #3 reverse

### Requirement: Imagen de referencia para cartas sin foto
Cuando una carta no tiene imagen (muchas japonesas antiguas), la vista previa, la lista de nombres y "Últimas cargas" SHALL mostrar una imagen del mismo Pokémon de otra expansión, atenuada, y la vista previa SHALL indicar que es una imagen de referencia.

#### Scenario: Carta japonesa sin foto
- **WHEN** el usuario escribe `12` en Rocket Gang y la carta no tiene imagen
- **THEN** la vista previa muestra un Charmander de otra expansión, atenuado, con la etiqueta "Imagen de referencia"
