# Spec Delta

## ADDED Requirements

### Requirement: La foto calza con la variante
La Vitrina y la ficha SHALL mostrar, para cada impresión, una foto que muestre su variante, en este orden: una foto propia subida, una foto con permiso y una foto solo local. Si ninguna calza, SHALL mostrar la foto de otra variante de la misma carta, atenuada y, en la ficha, con la nota "Foto de \<variante\> · falta esta variante". Una impresión MUST NOT mostrar como propia una foto de otra variante.

#### Scenario: Team Rocket #55 unlimited sin foto propia
- **WHEN** Team Rocket #55 unlimited solo tiene la foto compartida con la 1st Edition
- **THEN** la vitrina la muestra atenuada y la ficha dice "Foto de la 1st Edition · falta esta variante"

#### Scenario: La 1st Edition con su foto
- **WHEN** se mira la Jungle #51 1st Edition
- **THEN** muestra la foto compartida, sin nota ni atenuación

### Requirement: Marcar y subir desde la ficha
La ficha SHALL permitir, para la foto que se muestra, marcar qué variante muestra (entre las variantes de la misma carta) y subir o quitar la foto propia de la impresión. Los cambios SHALL verse en la vitrina sin recargar la página.

#### Scenario: Corregir una foto
- **WHEN** el usuario marca en la ficha que la foto de Gym Challenge #51 unlimited muestra la 1st Edition
- **THEN** la unlimited pasa a mostrar la nota "Foto de la 1st Edition · falta esta variante", y la 1st Edition sigue mostrándola como propia
