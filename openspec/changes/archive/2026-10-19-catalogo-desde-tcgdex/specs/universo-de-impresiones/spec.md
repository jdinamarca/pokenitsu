## ADDED Requirements

### Requirement: Impresiones de las expansiones que solo tiene TCGdex
Las impresiones de una expansión `tcgdex-en` SHALL quedar en esa expansión y enlazadas a su carta. Las de TCGdex SHALL cruzar por su identificador. Las de PokeCottage SHALL cruzar por el identificador cuando es el mismo, y si no, por el nombre, leyendo "<serie> Trainer Kit: <Pokémon> Half Deck" como "<serie> trainer Kit (<Pokémon>)".

#### Scenario: Eevee del kit de Sylveon
- **WHEN** se trae el Full de Eevee, con la #13 del kit en TCGdex (`tk-xy-sy`) y en PokeCottage (`tk6b`, sello "Sylveon Deck")
- **THEN** la #13 en inglés está en "XY trainer Kit (Sylveon)", enlazada a `td-tk-xy-sy-13`, con TCGdex y PokeCottage detrás, y no existen impresiones `td:tk-xy-sy` ni `pc:tk6b`
