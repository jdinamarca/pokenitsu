# Tasks

## 1. Nivel de carta en core

- [x] 1.1 Implementar `cardTier` en `packages/core` según el orden del diseño, con una prueba por escenario de "Nivel de una copia" (común normal, Doble rara, Poké Ball, promo ex) y casos de cada nivel; verificar `pnpm test` en verde
- [x] 1.2 Agregar una prueba que recorre todas las rarezas del fixture del catálogo y falla si alguna no tiene grupo conocido; verificar en verde

## 2. Conteo con filtros

- [x] 2.1 Reescribir `dexCounts` para recibir el objeto de filtros (copias, niveles, idioma, serie, origen, estado mínimo, varios Pokémon) y devolver cantidad y mejor copia por especie; verificar con una prueba en Chrome sin interfaz que, con los filtros por defecto, Kanto muestra los mismos números que antes del cambio
- [x] 2.2 Implementar el filtro de copias (todas / para vender / personales) y verificar los escenarios "Pokédex personal" y "Todas las copias" con filas de prueba que se borran al terminar

## 3. Interfaz

- [x] 3.1 Agregar los filtros nuevos y los chips de niveles con atajos, quitar el filtro de variante y recordar los filtros por dispositivo; verificar en Chrome sin interfaz que cada filtro cambia el conteo y que se recuerda al recargar
- [x] 3.2 Mostrar la insignia de nivel de la mejor carta en cada casilla y el resumen por nivel; verificar el escenario "Especie con challa y SIR" con filas de prueba
- [x] 3.3 Mostrar en el detalle de especie el nivel de cada copia, ordenadas de mayor a menor nivel; verificar tocando una especie

## 4. Documentación

- [x] 4.1 Actualizar README (sección Pokédex) y verificar que describe los filtros y los niveles; tomar capturas para la landing si cambian

## Workflow follow-up

- Archivar el cambio con `/opsx:archive` cuando el usuario lo apruebe.
