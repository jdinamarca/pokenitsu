# fotos-de-variantes Specification

## Purpose
Mostrar la foto correcta de cada variante cuando la del catálogo no corresponde.

## Requirements

### Requirement: Foto propia por variante
El sistema SHALL permitir fijar para una carta + variante un link o una foto subida (guardada en `public/art/`, tabla `variant_images`), desde la ficha de la carta en Mi colección o con 📷 en la vista previa de Cargar, y quitarla para volver a la del catálogo.

#### Scenario: Eevee de Jungle Unlimited
- **WHEN** el usuario sube la foto de su Eevee Unlimited
- **THEN** esa variante muestra su foto en todas las vistas

### Requirement: Foto de la checklist para variantes especiales
Las variantes especiales de una checklist (1st Edition, Poké Ball, misprints…) SHALL usar la foto de la checklist; normal, holo y reverse mantienen la del catálogo salvo foto propia.

#### Scenario: 1st Edition sin foto propia
- **WHEN** una copia es `firstedition` y la checklist tiene foto de esa variante
- **THEN** se muestra la foto de la checklist
