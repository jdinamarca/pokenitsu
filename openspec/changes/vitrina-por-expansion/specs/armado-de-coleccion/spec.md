# Spec Delta

## ADDED Requirements

### Requirement: Orden por expansión
La Vitrina SHALL ofrecer dos órdenes, "Por diseño" (el de hoy) y "Por expansión", y SHALL recordar el elegido en el navegador. En "Por expansión" SHALL mostrar una repisa por expansión, en una sola línea de tiempo por fecha de salida que mezcla regiones. Cada repisa SHALL mostrar el nombre, la región y el mes de salida de su expansión, y sus impresiones SHALL ir ordenadas por número de carta y, para cada número, por idioma, acabado y sello. Las reglas SHALL apagar las impresiones igual que en el orden por diseño.

#### Scenario: Rocket Gang antes que Team Rocket
- **WHEN** el usuario elige "Por expansión"
- **THEN** la repisa "ロケット団" (Japón, 1997-11) aparece antes que "Team Rocket" (Internacional, 2000-04), y la de Jungle muestra #51 EN, #51 EN 1st Edition y luego #51 en francés y alemán

#### Scenario: El orden se recuerda
- **WHEN** el usuario elige "Por expansión" y recarga la página
- **THEN** la Vitrina sigue ordenada por expansión

### Requirement: Qué es una expansión
Las impresiones en idiomas occidentales de una misma expansión internacional SHALL formar una sola expansión. Cada expansión japonesa SHALL ser propia, igual que cada china simplificada. Las impresiones en chino tradicional, tailandés, indonesio o coreano que pertenecen a una expansión japonesa SHALL formar su propia expansión, con su nombre local y la región de su idioma.

#### Scenario: Expansión traducida
- **WHEN** el Full tiene Eevee de "VMAXクライマックス" en japonés y en chino tradicional
- **THEN** hay dos repisas: "VMAXクライマックス" (Japón) y "VMAX絕群壓軸" (China tradicional)

### Requirement: Fecha de salida de una expansión
La fecha de una expansión SHALL ser la más antigua entre sus impresiones. Si no hay ninguna, SHALL usarse la de su expansión japonesa (para las traducidas) y, si tampoco hay, la del catálogo. Las expansiones sin fecha SHALL ir al final de la línea de tiempo, en orden alfabético, con la leyenda "Fecha por confirmar".

#### Scenario: Traducida sin fecha propia
- **WHEN** "寶可夢卡牌151" (chino tradicional) no tiene fecha y "ポケモンカード151" sí (2023-06-18)
- **THEN** la repisa china toma 2023-06 y queda junto a la japonesa, después de ella
