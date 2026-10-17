## MODIFIED Requirements

### Requirement: Bajar las fotos locales del catálogo japonés
Con las fotos locales encendidas, la galería SHALL ofrecer al administrador "Bajar fotos locales del catálogo japonés". Esto SHALL bajar, en dos pasos, las fotos de las cartas japonesas sin foto:
1. de Limitless TCG, por expansión;
2. de PokeCottage, por Pokémon, para las que sigan sin foto.

La galería SHALL mostrar el avance:
- el paso en curso;
- las expansiones o Pokémon revisados;
- las fotos bajadas;
- las que la fuente no tiene;
- las que fallaron;
- si PokeCottage pidió esperar o si la descarga se detuvo por fallas.

Pedirlo otra vez mientras corre SHALL mostrar el avance en curso y MUST NOT empezar otra descarga. Con las fotos locales apagadas, la galería SHALL decir que hay que encenderlas (`ARMA_FOTOS_LOCALES=1`) y MUST NOT ofrecer la descarga.

#### Scenario: Bajar todo
- **WHEN** el administrador pide bajar las fotos del catálogo japonés
- **THEN** ve el avance de Limitless por expansión y después el de PokeCottage por Pokémon y, al terminar, las cartas nuevas aparecen en la galería con su fuente (Limitless TCG o PokeCottage)

#### Scenario: Se detuvo
- **WHEN** PokeCottage falla varias veces seguidas
- **THEN** la galería dice que la descarga se detuvo y, al pedirla otra vez, sigue con lo que faltaba sin repetir lo ya bajado
