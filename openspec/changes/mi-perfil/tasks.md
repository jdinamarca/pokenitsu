# Tasks

## 1. Perfil

- [x] 1.1 `GET /api/me`, botón de perfil en la barra y panel con datos de la cuenta y resumen de la colección; verificar en una copia de la base (Chrome sin interfaz) que muestra nombre, email, Dueño, Alfa, email sin verificar, 33 cartas, 1 colección, 35 artes, 8 ubicaciones, idiomas y esta sesión, y que "Cerrar sesión" ya no está en Datos
- [x] 1.2 Avatar: 15 entrenadores (arte de cartas de Partidario, recortado) o iniciales, guardado en la cuenta; verificar que elegir Cynthia cambia la barra y queda marcada
- [x] 1.3 Cambiar nombre y contraseña con errores en español; verificar contraseña actual equivocada, nuevas que no coinciden y cambio correcto (la nueva sirve)
- [x] 1.4 Sesiones: esta sesión y cerrar las de otros dispositivos; cerrar sesión desde el perfil; verificar que otra sesión queda fuera y la actual sigue, y que el panel cabe en 390 px

## 2. Cierre

- [x] 2.1 README (perfil y respaldo con `pg_dump` en modo sistema, probado: respaldo + restauración a una copia); `pnpm build && pnpm typecheck && pnpm lint && pnpm test`; borrar la copia de prueba; la cuenta real sin cambios

## Workflow follow-up

- Commit en `perfil` y PR contra `main`; mergear a pedido y luego archivar.
