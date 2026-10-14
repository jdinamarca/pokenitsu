# Proposal

## Why

Le pedimos permiso a PokeCottage para usar sus checklists y fotos con los testers de la alfa. Respondió que no lo da, **ni siquiera para herramientas privadas**, porque no puede controlar adónde terminan sus datos. Hay que respetarlo antes de desplegar: la copia de la base a producción llevaría sus datos.

En la base local había:
- **665** cartas con foto enlazada a su CDN;
- **83** expansiones `pc-*` (163 cartas) creadas desde sus listas;
- **1** colección (Eevee) que seguía su checklist, con las fotos de las variantes especiales.

Ninguna carta del inventario usaba sus fotos.

## What Changes

- **Se quita la integración:**
  - `apps/api/src/pokecottage.js`;
  - `POST /api/sets/:id/photos` (fotos japonesas) y `POST/DELETE /api/collections/:id/checklist` (seguir una checklist);
  - `POKECOTTAGE_IMAGES`;
  - la foto "de la checklist" para variantes especiales (`vimg.checklist`).
- **Migración `030` (corre en cualquier base, también en la copia a producción):**
  - borra los links a `pokecottagecdn.com` de las cartas y de las variantes de las colecciones;
  - las colecciones dejan de seguir checklists y quedan como colecciones normales (todas las cartas con su número de Pokédex);
  - borra las cartas `pc-*` que nada usa y las expansiones `pc-*` que quedan vacías;
  - borra la tabla `pokecottage_checks`.
  - Lo que sí esté en uso (inventario, lotes, artes conectados, colecciones a mano) se conserva sin foto.
- **Front:**
  - sin el campo "Checklist de PokeCottage" al crear una colección;
  - sin los botones Seguir / Actualizar / Dejar de seguir la checklist;
  - sin la búsqueda de fotos japonesas;
  - sin los textos que la mencionan.
  - Las cartas sin foto muestran la imagen de referencia del mismo Pokémon, atenuada, ahora también en Mis colecciones (antes solo en Cargar), donde muchas japonesas antiguas se quedaban en blanco al perder la foto.
- README sin las secciones de PokeCottage. `.env` local: quitar `POKECOTTAGE_IMAGES`.

**Fuera del alcance:**
- Los nombres en inglés de las expansiones japonesas (`ja-sets.json`), compilados en su mayoría desde sus checklists, se resuelven aparte con el usuario.
- La base de imágenes propia, que reemplaza las fotos, va en un cambio siguiente.

## Capabilities

### New Capabilities
<!-- Ninguna. -->

### Modified Capabilities
- `catalogo`: ya no hay expansiones de PokeCottage.
- `colecciones`: sin seguir checklists.
- `fotos-de-variantes`: sin fotos de PokeCottage ni de checklists.
- `datos-por-usuario`: los datos compartidos ya no incluyen checklists.
- `carga-de-cartas`: la imagen de referencia también en Mis colecciones.

## Impact

- `apps/api/src/pokecottage.js` (se borra), `apps/api/src/index.js`, `apps/api/src/catalog.js`, migración `030_sin_pokecottage.sql`.
- `apps/web/public/index.html`, README.
