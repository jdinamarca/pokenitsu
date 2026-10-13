# Proposal

## Why

Con la fase 1 del login todas las cuentas ven el mismo inventario, así que no se puede invitar a nadie. La fase 2 hace que cada cuenta tenga sus propios datos y que la base impida ver o tocar los de otra (ADR 0010).

## What Changes

- Las tablas con datos de una persona (inventario, registro, ubicaciones, lotes, colecciones, artes conectados, favoritos, precios propios, fotos propias, y la configuración de precios y lotes) pasan a tener dueño (`user_id`) y Row Level Security forzado.
- Los datos actuales pasan a la primera cuenta creada (la del dueño). Si hay datos y ninguna cuenta, la migración se detiene y pide crear la cuenta primero.
- Lo compartido sigue compartido: catálogo, precios de mercado, tipo de cambio, nombres de variantes, checklists, cameos.
- Cada petición usa una conexión con su usuario fijado; las tareas de sistema que deben ver a todos (precios compartidos, ilustradores, limpieza de cartas de checklist) lo piden explícitamente.
- Los nombres de ubicación, las cartas del inventario, los precios propios, las fotos propias y los favoritos son únicos **por cuenta**.
- Se corrige el contador de IDs de ubicaciones, que estaba en 1 con IDs hasta 8 (la próxima ubicación nueva habría fallado con "Ya existe una ubicación con ese nombre").
- Invitar a alguien = agregar su email a `AUTH_ALLOWED_EMAILS`.

**Fuera del alcance:**
- Verificación de correo, recuperar contraseña y Google (fase 3).
- Rol de base de datos aparte para la API en producción (ADR 0018, a revisar al desplegar).
- Fotos subidas en `public/art/`: siguen siendo archivos públicos por URL (sin datos sensibles).
- Front: sin cambios.

**Datos del usuario:** la migración asigna todas las filas existentes a la cuenta del dueño sin modificarlas. Protección: respaldo completo (`pg_dump`) antes, migración probada sobre una copia restaurada de ese respaldo, y conteos de las 13 tablas idénticos antes y después.

## Capabilities

### New Capabilities
- `datos-por-usuario`: qué datos son de cada cuenta y cuáles compartidos, aislamiento entre cuentas y paso de los datos existentes al dueño.

### Modified Capabilities
<!-- Ninguna: las demás capacidades funcionan igual, ahora dentro de la cuenta. -->

## Impact

- Migración `027_user_data.sql`; ADR 0018.
- `apps/api/src/db.js` (conexión por petición, `asSystem`, transacciones), `index.js` (hook de sesión, `ON CONFLICT` con `user_id`), `prices.js` (configuración por usuario, consultas de sistema), `details.js`, `pokecottage.js`, `auth.js`, `sync.js`.
- README.
