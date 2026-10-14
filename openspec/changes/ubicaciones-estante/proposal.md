# Proposal

## Why

La pestaña Ubicaciones era un bloque largo de texto ("Orden sugerido") seguido de tarjetas iguales con la regla escrita en prosa técnica y cinco botones cada una; las cajas vacías se veían igual que las llenas. El usuario pidió una mejor UX, "quizás más animado". En el canvas eligió la dirección **P · Estante**.

## What Changes

- **Estante**: las ubicaciones se dibujan como objetos reales sobre repisas: las carpetas de pie (lomo de color con el nombre y la cantidad) y las cajas acostadas con tapa y etiqueta (nombre, cartas y valor). Otras ubicaciones se dibujan como caja.
- Dos repisas: **con cartas** y **vacías por ahora** (apagadas). Dentro de cada repisa se mantiene el orden de la lista.
- **Animación**: al pasar el mouse (solo con mouse), la carpeta se inclina y la tapa de la caja se levanta, y asoman hasta 3 de sus cartas más valiosas. Las ubicaciones entran escalonadas al abrir la pestaña.
- **Detalle**: al tocar una ubicación queda seleccionada (subrayada y abierta) y a la derecha se ve su detalle:
  - tipo y posición en la lista;
  - cartas, expansiones y valor;
  - miniaturas de sus cartas;
  - lo que recibe en chips en lenguaje de coleccionista (💰 Para vender, Challa, Mega Evolution, 🌎 Internacionales…), con la regla completa al pasar el mouse;
  - avisos ⚠️ de reglas superpuestas y la nota;
  - acciones: Ver las N cartas, Editar, ↑, ↓ y Borrar.
- **¿Cómo decide?**: el texto del orden sugerido y de "gana la más específica" pasa a un desplegable cerrado; se abre solo cuando aún no hay ubicaciones.
- En el celular, el detalle va debajo del estante.
- Con "reducir movimiento", nada se mueve: no hay inclinación, tapa ni entrada escalonada.
- Funciona en tema claro y oscuro.

**Sin cambios:** reglas, asignación automática, formulario de edición, API y datos.

## Capabilities

### New Capabilities
<!-- Ninguna. -->

### Modified Capabilities
- `ubicaciones`: nueva presentación en estante con detalle de la ubicación elegida.

## Impact

- `apps/web/public/index.html` (CSS, marcado de la pestaña y `renderLocations`), README.
