# Tasks

## 1. Cálculo de avance en core

- [x] 1.1 Implementar `isPrintedNumber` y el cálculo de avance por modo (Base, Con secretas, Master set) en `packages/core`, con pruebas de los escenarios de la especificación (151: 88/165, 89/207, carta con normal y reverse); verificar `pnpm test` en verde
- [x] 1.2 Agregar una prueba que clasifica todos los números del fixture del catálogo sin errores y revisar a mano los que tienen letras o prefijos; verificar en verde

## 2. Variantes en el catálogo

- [x] 2.1 Migración que agrega `cards.variants` y `cards.variants_guessed`; verificar que se aplica sola al arrancar y que las tablas del usuario no cambian (mismas filas y totales)
- [x] 2.2 Guardar `variants` de TCGdex al completar detalles y agregar el trabajo por expansión con límite de concurrencia y deducción por rareza cuando TCGdex no tiene la carta; verificar con 151 que todas sus cartas quedan con variantes y que 25 tiene normal y reverse
- [x] 2.3 Ampliar `/api/sets/:id/cards` con las variantes; verificar con curl

## 3. Vista de expansiones

- [x] 3.1 Agregar la pestaña Expansiones con lista, barra de avance, selector de modo, filtros (copias, idioma, serie, origen, sin promos, todas) y orden; verificar en Chrome sin interfaz con el inventario actual que Chaos Rising y Perfect Order muestran su avance
- [x] 3.2 Agregar el detalle de una expansión (grilla, tengo / me faltan, costo para completar); verificar el escenario "Costo para completar" con datos de prueba

## 4. Avance al cargar

- [x] 4.1 Mostrar el indicador de avance de la expansión activa en Cargar y el aviso "¡Nueva!" y la celebración al completar; verificar cargando y deshaciendo una carta nueva y una repetida en una expansión de prueba, dejando el inventario como estaba

## 5. Documentación

- [x] 5.1 Actualizar README (Expansiones, modos de completitud, variantes del catálogo) y verificar que describe cómo leer el avance

## Workflow follow-up

- Archivar el cambio con `/opsx:archive` cuando el usuario lo apruebe.
