# Spec Delta

## ADDED Requirements

### Requirement: Cartas en español confirmadas por WikiDex
El sistema SHALL importar de WikiDex, por cada carta del Pokémon, en qué expansión y con qué número salió en español, y la fecha de salida en España de esa expansión o "No distribuida (ES)". Una carta que WikiDex confirma en español SHALL existir en español aunque ninguna otra fuente la liste, con el acabado base de la carta internacional. WikiDex MUST NOT aportar fotos.

#### Scenario: Jungla #51
- **WHEN** WikiDex tiene "Eevee (Jungla TCG)" con expansión Jungla, número 51/64, y Jungla salió en España en 2000
- **THEN** existe la impresión de Jungle #51 en español, con WikiDex como fuente, aunque TCGdex no liste la carta

### Requirement: Impresiones deducidas en italiano y portugués
Cuando TCGdex lista una expansión en italiano o portugués, y una carta de esa expansión existe en su versión internacional sin ninguna fuente que la liste en ese idioma, el sistema SHALL crear la impresión en ese idioma, solo con el acabado base, de la fuente "Expansiones de TCGdex". MUST NOT deducir variantes (sellos, reverse, 1st Edition) ni impresiones en español latinoamericano.

#### Scenario: Majestic Dawn en italiano
- **WHEN** TCGdex lista "Alba Suprema" (dp5) en italiano y no tiene sus cartas
- **THEN** existen Majestic Dawn #62 y #63 en italiano, normales, deducidas

### Requirement: Misma carta con número normalizado
Toda comparación de "la misma carta" (misma expansión, número e idioma) SHALL usar el número normalizado, de modo que `074` y `74` sean el mismo número.

#### Scenario: Evoluciones Prismáticas #74
- **WHEN** una fuente da el número `074` y otra `74` para la misma carta
- **THEN** la ficha muestra sus variantes juntas y la regla de fotos 1st Edition las trata como la misma carta
