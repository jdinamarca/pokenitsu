# Tasks

## 1. API y datos

- [x] 1.1 Migración `favorite_artists` y rutas `GET/PUT /api/artists/favorites`; verificar con curl marcar, listar y desmarcar, y que las tablas del usuario no cambian
- [x] 1.2 Agregar `img` (portada del catálogo, sin promos ni McDonald's) a `/api/artists`; verificar con curl que Kagemaru Himeno trae una imagen que carga

## 2. Lista de ilustradores

- [x] 2.1 Reescribir la pestaña como lista de tarjetas (portada, nombre, estrella, avance, kit en "Para vender"), con búsqueda, orden, selector de copias, panel de filtros (idioma, serie, niveles, solo favoritos), favoritos primero y "Ver más"; verificar en Chrome sin interfaz orden, búsqueda, copias y filtros
- [x] 2.2 Estrella de favorito en tarjetas y detalle, guardada en la base; verificar el escenario "Marcar favorito" (también tras recargar) y dejar los favoritos como estaban

## 3. Detalle de un ilustrador

- [x] 3.1 Detalle tipo álbum (por año, insignia de nivel, faltantes en blanco y negro, todas / tengo / me faltan, resumen por nivel clicable, aviso de catálogo incompleto); verificar los escenarios "Carta que falta" y "Tocar un nivel"
- [x] 3.2 Kit del ilustrador (copias para vender, cartas distintas, valor) y "Crear lote de venta"; verificar que el lote creado tiene las copias correctas y que el inventario no cambia, y borrar el lote de prueba

## 4. Aviso al cargar

- [x] 4.1 Aviso "⭐ Carta de <ilustrador>, tu ilustrador favorito" al cargar (agrupado en rangos); verificar cargando y deshaciendo una carta de un favorito de prueba

## 5. Documentación

- [x] 5.1 Actualizar README (Ilustradores: álbum, kits, favoritos, filtros) y verificar que lo describe

## Workflow follow-up

- Archivar el cambio con `/opsx:archive` cuando el usuario lo apruebe.
