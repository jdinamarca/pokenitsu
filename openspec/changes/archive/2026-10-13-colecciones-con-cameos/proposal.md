# Proposal

## Why

El usuario colecciona Pokémon (master set de Eevee) y quiere también las cartas donde su Pokémon aparece sin ser el protagonista (cameos). Existe una base comunitaria completa, la **Cameo Pokémon Card Database de RotomAmiti** (3.339 cameos de 767 Pokémon, una pestaña por generación), pero hoy la app solo conoce los cameos que trae la checklist de PokeCottage o los que el usuario agrega a mano. Además, Mis colecciones es la pantalla más cargada de la app (lista lateral, 4 botones de acción siempre visibles, muchos filtros) y no sigue el estilo álbum ya elegido para Pokédex, Expansiones e Ilustradores.

## What Changes

- **Base de cameos**: se importa la base de RotomAmiti (Google Sheets público) a una tabla propia, cruzando cada cameo con la carta del catálogo cuando existe (≈67%); los demás (promos japonesas, jumbos, concursos) quedan como referencia con nombre, expansión y número. Botón para actualizarla; se importa sola la primera vez. Se acredita la fuente.
- **Mis colecciones rediseñada (propuesta del lienzo "Mis colecciones · rediseño con cameos")**:
  - Lista de colecciones como tarjetas con portada, avance de **Cartas** y de **Cameos**, y valor.
  - Buscador **"¿En qué cartas aparece…?"** para ver los cameos de cualquier Pokémon, con opción de crear su colección.
  - Detalle con encabezado fijo, pestañas **Cartas** y **Cameos**, y un menú "⋯" con las acciones (editar, carta a mano, checklist, buscar japonesas, borrar).
  - Pestaña Cartas: resumen, una fila de filtros (Todas / Tengo / Me faltan, Por año / Por región, Filtros) y la grilla.
  - Pestaña **Cameos**: los cameos del Pokémon (base de RotomAmiti más los cameos propios de la colección), en color los que tienes y en blanco y negro los que no, filtro por **cómo aparece** (personaje, silueta, disfraz, dibujo, peluche…) y la sección de cameos sin carta en el catálogo.

**Fuera del alcance:** cameos de entrenadores (pestaña "Trainers" de la base), editar la base de cameos dentro de la app, y precios de los cameos que no están en el catálogo.

**Datos del usuario:** las colecciones, sus cartas y sus cameos propios no cambian. La base de cameos es catálogo compartido (como las expansiones).

## Capabilities

### New Capabilities

- `cameos`: base de cameos por Pokémon importada de RotomAmiti, cruzada con el catálogo, con actualización y búsqueda por Pokémon.

### Modified Capabilities

- `colecciones`: rediseño en álbum con pestañas Cartas y Cameos, menú de acciones y buscador de cameos.

## Impact

- **Base de datos:** migración con la tabla `cameo_refs`.
- **API:** `apps/api/src/cameos.js` (descarga y cruce), rutas `GET /api/cameos?dex=`, `POST /api/cameos/sync`, `GET /api/cameos/status`.
- **Front:** pestaña Mis colecciones reescrita en su presentación; reutiliza toda la lógica actual de slots, checklist, valor y precios.
