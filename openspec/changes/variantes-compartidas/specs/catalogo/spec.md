# Spec Delta

## ADDED Requirements

### Requirement: Lista compartida de variantes de cada carta
El catálogo SHALL guardar para cada carta una lista de variantes, la misma para todas las cuentas. Cada variante SHALL tener un acabado, un sello o producto opcional, un mazo y un número en el mazo cuando es de Battle Academy, una nota opcional, un identificador y una etiqueta legible. Dos variantes de la misma carta MUST NOT tener el mismo identificador.

#### Scenario: Variante de Battle Academy
- **WHEN** la lista de una carta tiene una variante normal del mazo Charizard de Battle Academy con el número 12
- **THEN** su etiqueta dice "Normal · Battle Academy · Charizard #12" y su identificador es distinto del de la normal sin sello

### Requirement: Variantes sugeridas por las fuentes
Mientras el dueño no haya revisado una carta, su lista SHALL armarse con las variantes que dan TCGdex (acabado, foil, sellos y tamaño) y TCGplayer (normal, holo, reverse y 1st Edition), y cada variante SHALL indicar qué fuentes la dan. Una impresión que las dos fuentes nombran distinto SHALL contarse una sola vez: el holo de TCGplayer y el holo cosmos de TCGdex de una promo son la misma variante, y también el normal de TCGdex y el holo de TCGplayer de una carta que solo tiene esa impresión.

#### Scenario: Reverse que solo da TCGplayer
- **WHEN** se arma la lista de Dark Explorers #83 y TCGdex da solo normal y TCGplayer da normal y reverse
- **THEN** la lista tiene Normal (TCGdex y TCGplayer) y Reverse (TCGplayer)

#### Scenario: Promo cosmos
- **WHEN** se arma la lista de la promo SWSH042, que TCGdex da como holo cosmos y TCGplayer como holo
- **THEN** la lista tiene una sola variante, Holo cosmos, con las dos fuentes

### Requirement: Solo el dueño edita las variantes
Solo la cuenta del dueño SHALL poder agregar o quitar variantes de una carta. Para las demás cuentas, la API MUST responder 403. Cuando el dueño cambia la lista de una carta, la carta SHALL quedar revisada, y su lista MUST NOT volver a cambiar por las sugerencias. Una variante quitada que tiene copias en el inventario de alguna cuenta MUST NOT borrar esas copias.

#### Scenario: Una cuenta que no es el dueño intenta agregar
- **WHEN** una cuenta de tester pide agregar una variante a una carta
- **THEN** la API responde 403 y la lista no cambia

#### Scenario: Quitar una sugerencia equivocada
- **WHEN** el dueño quita una variante sugerida de una carta
- **THEN** la variante desaparece de la lista para todas las cuentas y no vuelve a aparecer aunque se vuelvan a pedir las sugerencias
