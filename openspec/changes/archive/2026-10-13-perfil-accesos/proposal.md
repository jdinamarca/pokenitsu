# Proposal

## Why

En Mi perfil, las cifras solo se podían mirar; el usuario pidió que llevaran a su sección y que tuvieran un efecto al pasar el mouse con algo Pokémon, y después que también lo tuvieran cartas, distintas y valor.

## What Changes

- Las seis cifras del perfil son botones que cierran el perfil y abren su sección: cartas y distintas → Mi colección; valor estimado → Mi colección ordenada por valor total (precio × copias); colecciones, artes conectados y ubicaciones → su pestaña.
- Al pasar el mouse: la tarjeta sube 2 px y desde su esquina asoma una ball distinta dibujada en SVG (Premier, Luxury, Master, Poké, Great y Ultra Ball) que se tambalea una vez, como al atrapar un Pokémon (≈200 ms de entrada, 0,7 s de tambaleo).
- Solo con mouse; en pantallas táctiles la ball se ve quieta y tenue como pista de que se puede tocar; con "reducir movimiento" aparece sin tambaleo ni movimiento; con teclado aparece al enfocar.

**Fuera del alcance:** idiomas y lotes abiertos (texto). Sin imágenes externas: las balls son SVG en la página. Datos del usuario: no se tocan.

## Capabilities

### New Capabilities
<!-- Ninguna. -->

### Modified Capabilities
- `cuentas`: accesos desde el perfil a sus secciones.

## Impact

- `apps/web/public/index.html` (tarjetas, `ballSvg`, estilos y animación); README.
