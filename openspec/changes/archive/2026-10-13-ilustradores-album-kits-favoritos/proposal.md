# Proposal

## Why

La pestaña Artistas funciona, pero es una lista larga de nombres sin imágenes, con filtros y un aviso del catálogo siempre visibles; no se parece al estilo "álbum" que el usuario eligió para la Pokédex y Expansiones. Además los ilustradores son uno de los kits curados que el usuario vende, y hoy la pestaña no ayuda a armarlos ni a seguir a sus ilustradores favoritos.

## What Changes

- **Rediseño estilo Álbum**: la pestaña pasa a llamarse "Ilustradores". Cada ilustrador es una tarjeta con una carta suya como portada (la mejor que tiene el usuario, o una del catálogo), su avance y, en "Para vender", el tamaño y valor de su kit. Búsqueda, orden y selector de copias a la vista; idioma, serie y niveles en un botón Filtros. Se muestran los primeros y un botón "Ver más".
- **Detalle de un ilustrador** como álbum: sus cartas por año, las que tiene en color con la insignia de nivel y las que faltan en blanco y negro; resumen por nivel clicable (como la Pokédex) y filtro todas / tengo / me faltan.
- **Kits por ilustrador**: en el detalle, cuántas copias para vender tiene de ese ilustrador, cuántas cartas distintas y su valor de mercado, con un botón **Crear lote de venta** que arma un lote con ellas.
- **Favoritos**: una estrella para seguir a un ilustrador; los favoritos aparecen primero y al cargar una carta suya la app avisa.
- **Niveles y filtros**: los mismos niveles de carta de la Pokédex (Challa → Dorada/Secreta), filtro por idioma y serie, y qué copias cuentan (todas / para vender / mi colección).

**Fuera del alcance:** ilustradores de cartas japonesas (el catálogo de ilustradores sigue siendo el internacional), fusionar nombres escritos distinto del mismo ilustrador, y kits de varios ilustradores a la vez.

**Datos del usuario:** se agrega una tabla de ilustradores favoritos. El inventario no cambia; crear un lote solo agrega un lote de venta abierto (no descuenta nada hasta cerrarlo).

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- `ilustradores`: la lista y el detalle pasan a ser un álbum con portada, niveles y filtros; se agregan kits por ilustrador con creación de lote y favoritos.

## Impact

- **Base de datos:** migración con la tabla `favorite_artists`.
- **API:** `/api/artists` devuelve también una imagen de portada; rutas para leer, agregar y quitar favoritos.
- **Front:** pestaña Artistas reescrita (lista y detalle), aviso al cargar una carta de un favorito, creación de lote desde el detalle. Reutiliza `cardTier`, los estilos del álbum y la API de lotes.
