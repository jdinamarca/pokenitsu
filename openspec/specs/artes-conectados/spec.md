# artes-conectados Specification

## Purpose
Seguir grupos de cartas cuyas ilustraciones se unen en una imagen más grande, para coleccionarlos o venderlos como kit.

## Requirements

### Requirement: Grupos de cartas
El sistema SHALL permitir crear, editar y borrar grupos con nombre y lista de cartas escrita como `<expansión> <números>` por línea, aceptando rangos (`N2 20 32 38`, `30C 130-133`), validando que cada carta exista.

#### Scenario: Número inexistente
- **WHEN** una línea trae un número que no existe en esa expansión
- **THEN** el sistema lo informa y no guarda esa carta

### Requirement: Progreso del grupo
Cada grupo SHALL mostrar sus piezas, cuáles se tienen ("falta" en las que no) y el progreso, contando todos los idiomas o uno elegido.

#### Scenario: Pieza tenida
- **WHEN** el usuario tiene 1 de 3 cartas del grupo
- **THEN** se muestra 1/3 piezas y las otras dos en gris con "falta"

### Requirement: Imagen del arte unido
El sistema SHALL permitir subir o enlazar una imagen de cómo se ve el arte completo y mostrarla junto al grupo.

#### Scenario: Subir imagen
- **WHEN** el usuario sube una foto del arte unido
- **THEN** se guarda en `public/art/` y se muestra en el grupo
