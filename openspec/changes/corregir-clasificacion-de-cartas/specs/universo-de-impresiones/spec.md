# Spec Delta

## ADDED Requirements

### Requirement: Correcciones de clasificación al fusionar fuentes
Al fusionar las fuentes, el sistema SHALL tratar como holo cosmos una holo genérica (pokemontcg.io, TCGplayer, o TCGdex sin tipo de brillo) cuando una fuente específica (PokeCottage, o TCGdex con tipo de brillo) dice holo cosmos para la misma carta y ninguna fuente específica dice holo normal. SHALL poner en japonés las expansiones `jpn_*` de PokeCottage y en chino simplificado las `scn_*`. SHALL tratar como un solo sello dos nombres de sello de la misma carta y acabado cuando el de TCGdex es el final del de PokeCottage, y quedarse con el más completo.

#### Scenario: Wizards Promo #11 holo
- **WHEN** pokemontcg.io dice "Holo" y TCGdex, PokeCottage y TCGplayer dicen "Holo cosmos" para la Eevee Wizards Promo #11 inglesa
- **THEN** hay una sola impresión, holo cosmos, con las cuatro fuentes

#### Scenario: Promo japonesa marcada como International
- **WHEN** PokeCottage trae `jpn_unp-157` (JR East Rally 2000) con región "International"
- **THEN** la impresión queda en japonés, en las promos japonesas sin número

### Requirement: Sellos exclusivos de Japón
El sistema SHALL tener una lista de sellos exclusivos de Japón (JR Stamp Rally, también llamado JR East Rally 2000). Un dato que pone uno de esos sellos en una carta en idioma occidental MUST NOT crear una impresión: SHALL descartarse y contarse en el resumen de la importación como mal catalogado.

#### Scenario: JR Stamp Rally en la Wizards Promo #11
- **WHEN** TCGdex dice que la carta inglesa `basep-11` tiene una variante con el sello JR Stamp Rally
- **THEN** no existe la impresión "Wizards Black Star Promos #11 · Inglés · JR Stamp Rally", y el resumen de TCGdex cuenta 1 dato mal catalogado

### Requirement: Revisión de clasificación
El sistema SHALL marcar como "por verificar" cada impresión dudosa, con todos sus motivos:
- **región:** un sello exclusivo de Japón en un idioma occidental, una expansión japonesa en un idioma occidental o una expansión occidental en japonés;
- **acabado:** la misma carta sin sello como holo y como holo cosmos;
- **una sola fuente:** solo una fuente dice que existe y al menos otra conoce la carta;
- **sin nombre:** la variante solo tiene un código.

La revisión SHALL poder consultarse con `GET /api/audit/:dex` y SHALL venir en el Full.

#### Scenario: Variante sin nombre
- **WHEN** PokeCottage registra EX Unseen Forces #55 con la variante "X6M-1TY-0F6"
- **THEN** esa impresión aparece por verificar con el motivo "sin nombre"
