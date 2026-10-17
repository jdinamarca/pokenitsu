# Tasks

## 1. Cuentas

- [ ] 1.1 En `apps/arma/src/model.ts`, `ownership(printings, result, owned)`: visibles (total y cuántas tengo) y ocultas por regla (total y cuántas tengo), contando solo la impresión exacta. Con pruebas en `model.test.ts` para los escenarios de la spec: una impresión que tengo, una que me falta, la ES que tengo mientras la EN queda visible y un jumbo propio oculto. Verificar con `pnpm --filter @pokenitsu/arma test`.

## 2. Vitrina

- [ ] 2.1 `App.tsx`:
  - repisas filtradas en este orden: visibles, "Por verificar" y luego "Todas · Las que tengo · Me faltan" (recordado en `arma.ver`), quitando las repisas vacías y conservando la foto de respaldo de cada diseño;
  - contador "N / total tienes" y nota con lo que dejó fuera la regla activa (o la vista) y cuántas de esas tengo;
  - la impresión elegida se deselecciona si queda oculta.

  Verificar con `pnpm --filter @pokenitsu/arma typecheck` y lint.
- [ ] 2.2 `Showcase.tsx` y `styles.css`: lo que tengo a color y lo que me falta en blanco y negro (`.miss`, sin oscurecer; transición de 450 ms, instantánea con "reducir movimiento"), y el sello de inventario (✓ N) en la esquina de la foto en lugar de la pastilla "×N". La foto pasa a recortarse ella misma para que el sello sobresalga. Se quita la penumbra `.off` de esta pantalla. Verificar con typecheck y lint.
- [ ] 2.3 `Detail.tsx`: "Tienes N copias", con idioma, estado y ubicación, o "Te falta"; se quita la franja "Cuenta / Fuera de tu colección". Verificar con typecheck y lint.

## 3. Prueba en el navegador

- [ ] 3.1 En Chrome sin interfaz, contra una copia de la base y con la cuenta del dueño:
  - con "solo inglés", las ES y FR no se ven, la nota dice cuántas sacó y cuántas tengo, y el contador baja;
  - lo que tengo se ve a color con el sello "✓ N"; lo que me falta, en blanco y negro (comprobar el `filter` calculado);
  - "Las que tengo" y "Me faltan" muestran lo que dicen sus cantidades; combinados con "Por verificar" también;
  - apagar "Incluir jumbo" oculta los jumbo, y la nota los cuenta;
  - con "reducir movimiento", la transición es de 0 s;
  - a 1280 y 1440 px, el sello no se corta y no hay scroll horizontal;
  - sin errores de JS.

  Comprobar al final que la base real no cambió.

## 4. Documentación y cierre

- [ ] 4.1 `apps/arma/DESIGN.md`: la "Regla de la Penumbra" pasa a "Regla del color" (lo que una regla deja fuera no se muestra; lo que tienes a color y lo que te falta en blanco y negro), y se documentan el sello de inventario y el filtro. `README.md`: la sección de arma (la Vitrina y las reglas) dice lo mismo. Verificar leyendo ambas secciones.
- [ ] 4.2 `pnpm build && pnpm typecheck && pnpm lint && pnpm test` en verde. Borrar la copia de la base y confirmar que se borró.

## Workflow follow-up

- Archivar antes `cargar-e-inventario-en-arma` (mergeado en #69), en su propio PR.
- PR contra `main`; merge solo a pedido, y después archivar este cambio.
