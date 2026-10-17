# Design

## Context

- **Cómo funciona hoy (`apps/arma/src/App.tsx`):**
  - `applyRules` (core) da, por impresión, `{ in, by }`: si cuenta y, si no, qué regla la dejó fuera.
  - `shelvesOf` y `shelvesBySet` arman las repisas con **todas** las impresiones. Cada repisa trae su `fallback`: la foto de otra impresión del mismo diseño.
  - `Showcase` pinta la impresión con `.print.off` (escala de grises y brillo 0.32) cuando `in` es falso, y la pastilla `.owned` "×N" cuando hay copias.
  - Las copias vienen de `/api/owned/:dex` y se agrupan por código de impresión (`copiesByCode`). Una copia ya cuenta solo para su impresión exacta, que es lo que el usuario eligió.
- **El contador** cuenta lo que está "bajo luz"; la nota dice cuántas apagó la regla activa y cuántas faltan.
- **El filtro "Por verificar"** ya filtra las repisas y oculta las que quedan vacías.

## Goals / Non-Goals

**Goals:**
- Que la diferencia entre lo que tengo y lo que me falta se vea de lejos, sin leer números.
- Mantener intactas las reglas, las vistas y las cuentas que ya existen.

**Non-Goals:**
- Tocar `applyRules` o el modelo de equivalencias.
- Mover a `core` la lógica de pintura: es presentación.

## Decisions

### 1. Ocultar se decide al armar las repisas, después de agruparlas
Las repisas se siguen armando con **todas** las impresiones. Recién después se filtran las visibles (`in`), luego las de "Por verificar" y luego las de "tengo" o "me faltan", y se quitan las repisas que quedan vacías.

Así, la foto de respaldo de una repisa (`fallback`) puede seguir usando la foto de una impresión oculta del mismo diseño. Sin eso, una japonesa sin foto propia perdería la foto de su original inglesa cuando "solo inglés" la oculta.

*Alternativa descartada:* filtrar antes de agrupar. Es más simple, pero pierde fotos de referencia.

### 2. Las cuentas en una función pura de `model.ts`, con pruebas
`ownership(printings, result, owned)` devuelve:
- visibles: total y cuántas tengo;
- ocultas por cada regla: total y cuántas tengo.

El contador, el filtro y la nota leen de ahí, y las pruebas cubren los escenarios de la spec (equivalente ES con EN visible, jumbo propio oculto).

*Alternativa descartada:* contar en el componente con varios `useMemo`. Así lo hace hoy, y es donde se separan el contador y la nota.

### 3. Blanco y negro es otra clase, no la penumbra de antes
- `.print.miss` aplica `filter: grayscale(1)` sobre la foto, sin oscurecer, con la misma transición de 450 ms (instantánea con "reducir movimiento").
- La clase `.off` y su brillo 0.32 desaparecen de la vitrina de Eevee, porque lo que queda fuera ya no se pinta.
- La etiqueta de cartulina no se atenúa: en blanco y negro sigue legible.
- La foto de referencia (`img.ref`, opacidad 0.82) se combina con el blanco y negro sin cambios.

### 4. El sello reemplaza a `.owned`
`.seal` va dentro de `.art`, en la esquina inferior derecha, sobresaliendo 8 px como en AV, con `overflow: visible` en ese contenedor. Lleva fieltro, un borde de cartulina de 2 px, el ✓ de lucide (`Check`) y la cifra en Archivo Narrow 700 de 15 px con cifras tabulares, y una altura de 30 px.

`.art` hoy tiene `overflow: hidden` para recortar la foto. El recorte pasa a la `img` (`border-radius` en la imagen) para que el sello pueda salir del borde.

### 5. Nota y ficha
- **Nota con una regla activa:** «{regla}» dejó fuera N impresiones; X de ellas las tienes. Si la regla está apagada: «{regla}» está apagada: sus impresiones vuelven a la vitrina.
- **Nota con una vista elegida:** "La vista deja fuera N; X de ellas las tienes".
- **Ficha:** la franja `status` "Cuenta / Fuera de tu colección" se quita. La caja `own` dice "Tienes N copias" con la lista de copias, o "Te falta".
- **Si la impresión elegida queda oculta,** se deselecciona y la ficha vuelve a su estado vacío.

### 6. El filtro se recuerda como el orden
"Todas · Las que tengo · Me faltan" usa los mismos botones que "Ordenar" (chips de grafito; el elegido, en cartulina). Se guarda en `localStorage` (`arma.ver`), envuelto en try/catch como `arma.orden`.

## Risks / Trade-offs

- **[Se pierde la vista de lo que la regla saca]** → La nota dice cuántas sacó y cuántas de esas tiene el usuario, y basta apagar la regla para volver a verlas. Lo pidió el usuario y queda en DESIGN.md.
- **[El blanco y negro se confunde con la penumbra de antes]** → La penumbra desaparece de esta pantalla; el gris sin oscurecer pasa a significar solo "te falta".
- **[Una copia ES no cuenta para la EN visible]** → Es lo que eligió el usuario. Su ES no se pierde: la nota la cuenta entre las ocultas que tiene.
- **[Sello que sobresale y se corta]** → Se verifica en Chrome a 1280 y 1440 px que no quede recortado por la repisa ni por el borde de la vitrina.

## Migration Plan

Sin datos ni API: es un cambio de front. Para volver atrás, se revierte el PR.
