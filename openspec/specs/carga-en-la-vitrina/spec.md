# carga-en-la-vitrina Specification

## Purpose
Cargar cartas al inventario desde "Arma tu colección": la expansión entera en la vitrina, con lo que se tiene encendido y lo que falta en penumbra, la misma sintaxis de teclado que Nitsu, la sesión de carga y "Deshacer", escribiendo el mismo inventario que Nitsu.

## Requirements

### Requirement: Pantalla Cargar en arma
"Arma tu colección" SHALL tener una pantalla "Cargar" en `/cargar`, a la que se llega desde el riel. El riel SHALL mostrar "Arma · Eevee", "Cargar" y "Mi inventario", con el elegido en cartulina, y "Cerrar sesión" al pie. Sin sesión, `/cargar` SHALL llevar a `/entrar` y volver después de entrar.

#### Scenario: Ir a Cargar
- **WHEN** el usuario con sesión toca "Cargar" en el riel
- **THEN** ve la pantalla Cargar con la última expansión que usó en ese navegador, o la búsqueda de expansión si no hay ninguna

### Requirement: Elegir la expansión
La expansión elegida SHALL verse en la cabecera de Cargar como un botón con su nombre, idioma, código y año. Tocarlo, la tecla `/` o Esc con la caja de entrada vacía SHALL abrir un panel para elegir la expansión. "Buscar otra expansión" del riel SHALL abrir el mismo panel. La caja de entrada MUST NOT cambiar de modo: queda solo para cargar.

El panel SHALL tener:
- un buscador por código (con sufijo de idioma, como `MEW ES`), nombre o serie, con los mismos criterios de Nitsu: primero el código exacto, después el nombre exacto, los que empiezan con lo escrito, los que lo contienen y la serie;
- las expansiones recientes del navegador (hasta 8), primero;
- la lista de todas las expansiones, agrupadas por serie (era) de la más nueva a la más antigua, en dos pestañas, "Internacionales" y "Japonesas". Se abre en la del idioma de la sesión.

Cada expansión del panel SHALL mostrar su código, su año y el avance de la cuenta: cuántas cartas distintas tiene de esa expansión y cuántas tiene impresas la expansión. Se SHALL poder elegir con clic o con las flechas y Enter. Esc SHALL cerrar el panel sin cambiar la expansión.

El riel SHALL seguir mostrando las expansiones recientes para volver a ellas con un clic. Un sufijo de idioma SHALL cambiar también el idioma de la sesión, y una expansión de un solo idioma (como las japonesas) SHALL fijarlo sola. Si las cartas de la expansión aún no están descargadas, la app SHALL bajarlas mostrando "Cargando cartas…". Si la descarga falla, SHALL decirlo con un botón para reintentar.

#### Scenario: Código con idioma
- **WHEN** el usuario abre el panel, escribe `MEW ES` y Enter
- **THEN** queda elegida 151 y el idioma de la sesión pasa a español

#### Scenario: Expansión sin descargar
- **WHEN** el usuario elige una expansión cuyas cartas nunca se bajaron
- **THEN** ve "Cargando cartas…" y, al terminar, la vitrina con todas sus cartas

#### Scenario: Recorrer las japonesas antiguas
- **WHEN** el usuario con la sesión en japonés toca el botón de la expansión
- **THEN** el panel se abre en "Japonesas", con las recientes arriba y, más abajo, la serie "Base" con Expansion Pack, Pokémon Jungle, Mystery of the Fossils y Rocket Gang, cada una con su código, año y avance (por ejemplo "1/65")

#### Scenario: La caja ya no cambia de modo
- **WHEN** el usuario tiene una expansión abierta y escribe en la caja de entrada
- **THEN** lo escrito se lee como una carga o un nombre, nunca como la búsqueda de una expansión

### Requirement: La expansión se enciende
La vitrina SHALL mostrar todas las cartas de la expansión elegida, por número, con su foto y una etiqueta con número y variante. Las cartas de las que el usuario tiene al menos una copia (en cualquier variante, idioma o estado) SHALL verse encendidas, con una pastilla "×N" si tiene más de una. Las que le faltan SHALL verse en penumbra, en su lugar, con el mismo apagado que usan las reglas. Arriba SHALL ir el contador "N / total encendidas", con el total de cartas impresas de la expansión. Un filtro SHALL permitir ver todas o solo las que faltan.

#### Scenario: Carta que falta
- **WHEN** el usuario no tiene ninguna copia de la #7 de la expansión
- **THEN** la #7 está en penumbra en su lugar y no cuenta en el contador

### Requirement: Entrada con la sintaxis de Nitsu
La entrada SHALL aceptar exactamente la sintaxis de Nitsu:
- un número solo (`25`), con variante automática: normal si la carta es común, poco común, rara o promo; holo en otro caso;
- sufijos de variante: `n`, `h`, `r`, `e` (1st Edition), `p` (Poké Ball), `m` (Master Ball);
- `25*4` o `25x4` para varias copias, y `-25` para quitar una;
- rangos `1-30` (con sufijo opcional): se saltan los números que no existen, se pide confirmar si son más de 50, y el rango se deshace completo;
- `es`, `en`… solos cambian el idioma de lo que sigue, y `nm`, `lp`… solos cambian el estado; detrás de una entrada (`25r lp`) aplican solo a esa entrada;
- un número que existe tal cual con letra (como `SV107` o `25a`) se usa entero, sin leer la letra como variante;
- Enter con la caja vacía repite la última entrada;
- Esc borra lo escrito, y con la caja vacía abre el panel para elegir la expansión.

Lo que no es nada de lo anterior SHALL leerse como el nombre de una carta (ver "Buscar una carta por nombre").

Mientras se escribe, la carta del número SHALL marcarse con luz en la vitrina y la ficha lateral SHALL mostrar qué se va a cargar ("Se cargará 2×: Eevee #133 Reverse · ES · NM → Caja Escarlata y Púrpura"). Un número que no existe SHALL avisar "¿Expansión equivocada?" sin cambiar el inventario.

#### Scenario: Reverse con cantidad y estado
- **WHEN** el usuario escribe `25r lp*2` y Enter
- **THEN** se suman 2 copias reverse LP de la #25, la carta se enciende con su ×N, y el estado de la sesión sigue igual

#### Scenario: Vista previa al escribir
- **WHEN** el usuario escribe `133`
- **THEN** la #133 se marca con luz en la vitrina y la ficha muestra la carta, cuántas copias tiene y dónde se guardará

#### Scenario: Quitar sin copias
- **WHEN** el usuario escribe `-25` y no tiene copias de esa variante, idioma y estado
- **THEN** la app avisa que no había copias y no cambia nada

### Requirement: Cargar desde la vitrina
Un clic en una carta SHALL marcarla, igual que escribir su número, y un segundo clic o el botón "Cargar una" de la ficha SHALL cargar una copia con los ajustes de la sesión.

#### Scenario: Clic en una carta apagada
- **WHEN** el usuario hace clic dos veces en una carta en penumbra
- **THEN** se carga una copia y la carta se enciende

### Requirement: Sesión de carga
La sesión SHALL tener cuatro ajustes, visibles como chips sobre la vitrina: idioma, estado (NM por defecto), "Para" (vender o mi colección personal) y "Guardar en". "Guardar en" puede ser "Automático", que elige la ubicación de cada carta con las mismas reglas de Nitsu (gana la más específica y, con precio guardado, cuentan las reglas de precio), o una ubicación fija. Los ajustes SHALL recordarse en el navegador. Si el usuario no tiene ubicaciones, las cartas SHALL quedar sin ubicación.

#### Scenario: Ubicación automática
- **WHEN** "Guardar en" está en Automático y el usuario carga una carta que una ubicación recibe
- **THEN** la copia queda en esa ubicación y la ficha lo dice

### Requirement: Mismo inventario que Nitsu
Cada carga SHALL escribir en el inventario de la cuenta con el mismo efecto que la misma carga en Nitsu: la misma fila (carta, variante, idioma, estado y ubicación), la misma cantidad y copias personales, y una entrada en el historial de cargas. Lo cargado en arma SHALL verse en Nitsu y al revés, y una cuenta nunca SHALL ver ni cambiar el inventario de otra.

#### Scenario: Cargar en arma y ver en Nitsu
- **WHEN** el usuario carga `133r` en arma y luego abre Mi colección en Nitsu
- **THEN** ve esa copia, con su variante, idioma, estado y ubicación

#### Scenario: Otra cuenta
- **WHEN** otra cuenta abre Cargar con la misma expansión
- **THEN** ve encendidas solo sus propias cartas

### Requirement: Deshacer
"Deshacer" (botón de la ficha, o ⌘/Ctrl+Z con la entrada vacía) SHALL revertir la última carga de la cuenta, o el rango completo si fue un rango, con el mismo efecto que en Nitsu, y la vitrina SHALL apagar lo que vuelve a faltar.

#### Scenario: Deshacer un rango
- **WHEN** el usuario carga `1-10` y luego deshace
- **THEN** las diez copias se quitan juntas y las cartas que no tenía vuelven a la penumbra

### Requirement: Lo cargado en la sesión
La ficha SHALL mostrar cuántas cartas se cargaron en la sesión, cuántas son nuevas para la expansión y cuál fue la última. Una carta que el usuario no tenía en esa expansión SHALL anunciarse como "Nueva".

#### Scenario: Carta nueva
- **WHEN** el usuario carga una carta que estaba en penumbra
- **THEN** la ficha dice "Nueva" y el contador sube en uno

### Requirement: Buscar una carta por nombre
Con una expansión abierta, si lo escrito en la entrada no es un número, rango, idioma ni estado, la vitrina SHALL mostrar solo las cartas cuyo nombre coincide. Coincidir SHALL ser contener lo escrito, sin distinguir mayúsculas, tildes ni signos. Lo escrito se compara con:
- el nombre de la carta en el catálogo, en el idioma de la expansión;
- el nombre en inglés del Pokémon, según el Pokédex de la carta.

La cabecera SHALL decir cuántas cartas coinciden. Si coincide una sola, Enter SHALL cargar una copia con los ajustes de la sesión y la variante automática. Si coinciden varias, Enter MUST NOT cargar nada y SHALL decir que se elija una con clic o por su número. Si no coincide ninguna, la vitrina SHALL decirlo. Borrar lo escrito SHALL volver a mostrar toda la vitrina. El filtro "Solo las que faltan" SHALL seguir aplicándose.

#### Scenario: Nombre en inglés en una expansión japonesa
- **WHEN** el usuario tiene abierta Rocket Gang (japonesa) y escribe `meow`
- **THEN** la vitrina muestra solo la ニャース #047, con "1 carta con «meow»"

#### Scenario: Una sola carta
- **WHEN** el usuario escribe `meow` en Rocket Gang y Enter
- **THEN** se carga una copia de la ニャース #047 con los ajustes de la sesión, y la vitrina vuelve a mostrarse completa

#### Scenario: Varias cartas
- **WHEN** el usuario escribe `vulpix` en Leaders' Stadium y Enter
- **THEN** la vitrina muestra las dos タケシのロコン (#017 y #018), no se carga nada y la app pide elegir una con clic o por su número

#### Scenario: Un código de idioma no es un nombre
- **WHEN** el usuario escribe `es`
- **THEN** cambia el idioma de la sesión, como siempre, y la vitrina no se filtra
