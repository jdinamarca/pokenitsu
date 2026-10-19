## ADDED Requirements

### Requirement: Cartas del Trainer Kit Sun & Moon de Alolan Sandslash y Alolan Ninetales
El sistema SHALL representar una carta de ese kit como la carta original (expansión y número) con el sello del mazo y su número, `tk-sm-<mazo>-<número>`, llamada "Trainer Kit Sun & Moon · Mazo <mazo> #<número>". Lo que PokeCottage traiga como expansión del kit (`tk11a`, `tk11b`) con el número del mazo SHALL convertirse a esa impresión.

#### Scenario: La Eevee del mazo Alolan Ninetales
- **WHEN** Bulbapedia lista a Eevee de Ultra Prism 104/156 como la carta 26 del mazo Alolan Ninetales, y PokeCottage trae a Eevee como `tk11a` #26
- **THEN** el Full de Eevee tiene Ultra Prism #104 en inglés con el sello `tk-sm-alolan-ninetales-26`, llamada "Trainer Kit Sun & Moon · Mazo Alolan Ninetales #26", respaldada por las dos fuentes, y ninguna impresión con la expansión `pc:tk11a`

#### Scenario: Cargarla
- **WHEN** el usuario abre Ultra Prism en Cargar y elige la #104
- **THEN** entre las fichas de variante está "Trainer Kit Sun & Moon · Mazo Alolan Ninetales #26", y cargarla suma una copia de esa impresión al Master Set de Eevee

### Requirement: Acabado e idiomas de las cartas del Trainer Kit Sun & Moon
El acabado de una carta del kit SHALL ser el que dice la lista de Bulbapedia (holo si dice holofoil; si no, normal), y la impresión SHALL existir en cada idioma en que Bulbapedia dice que salió el kit.

#### Scenario: Otros idiomas del kit
- **WHEN** Bulbapedia dice que el kit salió en inglés, alemán, francés, italiano, español y portugués
- **THEN** el Full de Eevee tiene esa impresión en esos seis idiomas, y las que solo respalda Bulbapedia quedan "Por verificar"

#### Scenario: La misma promo en dos acabados
- **WHEN** la lista trae a Alolan Ninetales SM128 como la carta 17 "Non Holofoil" y la 30 "Water Web Holofoil"
- **THEN** son dos impresiones de SM Promo SM128: `tk-sm-alolan-ninetales-17` normal y `tk-sm-alolan-ninetales-30` holo
