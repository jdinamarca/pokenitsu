# Spec Delta

## ADDED Requirements

### Requirement: Espacios por variante
En una colección, cada variante de la lista compartida de una carta SHALL ser un espacio, y una carta sin variantes en su lista SHALL ser un solo espacio. Un espacio SHALL verse en color si el usuario tiene al menos una copia de esa variante (con las reglas de idioma de la colección), o en gris si no. El progreso de la colección SHALL contar los espacios (variantes) y las cartas. "+1" en un espacio SHALL sumar una copia de esa carta en esa variante.

#### Scenario: Una variante que no tengo
- **WHEN** la Eevee de 151 tiene en su lista Normal, Reverse y Sello snowflake, y el usuario tiene solo copias normales
- **THEN** la colección muestra tres espacios de esa carta: Normal en color y los otros dos en gris

#### Scenario: Sumar una copia de una variante con sello
- **WHEN** el usuario toca "+1" en el espacio "Normal · Battle Academy · Charizard #12"
- **THEN** su inventario suma una copia de esa carta en esa variante, y el espacio queda en color

### Requirement: Botón Variantes en la grilla
Cada carta de la grilla de una colección SHALL tener un botón "Variantes" que abre una ventanita con la lista de variantes de la carta, con la fuente de cada una (TCGdex, TCGplayer o el dueño). Para el dueño, la ventanita SHALL permitir quitar variantes y agregar una eligiendo el acabado y el sello o producto; si es Battle Academy, también el mazo y el número en el mazo, y siempre una nota opcional. Para las demás cuentas, la ventanita SHALL mostrar la lista sin controles de edición.

#### Scenario: El dueño agrega una variante de Battle Academy
- **WHEN** el dueño abre "Variantes" de una Eevee, elige Normal, Battle Academy, mazo Charizard, número 12, y toca Agregar
- **THEN** la ventanita y la grilla muestran el espacio nuevo "Normal · Battle Academy · Charizard #12"

#### Scenario: Una cuenta de tester abre Variantes
- **WHEN** una cuenta que no es la del dueño abre "Variantes" de una carta
- **THEN** ve la lista con sus fuentes, sin botones para quitar ni agregar
