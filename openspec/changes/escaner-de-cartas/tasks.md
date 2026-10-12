# Tasks

## 1. Prueba de concepto (decide si se construye)

- [ ] 1.1 Fotografiar 100 cartas reales del inventario (mezcla de eras, idiomas, holo y reverse) y anotar su número y expansión correctos; verificar que el set de fotos queda en una carpeta de pruebas fuera del repo público
- [ ] 1.2 Medir con la librería de OCR candidata la precisión de lectura de número y código sobre el recuadro recortado y el tiempo por lectura en un celular de gama media; verificar contra el criterio del ADR 0017 y registrar el resultado en el ADR
- [ ] 1.3 Si se cumple el criterio, marcar el ADR 0017 como Aceptado; si no, documentar la alternativa y detener el cambio

## 2. Interpretación en core

- [ ] 2.1 Implementar `parseCardCode` y `findSetByCode` en `packages/core` con pruebas sobre los textos leídos en 1.2 (incluidas confusiones O/0, I/1, S/5); verificar `pnpm test` en verde

## 3. Escáner

- [ ] 3.1 Vista de cámara con marco guía, permisos y mensajes de error (sin HTTPS, permiso denegado); verificar en localhost en el computador y en el celular sobre HTTPS
- [ ] 3.2 Lectura continua con recorte, preprocesamiento y doble coincidencia; verificar que propone la carta correcta con 10 cartas de prueba
- [ ] 3.3 Pantalla de confirmación con imagen, botones de variante y estado, corrección con teclado numérico, y carga por la misma vía que el teclado; verificar los escenarios "Lectura equivocada", "Reverse" y "Deshacer un escaneo"
- [ ] 3.4 Modo continuo con vibración o sonido; verificar el escenario "Diez cartas seguidas"
- [ ] 3.5 Verificar en las herramientas de red del navegador que no se envían imágenes durante el escaneo

## 4. Documentación

- [ ] 4.1 Actualizar README y la landing (si corresponde) con el escáner y sus límites; verificar que explican el requisito de HTTPS

## Workflow follow-up

- Archivar el cambio con `/opsx:archive` cuando el usuario lo apruebe.
