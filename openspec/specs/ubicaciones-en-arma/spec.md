# ubicaciones-en-arma Specification

## Purpose
La pantalla "Cajas y carpetas" de "Arma tu colección" permite ver, crear, editar, ordenar y borrar las ubicaciones reales de la cuenta, y ubicar automáticamente las copias según sus reglas. Guarda lo mismo que la pestaña Ubicaciones de Nitsu.

## Requirements

### Requirement: Pantalla Cajas y carpetas
"Arma tu colección" SHALL tener una pantalla "Cajas y carpetas" en `/cajas`, con su enlace en el riel entre "Mi inventario" y "Por reemplazar". Arriba SHALL mostrar cuántas ubicaciones y cuántas copias tiene la cuenta. Sin sesión, `/cajas` SHALL llevar a `/entrar` y volver a `/cajas` después de entrar.

#### Scenario: Abrir la pantalla
- **WHEN** el usuario con sesión toca "Cajas y carpetas" en el riel
- **THEN** ve "8 ubicaciones · 33 copias" y el estante con sus ubicaciones

#### Scenario: Sin sesión
- **WHEN** alguien sin sesión abre `/cajas`
- **THEN** llega a `/entrar` y, después de entrar, vuelve a `/cajas`

### Requirement: Estante de cajas y carpetas
La pantalla SHALL mostrar las ubicaciones como objetos sobre repisas de madera:
- las carpetas, como lomos de pie con su nombre y su cantidad;
- las cajas y las de tipo "otra", como cajas con tapa y una etiqueta con el nombre, las cartas y el valor.

Las que tienen cartas SHALL ir en la repisa "Con cartas" y las vacías en la repisa "Vacías por ahora", apagadas. Dentro de cada repisa se respeta el orden de la lista.

#### Scenario: Caja con cartas
- **WHEN** la "Caja 1 · Scarlet & Violet" tiene 19 copias que valen $888
- **THEN** aparece en la repisa "Con cartas" con la etiqueta "19 cartas · $888"

#### Scenario: Ubicación vacía
- **WHEN** una ubicación no tiene copias
- **THEN** aparece apagada en la repisa "Vacías por ahora"

### Requirement: Color de cada ubicación
El color de cada ubicación SHALL indicar lo que recibe: morado si es colección personal, dorado si es de especiales o tiene precio mínimo, y un color de la paleta según su posición en las demás.

#### Scenario: Carpeta de especiales
- **WHEN** una carpeta recibe IR y SIR o cartas desde $5.000
- **THEN** su lomo es dorado

### Requirement: Animación del estante
Con mouse, al pasar sobre una ubicación con cartas, la carpeta SHALL inclinarse y la tapa de la caja SHALL levantarse. En los dos casos asoman hasta 3 de sus cartas más valiosas. La ubicación elegida SHALL quedar en esa misma pose, con una marca de luz cálida debajo. Las ubicaciones SHALL entrar escalonadas al abrir la pantalla, y al elegir otra no se repite la entrada. Con "reducir movimiento" MUST NOT haber movimiento ni entrada animada.

#### Scenario: Pasar el mouse por una caja
- **WHEN** el usuario pasa el mouse sobre una caja con cartas
- **THEN** se levanta la tapa y asoman sus cartas más valiosas

#### Scenario: Movimiento reducido
- **WHEN** el usuario tiene activado "reducir movimiento"
- **THEN** las carpetas no se inclinan, las tapas no se abren y no hay entrada animada

### Requirement: Ficha de la ubicación elegida
Al tocar una ubicación, el sistema SHALL marcarla como elegida y mostrar su ficha a un lado. La ficha muestra:
- el tipo y la posición en la lista ("Caja · #4 en la lista");
- el nombre;
- las cartas, las expansiones y el valor;
- hasta 6 miniaturas de sus cartas más valiosas;
- lo que recibe, en chips con lenguaje de coleccionista y la regla completa en una frase como ayuda;
- los avisos de reglas que chocan;
- la nota.

#### Scenario: Elegir una carpeta
- **WHEN** el usuario toca la "Carpeta colección personal", que tiene 12 copias
- **THEN** la ficha muestra "12 cartas", el chip "🔒 Colección personal" y el botón "Ver las 12 cartas"

#### Scenario: Caja general
- **WHEN** la ubicación elegida no tiene regla
- **THEN** el chip dice "📦 Todo lo demás"

### Requirement: Acciones de la ficha
La ficha SHALL ofrecer "Ver las N cartas", "Editar", subir (↑), bajar (↓) y "Borrar".

#### Scenario: Ficha de una caja vacía
- **WHEN** la ubicación elegida no tiene copias
- **THEN** el botón dice "Ver cartas" y las demás acciones siguen disponibles

### Requirement: Ubicación elegida al abrir y en pantallas angostas
Al abrir la pantalla SHALL quedar elegida la primera ubicación con cartas, o la primera de la lista si ninguna tiene. En pantallas angostas la ficha SHALL ir debajo del estante y, al elegir una ubicación, desplazarse hasta quedar a la vista.

#### Scenario: Abrir con cajas vacías al principio
- **WHEN** las dos primeras ubicaciones están vacías y la tercera tiene cartas
- **THEN** queda elegida la tercera

### Requirement: Ver las cartas de una ubicación
"Ver las N cartas" SHALL abrir Mi inventario con esa ubicación elegida en su riel. Para las copias sin ubicación, SHALL abrirlo con "Sin ubicación" elegida.

#### Scenario: Ver cartas de una caja
- **WHEN** el usuario toca "Ver las 19 cartas" en la "Caja 1 · Scarlet & Violet"
- **THEN** se abre Mi inventario con esa caja elegida y su repisa de 19 copias

### Requirement: Crear y editar ubicaciones
El riel SHALL tener el botón "+ Nueva caja o carpeta", y la ficha el botón "Editar". Los dos SHALL abrir el formulario de la ubicación. Al guardar SHALL quedar igual que si se hubiera hecho en Nitsu. Una ubicación nueva queda al final de la lista.

#### Scenario: Crear una carpeta de IR
- **WHEN** el usuario crea "Carpeta IR", tipo carpeta, solo especiales con la rareza IR
- **THEN** aparece al final de la lista, en "Vacías por ahora", y su ficha muestra el chip "✨ IR"

#### Scenario: Lo mismo en Nitsu
- **WHEN** el usuario edita la regla de una caja en Arma
- **THEN** la pestaña Ubicaciones de Nitsu muestra la misma regla

### Requirement: Campos del formulario
El formulario de la ubicación SHALL pedir:
- nombre (único en la cuenta) y tipo (caja, carpeta u otra);
- si la app la asigna sola al cargar o solo a mano;
- qué copias recibe: ambas, solo para vender o solo personales;
- región: internacionales, japonesas, chinas o coreanas;
- series (vacío = todas), o expansiones por código o id;
- cartas: todas, solo challa, o solo especiales (rarezas, precio mínimo en CLP, o ambos);
- nota.

#### Scenario: Editar una caja existente
- **WHEN** el usuario toca "Editar" en una caja que solo recibe challa de Scarlet & Violet
- **THEN** el formulario se abre con "Solo challa" elegido y Scarlet & Violet marcada

### Requirement: Validar el formulario
El formulario MUST NOT guardar y SHALL decir qué falta en estos casos:
- un nombre vacío;
- un nombre repetido ("Ya existe una ubicación con ese nombre");
- un código de expansión desconocido ("No encontré: XYZ");
- "solo especiales" sin rareza ni precio.

#### Scenario: Código desconocido
- **WHEN** el usuario escribe "MEW, XYZ" en expansiones y guarda
- **THEN** el formulario dice "No encontré: XYZ" y no guarda

### Requirement: Ordenar ubicaciones
Los botones ↑ y ↓ de la ficha SHALL cambiar la posición de la ubicación en la lista. Esa posición solo importa para desempatar entre reglas igual de específicas. ↑ SHALL estar desactivado en la primera y ↓ en la última.

#### Scenario: Subir una caja
- **WHEN** el usuario toca ↑ en la ubicación #4
- **THEN** pasa a ser la #3 y la que era #3 pasa a #4

### Requirement: Borrar sin perder cartas
"Borrar" SHALL pedir confirmación y decir cuántas copias quedarán sin ubicación. Al borrar, esas copias SHALL quedar sin ubicación, y el historial de cargas que apuntaba a ella SHALL apuntar a "sin ubicación". Ninguna copia se pierde.

#### Scenario: Borrar una caja con cartas
- **WHEN** el usuario confirma borrar una caja con 4 copias
- **THEN** la caja desaparece del estante y aparece el aviso "4 copias sin ubicación"

### Requirement: Avisos de reglas que chocan
La ficha SHALL mostrar un aviso ⚠️ cuando otra ubicación se queda con todas las cartas de algún tipo que esta también acepta. Ocurre cuando esa otra es más específica, o igual de específica y está antes en la lista. El aviso dice qué cartas no llegan y quién las toma, y sugiere quitarlas de esa regla o, si empatan, subir esta con ↑. No hay aviso cuando la otra solo toma una parte: solo especiales, solo challa, solo personales o solo para vender, otra región, u otras expansiones.

#### Scenario: Dos cajas aceptan la misma serie
- **WHEN** dos cajas aceptan Scarlet & Violet internacionales con la misma regla
- **THEN** la de más abajo muestra "⚠️ Scarlet & Violet: no llegan aquí, antes las toma “…” (#3). Quítalas de esa regla o sube esta con ↑."

### Requirement: Asignación automática
Si la cuenta tiene copias sin ubicación, la pantalla SHALL mostrar un aviso con cuántas son y cuántas pueden ubicar sus reglas, con los botones "Asignar automáticamente" (solo si alguna calza) y "Ver cuáles son". Antes de mover, "Asignar automáticamente" SHALL mostrar cuántas copias irán a cada ubicación, con el detalle por serie, y recordar que después hay que guardarlas físicamente. Al confirmar, todas se mueven en una sola transacción.

#### Scenario: Ubicar las copias sin ubicación
- **WHEN** hay 5 copias sin ubicación, 3 calzan con "Caja 1 · Scarlet & Violet" y el usuario confirma
- **THEN** esas 3 quedan en esa caja, 2 siguen sin ubicación, y Nitsu muestra lo mismo

#### Scenario: Ninguna calza
- **WHEN** ninguna copia sin ubicación calza con las reglas
- **THEN** el aviso muestra las copias sin ubicación y "Ver cuáles son", sin "Asignar automáticamente"

### Requirement: A dónde va cada copia al asignar
Cada copia SHALL ir a la ubicación que elige la misma regla que usa Cargar: gana la más específica y, si empatan, la de más arriba. Se toman como personales las filas en que todas las copias son personales. Las copias que ninguna regla acepta quedan sin ubicación.

#### Scenario: Copia personal
- **WHEN** una fila sin ubicación tiene 2 copias y las 2 son personales
- **THEN** va a la "Carpeta colección personal"

### Requirement: Orden sugerido y explicación
La explicación del orden sugerido y de cómo se elige la ubicación SHALL ir en un desplegable "¿Cómo decide dónde va cada carta?". Está cerrado si ya hay ubicaciones y abierto si no hay ninguna. Sin ubicaciones, la pantalla SHALL ofrecer "Crear el orden sugerido", que crea las mismas 8 que Nitsu:
- 2 carpetas: colección personal, y especiales desde el precio de alerta de la cuenta;
- 6 cajas: Mega Evolution, Scarlet & Violet, Sword & Shield, Sun & Moon y XY, Japonesas y otras, y una general.

#### Scenario: Cuenta sin ubicaciones
- **WHEN** una cuenta sin ubicaciones abre Cajas y carpetas
- **THEN** ve la explicación abierta y el botón "Crear el orden sugerido"

#### Scenario: Crear las sugeridas
- **WHEN** el usuario toca "Crear el orden sugerido"
- **THEN** se crean 2 carpetas y 6 cajas con sus reglas, y la primera queda elegida

### Requirement: Ubicaciones de cada cuenta
La pantalla SHALL mostrar, crear, editar, ordenar, borrar y asignar solo las ubicaciones y el inventario de la cuenta con sesión. Una ubicación de otra cuenta MUST NOT poder editarse, borrarse ni recibir copias.

#### Scenario: Dos cuentas
- **WHEN** dos cuentas abren Cajas y carpetas
- **THEN** cada una ve y edita solo sus ubicaciones
