# Proposal

## Why

En la vitrina de Eevee cuesta ver qué impresiones ya tiene el usuario. La única marca es una pastilla "×N" de 11 px en la esquina de la foto. Además, cuando una regla deja fuera una impresión, esa pastilla queda en penumbra junto con la carta. El usuario pidió que lo que tiene se note de un vistazo. En el canvas eligió el diseño AV ("Sello de inventario y filtro") y le agregó dos cambios: que lo que una regla deja fuera no aparezca, y que lo que le falta se vea en blanco y negro.

## What Changes

- **BREAKING (comportamiento visual):** las impresiones que una regla deja fuera **dejan de mostrarse** en la vitrina. Hoy se ven en penumbra en su lugar. Una repisa que queda sin impresiones también se oculta.
- **La nota de arriba dice cuánto dejó fuera la regla activa**, y cuántas de esas tiene el usuario. Ejemplo: «Solo inglés» dejó fuera 412 impresiones; 2 de ellas las tienes.
- **Lo que tienes a color, lo que te falta en blanco y negro.** Las impresiones que el usuario no tiene se ven en escala de grises, sin oscurecer. Las que tiene se ven a color.
- **Sello de inventario (diseño AV):** cada impresión que el usuario tiene lleva en la esquina inferior derecha de la foto un sello redondo con un ✓ y la cantidad. Reemplaza a la pastilla "×N".
- **Contador:** pasa de "N / total bajo luz" a "N / total tienes": cuántas de las impresiones visibles tiene el usuario.
- **Filtro "Todas · Las que tengo · Me faltan"**, con la cantidad de cada uno. Se combina con "Por verificar".
- **Ficha:** dice "Tienes N copias", con estado y ubicación, o "Te falta". Ya no muestra "Fuera de tu colección por…", porque lo que una regla deja fuera no se puede elegir.
- **Solo cuenta la impresión exacta:** tener la ES no marca la EN, aunque la regla «solo inglés» las agrupe. Decisión del usuario.
- **DESIGN.md:** la "Regla de la Penumbra" pasa a "Regla del color": lo que una regla deja fuera no se muestra, y lo que te falta va en blanco y negro.

**Fuera del alcance:**
- Cambiar qué impresiones deja fuera cada regla (`applyRules` no cambia).
- Que una copia en otro idioma cuente para la impresión que la regla deja visible.
- Cargar o editar copias desde la vitrina de Eevee (eso está en Cargar y Mi inventario).
- Otros Pokémon, y las pantallas Cargar y Mi inventario.

**Datos del usuario:** no hay migración. La vitrina solo lee el inventario, como hoy; las reglas y las vistas guardadas no cambian.

## Capabilities

### New Capabilities

(ninguna)

### Modified Capabilities
- `armado-de-coleccion`: cambian los requisitos "Vitrina" (lo que una regla deja fuera no se muestra; color o blanco y negro según si lo tienes; sello, contador y nota nuevos), "Vistas guardadas" (el escenario del contador), "Ficha de impresión" ("Tienes N copias" o "Te falta") y "Orden por expansión" (las reglas ocultan en vez de apagar). Se agrega el requisito "Ver lo que tengo y lo que me falta" (el filtro).

## Impact

- **`apps/arma/src`:** `App.tsx` (impresiones visibles, contador, nota y filtro), `components/Showcase.tsx` (sello y blanco y negro), `components/Detail.tsx` (caja de copias, sin la franja "Fuera de tu colección"), `model.ts` (cuentas de tengo y me faltan, con pruebas en `model.test.ts`) y `styles.css`.
- **`apps/arma/DESIGN.md`:** la regla nueva, el sello y el filtro.
- **`packages/core`:** sin cambios. `applyRules` sigue diciendo qué cuenta; ahora la vitrina oculta lo que queda fuera.
- **API y base de datos:** sin cambios.
