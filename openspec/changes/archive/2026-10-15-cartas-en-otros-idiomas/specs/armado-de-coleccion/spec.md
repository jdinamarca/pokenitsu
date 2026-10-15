# Spec Delta

## ADDED Requirements

### Requirement: Motivos de idioma en "Por verificar"
La revisión de clasificación SHALL marcar con el motivo "deducida" cada impresión deducida, diciendo de qué expansión y en qué idioma se dedujo. SHALL marcar con el motivo "no salió en este idioma" cada impresión en español de una expansión que WikiDex dice "No distribuida (ES)".

#### Scenario: Deducida
- **WHEN** el usuario abre la ficha de Majestic Dawn #62 en italiano
- **THEN** ve "Deducida: TCGdex lista Alba Suprema en italiano, pero ninguna fuente lista esta carta"

#### Scenario: No distribuida
- **WHEN** una fuente trae Team Rocket #55 en español
- **THEN** queda por verificar con "WikiDex dice que Team Rocket no se distribuyó en español"
