# kits-pokedex Specification

## Purpose
Saber cuántos kits de Pokédex por región (una carta por especie) se pueden armar con las copias para vender y qué especies faltan.

## Requirements

### Requirement: Kits por región
Para la región elegida (Kanto #1–#151, Johto, etc.) el sistema SHALL contar, por cada número de Pokédex, las copias para vender de cartas de tipo Pokémon con un solo número de Pokédex, y calcular:
- especies que se tienen / total de la región
- kits completos posibles (el mínimo de copias entre todas las especies)
- especies que faltan para el siguiente kit

Las copias personales no cuentan.

#### Scenario: Una especie sin copias
- **WHEN** falta una especie de Kanto
- **THEN** los kits completos posibles son 0 y esa especie aparece en gris

### Requirement: Filtros de idioma y variante
El sistema SHALL filtrar el conteo por idioma y por variante (todas, solo normal, solo holo/reverse).

#### Scenario: Kits en español
- **WHEN** el usuario elige idioma Español
- **THEN** solo cuentan las copias en español

### Requirement: Detalle por especie
Al tocar una especie el sistema SHALL mostrar las copias que la cubren, con su variante, idioma, rareza y ubicación, y mostrar la carta de referencia (preferentemente la versión simple, ej. Pikachu sobre Pikachu ex) para las especies que no se tienen.

#### Scenario: Buscar una especie en las cajas
- **WHEN** el usuario toca #025
- **THEN** ve todas sus copias de Pikachu para vender y en qué ubicación está cada una
