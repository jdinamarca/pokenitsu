## MODIFIED Requirements

### Requirement: Deshacer
"Deshacer" SHALL estar solo en el renglón más nuevo de la lista "En esta sesión", con la explicación "Deshacer revierte solo la última carga de esta sesión". La ficha MUST NOT tener un botón "Deshacer".

Deshacer SHALL revertir exactamente la carga de ese renglón (o el rango completo, si fue un rango), con el mismo efecto que en Nitsu, y la vitrina SHALL apagar lo que vuelve a faltar. MUST NOT revertir una carga que no esté en la lista de la sesión. Si esa carga ya no existe en el historial, por ejemplo porque se deshizo en otro lado, la app SHALL avisarlo sin cambiar el inventario.

Al deshacer, el renglón SHALL salir de la lista, y el siguiente SHALL quedar como el último que se puede deshacer. ⌘/Ctrl+Z con la entrada vacía SHALL hacer lo mismo. Con la lista vacía, SHALL avisar "No hay nada que deshacer en esta sesión" sin tocar el inventario.

#### Scenario: Deshacer un rango
- **WHEN** el usuario carga `1-10` y luego toca "Deshacer" en ese renglón
- **THEN** las diez copias se quitan juntas, las cartas que no tenía vuelven a la penumbra y el renglón sale de la lista

#### Scenario: Nada de otra sesión
- **WHEN** el usuario abre Cargar, no carga nada y aprieta ⌘Z tres veces
- **THEN** la app avisa "No hay nada que deshacer en esta sesión" y el inventario no cambia

#### Scenario: Deshacer de a uno, hacia atrás
- **WHEN** el usuario carga la #47 y luego la #49, y deshace dos veces
- **THEN** primero se revierte la #49, después la #47, y la lista queda vacía

### Requirement: Lo cargado en la sesión
La ficha SHALL mostrar "En esta sesión" como una lista de lo cargado o quitado en la sesión, de lo más nuevo a lo más viejo. Cada renglón SHALL decir la cantidad (+N o −N), la carta con su número, la variante, el idioma, el estado y la ubicación. Un rango SHALL decir cuántas cartas y de qué números. Arriba SHALL ir el total de copias cargadas y cuántas cartas son nuevas para la expansión. Una carta que el usuario no tenía en esa expansión SHALL anunciarse como "Nueva". La lista SHALL empezar vacía al abrir o recargar la página.

#### Scenario: Carta nueva
- **WHEN** el usuario carga una carta que estaba en penumbra
- **THEN** la ficha dice "Nueva", el contador sube en uno y la carga aparece primera en la lista, con "Deshacer"

## ADDED Requirements

### Requirement: Tus copias en la ficha
La ficha de la carta marcada SHALL decir cuántas copias tiene el usuario y mostrar cada fila que tiene de esa carta (variante, idioma, estado, ubicación, cantidad y cuántas son personales). Cada fila SHALL tener un botón "−1" que quite una copia de esa fila exacta, con el mismo efecto que en Mi inventario, sin depender de los ajustes de la sesión. Cada quita SHALL entrar a la lista de la sesión y SHALL poder deshacerse como una carga. Si la fila queda en cero, SHALL desaparecer de la ficha, y si la carta queda sin copias, SHALL volver a la penumbra.

#### Scenario: Quitar la copia equivocada
- **WHEN** el usuario tiene la #47 en Normal · JA · NM ×2 y en Normal · JA · LP ×1, y toca "−1" en la fila LP
- **THEN** queda Normal · JA · NM ×2, la fila LP desaparece y la lista de la sesión dice "−1 ニャース #047 Normal · JA · LP"

#### Scenario: Deshacer una quita
- **WHEN** el usuario toca "−1" por error y luego "Deshacer"
- **THEN** la copia vuelve a la misma fila
