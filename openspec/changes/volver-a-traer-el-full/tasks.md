## 1. Vitrina

- [x] 1.1 `api.ts`: tipo del resumen de importación; `App.tsx`: `runImport` guarda resumen o error y lo pasa al riel con `lastImport`
- [x] 1.2 `Rail.tsx` + `styles.css`: "Traído el …", botón "Volver a traer" (girando y deshabilitado mientras trae) y resumen que se cierra solo o con ×

## 2. Verificación

- [x] 2.1 Pruebas del texto del resumen (nuevas, quitadas, fotos, fuentes que fallaron, error)
- [x] 2.2 En la copia `pokemon_fotos`, Chrome en 1440 y 390: volver a traer Eevee muestra el resumen y la fecha nueva, y la vitrina queda con las cartas de Battle Academy nuevas; `pnpm test`, `typecheck` y `lint`; huella de la base real igual
- [x] 2.3 README
