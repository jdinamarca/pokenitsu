# Proposal

## Why

En Mi perfil, las cifras de colecciones, artes conectados y ubicaciones solo se podían mirar; el usuario pidió que llevaran a su sección y que tuvieran un efecto al pasar el mouse con algo Pokémon.

## What Changes

- Las tarjetas de colecciones, artes conectados y ubicaciones del perfil son botones que cierran el perfil y abren Mis colecciones, Artes conectados y Ubicaciones.
- Al pasar el mouse: la tarjeta sube 2 px y desde su esquina asoma una ball dibujada en SVG (Poké Ball, Great Ball y Ultra Ball) que se tambalea una vez, como al atrapar un Pokémon (≈200 ms de entrada, 0,7 s de tambaleo).
- Solo con mouse; en pantallas táctiles la ball se ve quieta y tenue como pista de que se puede tocar; con "reducir movimiento" aparece sin tambaleo ni movimiento; con teclado aparece al enfocar.

**Fuera del alcance:** las demás cifras del perfil (cartas, distintas, valor). Sin imágenes externas: las balls son SVG en la página. Datos del usuario: no se tocan.

## Capabilities

### New Capabilities
<!-- Ninguna. -->

### Modified Capabilities
- `cuentas`: accesos desde el perfil a sus secciones.

## Impact

- `apps/web/public/index.html` (tarjetas, `ballSvg`, estilos y animación); README.
