# Spec Delta

## MODIFIED Requirements

### Requirement: Vistas y filtros
El sistema SHALL mostrar las colecciones como tarjetas con avance de cartas y de cameos, y cada colección con pestañas **Cartas** y **Cameos**. En Cartas: todas / las que tengo / las que me faltan, "Por año" o "Por región", y en Filtros el orden (mismos criterios de Mi colección), rareza, precio y ver ocultas.

#### Scenario: Ver lo que falta
- **WHEN** el usuario elige "Me faltan"
- **THEN** solo aparecen los espacios sin copias

#### Scenario: Cambiar de pestaña
- **WHEN** el usuario toca la pestaña Cameos
- **THEN** ve los cameos del Pokémon de esa colección

## ADDED Requirements

### Requirement: Pestaña Cameos de una colección
La pestaña Cameos SHALL mostrar los cameos del Pokémon de la colección (de la base de cameos más los cameos propios de la colección), en color los que el usuario tiene y en blanco y negro los que no, con su avance, filtro todos / tengo / me faltan y filtro por cómo aparece (personaje, silueta, disfraz, dibujo o imagen, peluche o juguete, estatua, parcial, jumbo, otro). Los cameos sin carta en el catálogo SHALL aparecer en una sección aparte como referencia.

#### Scenario: Cameo que tengo
- **WHEN** el usuario tiene el Snorlax de Wizards Promos #49 y abre los cameos de Eevee
- **THEN** esa carta se ve en color con "La tienes"

#### Scenario: Filtrar por silueta
- **WHEN** el usuario elige "Silueta"
- **THEN** solo ve los cameos donde el Pokémon aparece como silueta

### Requirement: Buscar cameos de cualquier Pokémon
La lista de colecciones SHALL tener un buscador "¿En qué cartas aparece…?" que muestra los cameos de cualquier Pokémon, tenga o no una colección, con la opción de crear su colección.

#### Scenario: Pokémon sin colección
- **WHEN** el usuario busca "Snorlax" sin tener colección de Snorlax
- **THEN** ve sus cameos y un botón para crear la colección de Snorlax

### Requirement: Acciones de una colección
Las acciones de una colección (editar, agregar carta a mano, agregar cameo, seguir o dejar una checklist, buscar japonesas, borrar) SHALL estar en un menú "⋯" del encabezado, y borrar SHALL pedir confirmación.

#### Scenario: Borrar cancelado
- **WHEN** el usuario elige Borrar y cancela la confirmación
- **THEN** la colección no se borra
