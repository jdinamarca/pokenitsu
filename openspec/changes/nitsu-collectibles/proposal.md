# Proposal

## Why

El nombre de trabajo "Challadex" no convencía y el "-dex" se acerca a la marca Pokédex. El usuario eligió **Nitsu Collectibles** (de "pokenitsu", sin "Poké"; "Collectibles" deja espacio para otros coleccionables). Además pidió actualizar la landing con las vistas mejoradas de la app (Artistas firma, Mi perfil, etc.) y un login "más divertido" que el formulario genérico; en el canvas eligió la dirección O "Gengar espía".

## What Changes

- **Nombre**: "Nitsu Collectibles" en la landing (título, logo, pie, aviso legal), en la app (título de la pestaña y logo de la barra) y en el login. El logo muestra "Nitsu" grande y "COLLECTIBLES" chico en dorado.
- **Login**: Gengar asoma la cabeza detrás del formulario. Al escribir el email se asoma más ("¿Y tú quién eres? 👀"); al escribir la contraseña se esconde ("¡No miro, no miro! 🙈"); con una contraseña incorrecta se ríe ("¡Jijiji! Esa no era 😈") y la tarjeta se sacude. Pikachu flota en la esquina. Título "¡Qué bueno verte!" / "¡Únete a Nitsu!" (crear cuenta). Logo arriba a la izquierda, que lleva a la home. Con "reducir movimiento", sin animaciones.
- **Landing**: capturas nuevas de la app (con el nombre y las vistas actuales), a 2× y recortadas a la medida de cada recuadro (sin el zoom por CSS); nueva sección **Ilustradores** con la tarjeta firma y el arte al pasar el mouse.

**Fuera del alcance:** cambiar el nombre del repo o del paquete. Datos del usuario: no se tocan (capturas sacadas de una copia de la base).

## Capabilities

### New Capabilities
<!-- Ninguna. -->

### Modified Capabilities
- `cuentas`: login con Gengar que reacciona.
- `landing-alfa`: nombre del producto y sección de Ilustradores.

## Impact

- `apps/web/public/index.html`, `apps/web/public/landing.html`, `apps/web/public/login/*.webp`, `apps/web/public/landing/*.jpg`; README; `openspec/config.yaml`.
