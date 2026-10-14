## 1. API y datos

- [x] 1.1 Borrar `pokecottage.js`, las rutas de fotos japonesas y de checklist, y `POKECOTTAGE_IMAGES`
- [x] 1.2 `variantImages` sin las fotos de checklist; `catalog.js` sin la fuente `pokecottage`
- [x] 1.3 Migración `030_sin_pokecottage.sql`: links, colecciones con checklist, cartas y expansiones `pc-*` sin uso, tabla `pokecottage_checks`

## 2. Front

- [x] 2.1 Quitar el campo de checklist al crear, los botones de checklist, la búsqueda de fotos japonesas y los textos de PokeCottage
- [x] 2.2 `VIMG` sin `checklist`
- [x] 2.3 Imagen de referencia atenuada en las cartas de Mis colecciones sin foto

## 3. Verificación y docs

- [x] 3.1 Respaldo de la base local antes de migrar
- [x] 3.2 Probar sobre una copia: la migración deja 0 datos de PokeCottage, el inventario intacto (32/33), Eevee como colección normal, Cargar con una expansión japonesa sin pedir fotos, colecciones sin opciones de checklist y sin errores de JS
- [x] 3.3 README sin PokeCottage
