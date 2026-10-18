# Proposal

## Why

El usuario revisó Ilustradores (#89) y pidió dos ajustes:

- **Al pasar el mouse sobre un ilustrador**, prefiere que la ilustración de una de sus cartas quede de fondo dentro de la tarjeta, en vez de que la carta salga por el costado.
- **En la galería**, las cartas de repisas vecinas quedan desalineadas. El encabezado de cada repisa (nombre, código, año y avance) a veces ocupa una línea y a veces dos, según el largo del nombre, y eso baja las cartas de esa repisa.

## What Changes

- **Portada de fondo.** Al pasar el mouse o enfocar una tarjeta, la ilustración de su carta de portada llena la tarjeta de fondo, recortada a la ilustración, con un velo oscuro para que el nombre se siga leyendo. El nombre, los años y el anillo pasan a tonos claros. La imagen se sigue pidiendo solo en ese momento. En pantallas sin hover se mantiene la miniatura al lado del nombre. Con "reducir movimiento", el fondo aparece sin zoom.
- **Encabezado de repisa de alto fijo.** Siempre ocupa dos líneas: el nombre de la expansión en una línea (si no cabe se corta con "…", y el nombre completo aparece al pasar el mouse) y, debajo, el código, el año y "tengo / total". Así, todas las repisas de una fila empiezan sus cartas a la misma altura. Vale para la galería de un ilustrador y para la de un Pokémon, que comparten el componente.

## Capabilities

### New Capabilities
(ninguna)

### Modified Capabilities
- `ilustradores-en-arma`: cambian "Portada al pasar el mouse" (ahora de fondo en la tarjeta) y "Galería de un ilustrador" (el encabezado de la repisa en dos líneas fijas).

## Impact

- Solo el front de Arma: `Ilustradores.tsx`, `components/Gallery.tsx` y `styles.css`. Sin cambios en la API ni en los datos.
- Documentación: `apps/arma/DESIGN.md` y README.
