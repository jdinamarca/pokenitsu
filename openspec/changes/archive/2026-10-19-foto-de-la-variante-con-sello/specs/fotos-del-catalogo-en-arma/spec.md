## MODIFIED Requirements

### Requirement: Qué foto muestra una carta del catálogo
En Cargar y en Mi inventario, cada carta SHALL mostrar la primera foto que tenga, en este orden:
1. la foto que la cuenta puso a esa variante;
2. si la variante tiene sello, la foto de su impresión del Full con ese sello, primero en el idioma de la copia (en Cargar, el de la sesión) y si no en inglés para una expansión internacional;
3. la foto propia de la carta, o la propia de su impresión del Full;
4. la foto del catálogo;
5. la foto solo local de la carta (solo con `ARMA_FOTOS_LOCALES=1`): la de su impresión del Full, si no la de Limitless TCG, si no la de PokeCottage y, si no, la de Bill's Archive;
6. la foto de referencia del mismo Pokémon.

En Cargar, la variante SHALL ser la marcada en la ficha; en Mi inventario, la de la copia.

La impresión del Full de una carta SHALL ser una que apunte a esa carta y esté en su mismo idioma: una impresión taiwanesa ligada a una carta japonesa MUST NOT darle su foto. Para la foto de la carta se prefiere la impresión sin sello y normal. Una foto marcada como de otra variante MUST NOT usarse.

Una foto solo local SHALL verse con la marca violeta de "solo uso local" en la carta, y con la nota "Foto solo para uso local · {fuente}" en la ficha. Sin el interruptor, las fotos solo locales MUST NOT entregarse ni servirse, y la carta pasa a la siguiente foto de la lista.

#### Scenario: Japonesa sin foto del catálogo
- **WHEN** el interruptor está encendido y una carta de VMAX Climax (S8b) no tiene foto en el catálogo, pero sí de Limitless
- **THEN** Cargar la muestra con la foto de Limitless y la marca violeta

#### Scenario: La foto de la impresión del Full
- **WHEN** el interruptor está encendido y la Eevee de Pokémon Jungle japonesa (#037) no tiene foto en el catálogo, pero su impresión del Full tiene la de PokeCottage
- **THEN** Cargar la muestra con esa foto y la marca violeta, no con la foto de referencia

#### Scenario: La variante con sello muestra su foto
- **WHEN** el interruptor está encendido, el usuario abre Ultra Prism #104 en Cargar y marca "Trainer Kit Sun & Moon · Mazo Alolan Ninetales #26"
- **THEN** la ficha muestra la foto de PokeCottage con el círculo 26 y la marca violeta, y al marcar Normal vuelve la foto del catálogo

#### Scenario: La copia con sello en Mi inventario
- **WHEN** el interruptor está encendido y el inventario tiene una copia en español de esa variante, que solo tiene foto en inglés
- **THEN** la copia se muestra con la foto en inglés con el círculo 26, y una copia Normal de la misma carta con la foto del catálogo

#### Scenario: Interruptor apagado
- **WHEN** la app corre sin `ARMA_FOTOS_LOCALES=1`
- **THEN** esa carta se muestra con la foto de referencia o sin foto, y el archivo de Limitless responde 404

#### Scenario: Una foto propia gana
- **WHEN** el administrador sube su foto de una carta que tenía foto de Limitless
- **THEN** la carta se muestra con la foto propia, sin marca violeta, para todas las cuentas
