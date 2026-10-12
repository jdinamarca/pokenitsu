# Tasks

## 1. Parser

- [ ] 1.1 Reconocer rangos en `parseEntry` de `packages/core` (con sufijo, cantidad, estado y quitar; al revés; número con guion existente gana), con pruebas de cada escenario de la especificación; verificar `pnpm test` en verde

## 2. Historial agrupado

- [ ] 2.1 Migración `inventory_log.batch` y soporte en `/api/inventory/add` y `/api/inventory/undo` para deshacer un grupo completo en una transacción; verificar con curl cargando 3 cartas con el mismo `batch`, deshaciendo una vez y comprobando que las 3 se revirtieron; dejar el inventario como estaba

## 3. Carga en el front

- [ ] 3.1 Procesar rangos en `commitEntry`: saltar inexistentes, confirmar sobre 50, resumen de confirmación y avisos agrupados; verificar en Chrome sin interfaz con `1-12` en una expansión de prueba y deshacer
- [ ] 3.2 Repetir la última entrada con Enter vacío y borrarla al cambiar de expansión; verificar los escenarios "Repetir una carta" y "Nada que repetir"
- [ ] 3.3 Actualizar la ayuda de teclas en Cargar y el README (sección Uso / carga); verificar que la ayuda muestra `1-30` y "Enter vacío repite"

## Workflow follow-up

- Archivar el cambio con `/opsx:archive` cuando el usuario lo apruebe.
