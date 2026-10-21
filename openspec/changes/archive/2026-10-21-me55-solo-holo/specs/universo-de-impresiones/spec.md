## ADDED Requirements

### Requirement: Expansiones holo completas
En una expansión donde todas las cartas son holo (30th Celebration, `me55`), una impresión que una fuente registra como «normal» y sin sello SHALL contarse como la holo de esa carta, o como su holo cosmos si la fuente que nombra la holo solo tiene cosmos. El Full MUST NOT mostrar impresiones «normal» de esas expansiones.

#### Scenario: Eevee 118 de 30th Celebration
- **WHEN** se importa Eevee y pokemontcg.io y TCGdex registran la me55 118 como normal, mientras PokeCottage la registra como holo
- **THEN** el Full tiene una sola impresión inglesa de la 118, holo, respaldada por las tres fuentes

#### Scenario: Otros idiomas
- **WHEN** TCGdex registra la me55 118 en alemán como normal
- **THEN** el Full la muestra en alemán como holo

#### Scenario: Holo y cosmos
- **WHEN** PokeCottage registra la me55 116 en holo y en holo cosmos, y TCGdex como normal
- **THEN** el Full tiene la holo y la cosmos, y ninguna normal
