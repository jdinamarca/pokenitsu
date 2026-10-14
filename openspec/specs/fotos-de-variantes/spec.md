# fotos-de-variantes Specification

## Purpose
Mostrar la foto correcta de cada variante cuando la del catálogo no corresponde.

## Requirements

### Requirement: Foto propia por variante
El sistema SHALL permitir fijar para una carta + variante un link o una foto subida (guardada en `public/art/`, tabla `variant_images`), desde la ficha de la carta en Mi colección o con 📷 en la vista previa de Cargar, y quitarla para volver a la del catálogo.

#### Scenario: Eevee de Jungle Unlimited
- **WHEN** el usuario sube la foto de su Eevee Unlimited
- **THEN** esa variante muestra su foto en todas las vistas

### Requirement: Foto propia desde la vista previa y la cámara
Cuando la carta de la vista previa no tiene foto real, la vista previa SHALL ofrecer "Tomar o subir la foto de tu carta". En pantallas táctiles el diálogo de foto SHALL ofrecer tomarla con la cámara. Las fotos de más de 1200 px SHALL achicarse en el navegador antes de subirse.

#### Scenario: Foto con el celular
- **WHEN** en el celular el usuario toca "Tomar o subir la foto de tu carta" y luego "Tomar foto"
- **THEN** se abre la cámara y la foto queda guardada para esa carta y variante
