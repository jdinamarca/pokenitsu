# Proposal

## Why

El login tiene de fondo lienzos de colores en CSS porque las imágenes de Gengar y Pikachu se veían pixeladas. Ahora tenemos copias propias de las cartas en buena resolución (`imagenes-locales`), así que el login puede mostrar cartas reales y nítidas. El usuario eligió la maqueta **T · Carpeta** del canvas, entre tres propuestas (Vitrina, Carpeta y Slab).

## What Changes

- **El login es una carpeta abierta** (`/entrar`):
  - página izquierda: 9 bolsillos, 7 con cartas reales (Charizard ex, Umbreon ex, Pikachu ex, Gengar ex, Mew ex, Espeon ex, Greninja ex) que se deslizan a su lugar al abrir el login, y 2 vacíos;
  - página derecha: el logo y el formulario de siempre (entrar, crear cuenta, recuperar contraseña, Google, reenviar el correo);
  - argollas al centro.
- **Al escribir en un campo, el bolsillo vacío "Tu próxima carta" se ilumina en dorado.**
- **Con el mouse, la carta del bolsillo se levanta** (solo con mouse; no en pantallas táctiles).
- **En celular** se ve solo una fila de 3 bolsillos sobre el formulario.
- **Con "reducir movimiento"** las cartas aparecen sin deslizarse y no se levantan.
- El formulario sigue sacudiéndose si la contraseña es incorrecta.
- Las cartas son WebP de 320 px de ancho en `apps/web/public/login/`, sacadas de la copia propia de imágenes (igual que las de la landing), para no depender del storage.
- Se eliminan los lienzos de colores.

**Fuera del alcance:** cambios al flujo de cuentas (correo, Google, recuperar contraseña).

## Impact

- `apps/web/public/index.html` (pantalla `authGate`: HTML y CSS).
- `apps/web/public/login/*.webp` (7 imágenes nuevas).
- README (sección de la landing y el login).
- Spec `cuentas`: el requisito del fondo del login.
