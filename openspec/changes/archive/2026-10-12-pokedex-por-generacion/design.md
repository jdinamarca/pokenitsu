# Design

## Context

- `dexCounts(mode, lang)` en el front recorre `data.inv`, toma `meta(sid, num)` (nombre, Pokédex, rareza, tipo) y suma `forSale(k)` por especie. Descarta cartas con más de un número de Pokédex.
- La rareza ya se agrupa (`rgroupOf`: base, rare, ultra, ir, sir, secret, shiny, promo) y la mecánica se lee del nombre (`mechOf`). Tras `monorepo-typescript-y-pruebas-del-nucleo` ambas viven en `packages/core`.
- Todo el cálculo es en el navegador sobre el inventario ya cargado; no hace falta API nueva.

## Goals / Non-Goals

**Goals:** un solo cálculo de nivel, en `core` y con pruebas, reutilizable después en Mi colección y en ubicaciones.

**Non-Goals:** guardar el nivel en la base; cambiar la clasificación de rarezas existente.

## Decisions

### 1. `cardTier(card, variant)` en `packages/core`
Devuelve `{ tier, rank }` con `rank` 1..9 para ordenar. Orden de evaluación (gana el primero que aplica):
1. rareza del grupo `secret` → Dorada/Secreta
2. `sir` → Ilustración especial (SIR)
3. `ir` → Ilustración (IR)
4. rareza full art (Ultra Rare, Rare Ultra, ACE SPEC, Mega Attack Rare…) → full art. La Doble rara **no** es full art
5. `shiny` → Variocolor
6. variante que no es normal/holo/reverse → Edición especial
7. el nombre es ex, V, GX… (`mechOf`) → ex/V/GX
8. variante holo o reverse, o rareza holo → challa holo
9. resto → challa

Las promos no tienen regla propia: caen en el paso que corresponda por nombre y variante.

*Alternativa:* agregar un nivel "promo". Se descarta porque el usuario pregunta "¿con qué completé?" y una promo ex es, para eso, una ex/V/GX.

### 2. Un solo recorrido con filtros combinables
`dexCounts` pasa a recibir un objeto de filtros `{ copias, niveles, idioma, series, origen, estadoMin, multiDex }`. Para cada fila calcula las copias que cuentan (todas / `forSale` / `pers`) y su nivel, y por especie acumula: cantidad, filas y mejor copia (mayor rango; empate por precio y luego `added_at`).

### 3. Estado mínimo como orden
NM > LP > MP > HP > DMG; "estado mínimo LP" acepta NM y LP.

### 4. Interfaz: diseño "Álbum" (propuesta A, elegida por el usuario)
La primera versión mostraba todos los filtros a la vez y se veía saturada. Se eligió la propuesta A del lienzo de diseño (Pokédex · propuestas de diseño):
- Encabezado con el selector de copias siempre visible: Todas mis cartas · Para vender · Mi colección.
- Regiones como pestañas con su % de avance (con los filtros actuales).
- Un resumen: "N / total especies de <región>", una barra de colores con cuántas especies tienen su mejor carta en cada nivel, y los niveles como botones (tocar uno muestra solo ese; "Ver todos los niveles" vuelve). En "Para vender", una línea con los kits completos y lo que falta para el siguiente.
- Idioma, serie, origen, estado mínimo, varios Pokémon y la selección múltiple de niveles quedan dentro de un botón **Filtros** (con un contador de filtros activos y "Quitar filtros").
- Grilla tipo álbum con la carta completa: las que tienes en color, con la insignia de nivel y la cantidad; las que faltan muestran la carta de referencia **en blanco y negro** con su número.
- Los filtros (incluida la región) se recuerdan por dispositivo.

*Alternativas:* B (escalera de niveles en una columna) y C (modos Colección y Kits separados). C puede sumarse después como pestaña "Kits".

## Risks / Trade-offs

- [Rarezas nuevas o escritas distinto en una fuente] → `cardTier` cae en "challa" o "challa holo" según la variante; una prueba lista todas las rarezas del catálogo y falla si alguna no tiene grupo conocido.
- [Las japonesas tienen rarezas en otro formato] → se normalizan con la tabla de rarezas existente; las sin rareza se clasifican por nombre (ex/V/GX) y variante.
- [Rendimiento con miles de filas] → un solo recorrido por cambio de filtro; el inventario esperado (decenas de miles de filas) se recorre en milisegundos.
