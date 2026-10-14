# Proposal

## Why

El perfil mostraba "35 artes conectados" como si el usuario los tuviera, cuando son los 35 grupos definidos y no tiene ninguna de sus cartas. Además el usuario aclaró que los artes conectados son **los mismos para todos**: lo que cambia por cuenta es el avance. La fase 2 los había dejado como datos de cada cuenta, así que un tester nuevo veía 0 grupos.

## What Changes

- Los grupos de artes conectados pasan a ser **compartidos** (migración 028: sin `user_id` ni Row Level Security). El avance sigue saliendo del inventario de cada cuenta.
- Solo el dueño crea, edita, borra o cambia la imagen de un grupo; las demás cuentas reciben 403 y no ven esos botones.
- Mi perfil muestra el avance: **"0 / 35 artes conectados completos · N empezados"** en vez de "35 artes conectados".
- ADR 0019.

**Fuera del alcance:** un rol de administrador configurable; otras curadurías compartidas.

**Datos del usuario:** los 35 grupos (todos del dueño, la única cuenta) quedan tal cual, solo pierden la marca de dueño. Probado en una copia de la base.

## Capabilities

### New Capabilities
<!-- Ninguna. -->

### Modified Capabilities
- `datos-por-usuario`: los grupos de artes conectados salen de los datos de cada cuenta y pasan a los compartidos.
- `artes-conectados`: los grupos son compartidos y solo el dueño los edita.
- `cuentas`: el perfil muestra el avance de artes conectados.

## Impact

- Migración `028_shared_art_groups.sql`, ADR 0019.
- `apps/api/src/index.js` (`isOwner`, `ownerOnly` en las 4 rutas de escritura de grupos, `/api/me`); `apps/web/public/index.html` (perfil, botones de edición solo para el dueño); README.
