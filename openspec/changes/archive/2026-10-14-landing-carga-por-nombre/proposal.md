# Proposal

## Why

La sección "Cómo funciona" de la landing solo muestra la carga por número, pero la app ya permite elegir la expansión y escribir el nombre de la carta (con una lista para elegir) y muestra una vista previa de la carta antes de agregarla. El usuario pidió corregir la sección para que refleje cómo se carga hoy.

## What Changes

- Título y texto: se puede escribir el número **o el nombre** de la carta, y antes de presionar Enter se ve la carta que se va a agregar, con su variante, idioma, estado y ubicación.
- Atajos: se agregan `char` (busca por nombre), `↑ ↓` (elige de la lista) y `Tab` (pasa el número al campo para agregar variante o cantidad).
- Demo animada: además del campo y "Últimas cargas", muestra una **vista previa** con la imagen de la carta pendiente y la línea "Se cargará: …". Un paso escribe `char`, aparece la lista (Charmander, Charmeleon, Charizard ex #006 y #199), baja con ↓ hasta la Charizard ex #199 y la agrega con Enter.
- Imágenes de las cartas de 151 de la demo en `landing/demo-*.webp` (360 px de ancho), servidas desde la propia app.
- Con "reducir movimiento", la demo queda estática mostrando la lista de nombres y la vista previa.

**Fuera del alcance:** cambios en la app o la API. Datos del usuario: no se tocan.

## Capabilities

### New Capabilities
<!-- Ninguna. -->

### Modified Capabilities
- `landing-alfa`: la sección "Cómo funciona" muestra la carga por nombre y la vista previa.

## Impact

- `apps/web/public/landing.html`, `apps/web/public/landing/demo-*.webp`, README.
