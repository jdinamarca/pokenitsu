# Proposal

## Why

Con cuentas, no había dónde ver con qué cuenta se está conectado ni datos de ella: el email aparecía en letra chica junto a "Cerrar sesión" dentro de Datos. El usuario pidió una opción de perfil con datos relevantes y elegir un avatar de entrenador Pokémon (maqueta F del canvas).

## What Changes

- Botón de perfil en la barra superior (avatar + nombre) que abre **Mi perfil**: nombre, email, etiquetas (Dueño, Alfa, Email sin verificar), desde cuándo y última carga.
- Resumen de la colección: cartas, distintas, valor estimado, colecciones, artes conectados, ubicaciones, idiomas y lotes abiertos.
- Avatar: 15 entrenadores (arte de sus cartas de Partidario del catálogo, recortado a la cara) o las iniciales.
- Cambiar nombre y contraseña (pide la actual).
- Ver esta sesión (equipo, desde, vence) y cerrar las de otros dispositivos.
- "Cerrar sesión" pasa de Datos al perfil.
- `GET /api/me` (cuenta, fecha y si es la del dueño).
- README: respaldo con `pg_dump` en modo sistema (con RLS forzado, `pg_dump` con el rol de la app se niega si no).

**Fuera del alcance:** subir una foto propia como avatar; cambiar el email; borrar la cuenta desde la app; verificación de correo (fase 3). Datos del usuario: no se tocan (el perfil solo lee y cambia nombre, avatar o contraseña cuando el usuario lo pide).

## Capabilities

### New Capabilities
<!-- Ninguna. -->

### Modified Capabilities
- `cuentas`: perfil, avatar, cambio de nombre y contraseña, y sesiones.

## Impact

- `apps/api/src/index.js` (`/api/me`); `apps/web/public/index.html` (botón, panel, avatares, estilos); README.
- Usa endpoints de Better Auth ya montados: `update-user`, `change-password`, `list-sessions`, `revoke-other-sessions`, `sign-out`.
