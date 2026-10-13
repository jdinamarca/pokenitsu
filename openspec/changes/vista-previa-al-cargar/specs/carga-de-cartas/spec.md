# Spec Delta

## ADDED Requirements

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

## MODIFIED Requirements

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
