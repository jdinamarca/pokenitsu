# Tasks

## 1. Base de cameos

- [x] 1.1 Migración `cameo_refs` y `apps/api/src/cameos.js` (descarga de las pestañas, validación de encabezados, cruce con el catálogo, reemplazo en una transacción); verificar que importa ~3.300 cameos y cruza ~2.250, y que XY Promos 176 y Crown Zenith GG61 se enlazan
- [x] 1.2 Rutas `GET /api/cameos?dex=`, `POST /api/cameos/sync`, `GET /api/cameos/status` e importación automática si la tabla está vacía; verificar con curl los cameos de Eevee (#133)

## 2. Lista de colecciones

- [x] 2.1 Tarjetas de colección (portada, avance de Cartas y Cameos, valor), nueva colección y buscador "¿En qué cartas aparece…?"; verificar en Chrome sin interfaz con la colección Eevee y buscando Snorlax

## 3. Detalle

- [x] 3.1 Encabezado fijo con volver, pestañas Cartas / Cameos y menú "⋯" con las acciones existentes (borrar con confirmación); verificar cada acción y "Borrar cancelado"
- [x] 3.2 Pestaña Cartas con resumen, filtros principales a la vista y secundarios en Filtros, reutilizando la grilla actual; verificar que los números (11/434, valor) son los mismos que antes
- [x] 3.3 Pestaña Cameos: base + cameos propios sin duplicar, tenidos en color, filtros todos / tengo / me faltan y cómo aparece, sección de referencias y crédito; verificar los escenarios "Cameo que tengo" (con una copia de prueba que se borra) y "Filtrar por silueta"

## 4. Documentación

- [x] 4.1 Actualizar README (Mis colecciones y cameos, fuente y actualización) y verificar que lo describe

## Workflow follow-up

- Archivar el cambio con `/opsx:archive` cuando el usuario lo apruebe.
