## Purpose
La vitrina "Arma tu Master Set" de "Arma tu colección": elegir un Pokémon de la familia Eevee y ver su Full con las mismas reglas, vistas y revisión que Eevee.

## ADDED Requirements

### Requirement: Enlace "Arma tu Master Set"
El riel SHALL llamar "Arma tu Master Set" al enlace de la vitrina del Full. El enlace SHALL quedar marcado en `/` y en cualquier dirección `/master-set/<pokémon>`.

#### Scenario: Abrir desde el riel
- **WHEN** el usuario toca "Arma tu Master Set"
- **THEN** ve la vitrina de Eevee y el enlace queda marcado

### Requirement: Abanico de la familia
Arriba de la vitrina SHALL ir una fila con los 9 Pokémon de la familia Eevee, en este orden: Vaporeon, Jolteon, Flareon, Espeon, Eevee (al centro), Umbreon, Leafeon, Glaceon y Sylveon. El Pokémon elegido SHALL destacarse, y tocar otro SHALL abrir su vitrina.

#### Scenario: Elegir una evolución
- **WHEN** el usuario toca Umbreon en el abanico
- **THEN** la dirección pasa a `/master-set/umbreon`, la vitrina muestra el Full de Umbreon y Umbreon queda destacado

#### Scenario: El avance sigue las reglas
- **WHEN** la vista activa es "Master set inglés"
- **THEN** cada retrato cuenta solo las impresiones que esa vista deja en su Full, igual que el contador de la vitrina de ese Pokémon

### Requirement: Retrato y avance de cada Pokémon
Cada retrato del abanico SHALL mostrar el nombre del Pokémon y "tienes / total" de su Full, calculado con las reglas de la vista activa. Su arte SHALL ser el de la carta más reciente de ese Pokémon que la cuenta tiene, en color, o si no tiene ninguna, una carta suya en blanco y negro. Un Pokémon sin Full SHALL decir "Sin traer".

#### Scenario: Pokémon sin traer
- **WHEN** el Full de Leafeon todavía no se ha importado
- **THEN** su retrato dice "Sin traer"

### Requirement: Dirección de cada Pokémon
Cada Pokémon de la familia SHALL tener su dirección `/master-set/<nombre en minúsculas>`. `/` SHALL abrir Eevee. Un nombre que no es de la familia SHALL mostrar un aviso con un enlace a Eevee. Atrás SHALL volver al Pokémon anterior.

#### Scenario: Enlace antiguo
- **WHEN** el usuario abre `/`
- **THEN** ve la vitrina de Eevee como antes

#### Scenario: Atrás
- **WHEN** el usuario pasa de Eevee a Espeon y vuelve con Atrás
- **THEN** ve otra vez la vitrina de Eevee

### Requirement: Las reglas y la vista se mantienen
Al cambiar de Pokémon, SHALL mantenerse las reglas activas, la vista guardada elegida, el orden, la opción "Ver" (Todas · Las que tengo · Me faltan) y el filtro "Por verificar". La impresión elegida en la ficha SHALL soltarse.

#### Scenario: Cambiar con una vista
- **WHEN** el usuario tiene "Master set inglés" y "Me faltan" elegidos en Eevee y pasa a Vaporeon
- **THEN** la vitrina de Vaporeon se abre con "Master set inglés" y "Me faltan"

### Requirement: Traer el Full de un Pokémon
Un Pokémon de la familia sin Full SHALL mostrar el botón "Traer el Full de <Pokémon>", que lo importa desde las mismas fuentes que Eevee. Mientras importa, el botón SHALL decirlo; al terminar, SHALL mostrar su vitrina. Las fuentes MUST NOT consultarse sin que el usuario lo pida.

#### Scenario: Traer Vaporeon
- **WHEN** el usuario abre `/master-set/vaporeon` sin Full y toca "Traer el Full de Vaporeon"
- **THEN** se importa su Full y aparece su vitrina, con su retrato en el abanico mostrando su avance
