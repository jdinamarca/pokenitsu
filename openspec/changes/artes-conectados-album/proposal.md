# Proposal

## Why

Artes conectados muestra los 28 grupos del usuario como paneles enormes uno debajo del otro: no hay vista general, las piezas aparecen separadas aunque la gracia es que se unen, Editar y Borrar están en cada grupo, no hay orden ni filtros, y no se ve cuánto vale un grupo aunque el usuario los vende como kits. Crear un grupo exige escribir códigos sin ver el resultado.

## What Changes

- **Álbum de grupos**: grilla de tarjetas (como Ilustradores) cuya portada es el panorama: las piezas **juntas, sin espacios**, en sus columnas, formando la imagen; las que faltan en blanco y negro. Cada tarjeta muestra piezas tenidas, valor y costo de lo que falta.
- **Detalle de un grupo**: el panorama en grande, la imagen del arte unido si existe, y cada pieza con su expansión y número, cuántas copias tienes, dónde están guardadas y su precio.
- **Orden, filtros y resumen**: Todos / Completos / Me faltan; orden por más cerca de completar, valor, costo de lo que falta o nombre; filtros de idioma y serie; resumen "28 grupos · 1 completo · faltan 60 piezas · ~$X para completarlos".
- **Valor y kits**: valor del grupo (suma de sus piezas en NM), costo de las que faltan, **Crear lote de venta** cuando hay una copia para vender de cada pieza (una por pieza), y **Copiar lista de faltantes**.
- **Crear y editar con vista previa**: en una ventana; mientras escribes las cartas ves el panorama armado y los errores al instante. Borrar pasa a la ventana de edición, con confirmación.
- Los precios de las cartas de los grupos se descargan como los del inventario.

**Fuera del alcance:** elegir piezas tocando cartas de una expansión (se sigue escribiendo `<expansión> <números>`), reordenar piezas arrastrándolas, y grupos con piezas de distintas variantes.

**Datos del usuario:** no cambian; los grupos existentes se ven con el nuevo diseño. Crear un lote solo agrega un lote de venta abierto.

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- `artes-conectados`: álbum con panorama unido, detalle por pieza, orden y filtros, valor y kit para vender, lista de faltantes, y creación con vista previa.

## Impact

- **API:** las cartas de los grupos entran en las cartas cuyo precio se descarga (`/api/prices` y el trabajo de precios).
- **Front:** pestaña Artes conectados reescrita (lista, detalle y ventana de edición). Reutiliza estilos del álbum, `paint()`, precios y la API de lotes.
