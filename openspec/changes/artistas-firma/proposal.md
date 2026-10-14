# Proposal

## Why

La pestaña Artistas se veía desordenada y pixelada: cada tarjeta mostraba la miniatura de una carta (245 px) ampliada 1,55× a todo el ancho, y 60 artes distintos competían entre sí mientras el nombre y el avance quedaban chicos abajo. El usuario eligió la dirección G "Firma" del canvas.

## What Changes

- Cada ilustrador es una tarjeta "firma": iniciales en un círculo con un color propio (estable por nombre, para tema claro y oscuro), nombre (hasta dos líneas), cuántas cartas tiene en el catálogo, barra de avance, cuántas tienes y la insignia de tu mejor nivel.
- Al pasar el mouse (o enfocar con teclado), una carta suya aparece de fondo **en alta resolución**, con un velo oscuro para leer el texto; la imagen se carga solo en ese momento (antes se cargaban 60 portadas al abrir la pestaña).
- En pantallas táctiles (sin hover), una miniatura nítida a tamaño real en lugar de las iniciales.
- `bigImg()` también da la versión grande de las fotos de PokeCottage (`__thumb` → `__large`), lo que mejora además la vista previa de Cargar.

**Fuera del alcance:** el detalle de un ilustrador; datos. Datos del usuario: no se tocan.

## Capabilities

### New Capabilities
<!-- Ninguna. -->

### Modified Capabilities
- `ilustradores`: cómo se presenta cada ilustrador en la lista.

## Impact

- `apps/web/public/index.html` (tarjeta, estilos, carga de la imagen al pasar el mouse, `bigImg`); README.
