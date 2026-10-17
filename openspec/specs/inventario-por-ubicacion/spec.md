# inventario-por-ubicacion Specification

## Purpose
Ver y editar el inventario en "Arma tu colección" como una estantería: una repisa por cada ubicación real del usuario, con una ficha para sumar, quitar, mover, marcar personales y poner precio, con el mismo efecto que en Nitsu.

## Requirements

### Requirement: Pantalla Mi inventario en arma
"Arma tu colección" SHALL tener una pantalla "Mi inventario" en `/inventario`, a la que se llega desde el riel. Arriba SHALL ir el contador grande con el total de copias de la vista y una nota con las cartas distintas y el valor de venta en CLP sin decimales. Sin sesión, `/inventario` SHALL llevar a `/entrar` y volver después de entrar.

#### Scenario: Abrir el inventario
- **WHEN** el usuario con sesión toca "Mi inventario"
- **THEN** ve el contador con sus copias y la estantería de sus ubicaciones

### Requirement: Estantería por ubicación
La vitrina SHALL mostrar una repisa por cada ubicación real de la cuenta, en el orden en que el usuario las tiene, con su nombre, cantidad de copias y valor. Al final SHALL ir la repisa "Sin ubicación" si hay copias sin ubicación. Cada repisa SHALL mostrar sus cartas con foto, una pastilla "×N" cuando hay más de una copia y una etiqueta con idioma, variante y estado. Dentro de una repisa, las cartas SHALL ir en el orden en que se guardan: expansión y luego número. Una repisa con muchas cartas SHALL poder recorrerse por completo, sin cortar cartas en silencio.

#### Scenario: Copias sin ubicación
- **WHEN** el usuario tiene copias sin ubicación
- **THEN** aparece la repisa "Sin ubicación" al final, con esas copias

### Requirement: Ubicaciones en el riel
El riel SHALL listar "Todas" y cada ubicación (más "Sin ubicación" si corresponde), con su cantidad de copias y una línea que diga qué recibe. Al elegir una, la vitrina SHALL mostrar solo esa repisa y el contador SHALL mostrar sus copias. La ubicación elegida SHALL verse con la luz cálida. Las ubicaciones SHALL ser de solo lectura en arma: se crean y editan en Nitsu.

#### Scenario: Elegir una carpeta
- **WHEN** el usuario elige "Carpeta Especiales" en el riel
- **THEN** la vitrina muestra solo esa repisa y el contador muestra sus copias

### Requirement: Buscar y filtrar
Sobre la vitrina SHALL haber una búsqueda por nombre, expansión, número o ilustrador, y un filtro "Para" (todas, para vender, personales). Las repisas que queden vacías con un filtro SHALL ocultarse mientras el filtro esté activo.

#### Scenario: Buscar por nombre
- **WHEN** el usuario escribe "eevee"
- **THEN** cada repisa muestra solo sus Eevee, y las que no tienen ninguna se ocultan

### Requirement: Ficha de la copia
Al elegir una carta, la ficha lateral SHALL mostrar la foto grande, el código de catálogo, el nombre, cuántas copias hay y cuántas son personales, la ubicación, la variante, el idioma, el estado y el precio con su fuente (tu precio si lo pusiste). La carta elegida SHALL verse con el contorno de luz cálida.

#### Scenario: Elegir una carta
- **WHEN** el usuario hace clic en una carta de una repisa
- **THEN** la ficha muestra sus datos y la carta queda marcada con luz

### Requirement: Editar copias desde la ficha
La ficha SHALL permitir:
- **−1 / +1:** quitar o sumar una copia de esa fila; al llegar a 0 la carta sale de la repisa.
- **Mover:** cambiar la ubicación, la variante, el idioma o el estado de algunas copias o de todas ("¿Cuántas de las N copias?"), uniéndolas con la fila de destino si ya existe.
- **Personales:** elegir cuántas copias son de la colección personal (de 0 a N).
- **Mi precio:** poner un precio propio en dólares, que se guarda convertido a CLP con el tipo de cambio del día, o volver al precio de mercado dejándolo vacío.

Cada edición SHALL tener el mismo efecto que la misma edición en Nitsu, y SHALL verse en las dos apps.

#### Scenario: Mover dos de tres copias
- **WHEN** el usuario mueve 2 de sus 3 copias a "Carpeta colección"
- **THEN** queda 1 copia en la repisa original, 2 en "Carpeta colección", y Nitsu muestra lo mismo

#### Scenario: Quitar la última copia
- **WHEN** el usuario toca −1 en una carta con una sola copia
- **THEN** la carta sale de la repisa y la ficha pasa a la siguiente carta

### Requirement: Inventario de cada cuenta
La pantalla SHALL mostrar y editar solo el inventario, las ubicaciones y los precios propios de la cuenta con sesión, con la misma separación por cuenta que usa Nitsu.

#### Scenario: Dos cuentas
- **WHEN** dos cuentas abren Mi inventario
- **THEN** cada una ve solo sus copias y sus ubicaciones
