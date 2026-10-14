# Proposal

## Why

Quien entra a la app sin sesión ve directo un formulario de login, sin saber qué es Challadex. La landing de `/alfa` ya explica el producto, pero no tiene cómo entrar si ya tienes cuenta, y su inicio es estático. El usuario pidió una home "similar a la página alfa", con botón para hacer login y animaciones Pokémon atrayentes; en el canvas eligió la dirección J "Duelo: Charizard vs Gengar".

## What Changes

- `/` sin sesión muestra la landing (la home); con sesión, la app como siempre. `/alfa` sigue igual.
- Nueva ruta `/entrar`: la pantalla de login de la app; con sesión, lleva a `/`. El login tiene "← Volver al inicio".
- En la landing: botón **Iniciar sesión** en la barra y **Ya tengo cuenta · Entrar** junto a "Quiero ser alfa tester" (reemplaza "Ver cómo funciona", que sigue en la barra).
- Inicio en dos columnas: texto a la izquierda y un **duelo** a la derecha: Charizard lanza fuego, la carta de Gengar se sacude, Gengar carga una Shadow Ball y la lanza de vuelta (CSS, ciclo de 6 s). En el celular el duelo va bajo el texto, achicado. Se pausa fuera de pantalla y, con "reducir movimiento", las cartas quedan quietas.
- En el celular la barra muestra solo "Iniciar sesión" (el botón de la alfa está en el inicio).

**Fuera del alcance:** login con correo o Google (fase 3). Datos del usuario: no se tocan.

## Capabilities

### New Capabilities
<!-- Ninguna. -->

### Modified Capabilities
- `landing-alfa`: la landing también es la home sin sesión, con accesos al login y el duelo animado.
- `cuentas`: el login vive en `/entrar` y `/` sin sesión muestra la home.

## Impact

- `apps/api/src/index.js` (rutas `/` y `/entrar`, sin índice automático de archivos estáticos); `apps/web/public/landing.html`; `apps/web/public/index.html` (enlace "Volver al inicio"); `apps/web/public/landing/duelo-*.webp`; README.
- Requiere reiniciar el servidor.
