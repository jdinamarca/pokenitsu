# Spec Delta

## ADDED Requirements

### Requirement: Qué variante muestra cada foto
Cada foto de una impresión SHALL tener una variante mostrada. Si el usuario marcó a mano qué variante muestra la foto, SHALL valer esa marca. Si no, y la foto es compartida por la impresión sin sello y la 1st Edition de la misma carta (misma expansión, número e idioma), SHALL entenderse que muestra la 1st Edition. Si no se cumple ninguna de las dos, SHALL entenderse que muestra la variante de la impresión que la tiene. Las marcas SHALL guardarse como dato propio, con quién y cuándo las hizo.

#### Scenario: Foto compartida de Jungle #51
- **WHEN** pokemontcg.io da la misma foto a Jungle #51 sin sello y a la 1st Edition
- **THEN** esa foto muestra la 1st Edition

#### Scenario: Marca a mano
- **WHEN** el usuario marca que el escaneo de Bulbapedia de Team Rocket #55 muestra la 1st Edition
- **THEN** esa foto deja de contar como foto de la unlimited

### Requirement: Fotos propias subidas
El usuario SHALL poder subir una foto de una impresión (JPEG, PNG o WebP, hasta 8 MB) y quitarla. La foto SHALL guardarse en el almacenamiento propio (`IMAGE_DIR`) como dato propio de esa impresión y SHALL mostrar la variante de esa impresión.

#### Scenario: Subir la unlimited de Team Rocket #55
- **WHEN** el usuario sube su foto de Team Rocket #55 unlimited
- **THEN** la impresión tiene un dato "foto" de la fuente "Dato propio", y la foto se sirve desde `/img/arma/`

### Requirement: Fotos locales para la variante correcta
Con las fotos solo locales encendidas, el importador de fotos SHALL buscar fotos también para las impresiones que tienen fotos, pero ninguna que muestre su variante.

#### Scenario: Unlimited de Jungle #51
- **WHEN** se piden las fotos locales y Jungle #51 sin sello solo tiene la foto compartida con la 1st Edition
- **THEN** recibe el escaneo de Bulbapedia (`EeveeJungle51.jpg`) como foto solo local
