---
version: 1
slug: "index-html"
primary_target: "index.html"
related_targets: []
---

# Arma tu colección · pantalla principal

## Alcance y modo
Pantalla principal de la app nueva `apps/arma`. Modo **Operate**: el coleccionista arma y cura su colección en sesiones largas en el computador. Maqueta elegida: `AE · Vitrina de tienda`, en el canvas de diseño (sección "Arma tu colección · mundo visual").

## Audiencia, tarea y restricciones
- El dueño, después los testers. Tarea: partir del Full de un Pokémon (Eevee) y reducirlo con reglas a su colección; revisar impresiones y su procedencia.
- Evitar: dashboard genérico, cartas chicas, estética infantil, texto que cansa al leer mucho.
- Nada heredado de `apps/web`: el mundo es nuevo.

## Momento memorable
Activar una regla y ver cómo se **apaga la luz** de las impresiones que salen de la colección, mientras el contador baja en vivo. Siguen en la vitrina, en penumbra: el Full nunca se borra.

## Direction contract
THESIS: El Full es una vitrina de tienda iluminada, y la colección es lo que queda bajo luz. Rechaza el dashboard de tarjetas con métricas y la carpeta de 9 bolsillos usada como decoración.
OWN-WORLD: Riel y fondo de la vitrina en fieltro verde profundo (#0f3a31); la sala, en grafito tibio (#151513). Luz LED cálida (#fff3dc) en el borde superior del vidrio y en la regla activa. Etiquetas de cartulina (#e8dcc2) con números condensados, y stickers de inventario de color para la procedencia: verde con permiso, ámbar revisar, rojo sin permiso, azul propio. Las cartas, siempre a escala grande y con su foto real. Tipografía Archivo con Archivo Narrow para las cifras. Sin neón ni degradados decorativos.
STORY: El coleccionista ve el universo completo, entiende cuánto deja fuera cada regla, confía en de dónde sale cada dato y decide qué cuenta para su colección.
FIRST VIEWPORT: Riel de 276 px a la izquierda con el Pokémon, las reglas (interruptores; la activa iluminada) y las vistas guardadas. Arriba, el contador "158 / 712 bajo luz" con la nota de la regla activa y la leyenda de stickers. Al centro, la vitrina con repisas por diseño (151 #133, Prismatic #74, promos), cartas de ~104×145 px con su etiqueta. A la derecha, 344 px con la ficha de la impresión elegida: código de catálogo, foto grande, copias en el inventario y la procedencia de cada dato.
Signature: regla → luz. La regla activa es lo único a plena luz; las impresiones excluidas pasan a escala de grises y penumbra en ~450 ms, y el contador se actualiza con cifras tabulares.
Raises: Emigre → la misma ilustración se repite a escala en todas sus impresiones; Factory Records → código de catálogo estable en cada etiqueta (EEV · SV3PT5 · 133 · EN · N); mapa de metro → solo la regla activa brilla y el resto retrocede en pasos.
FORM: Vitrina de tienda, candidato 6 de 7 de la lista propia. seed: none (unavailable)
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Decisiones abiertas
- El modelo de datos (impresión, equivalencia, regla, procedencia) y si usa la API actual o una propia: se resuelve en la propuesta de OpenSpec.
- Otras pantallas (ficha de carta, informe "Listo para producción", curaduría de equivalencias) heredan este mundo.
