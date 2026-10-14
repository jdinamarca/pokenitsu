# Tasks

## 1. Grupos compartidos

- [x] 1.1 Migración 028 (grupos sin `user_id` ni RLS) y `ownerOnly` en las rutas de escritura de grupos; verificar en una copia de la base que dueño y tester ven los mismos 35 grupos, el tester recibe 403 al crear/editar/borrar y los grupos quedan intactos
- [x] 1.2 Botones "Nuevo grupo" y "Editar" solo para el dueño; verificar en Chrome sin interfaz con ambas cuentas

## 2. Perfil

- [x] 2.1 "N / 35 artes conectados completos · M empezados"; verificar dueño "0 / 35" y tester con una carta de un grupo "0 / 35 · 1 empezados"

## 3. Cierre

- [x] 3.1 ADR 0019, README; `pnpm build && pnpm typecheck && pnpm lint && pnpm test`; borrar la copia de prueba

## Workflow follow-up

- Commit en `artes-compartidos` y PR contra `main`; al mergear y reiniciar, la migración 028 corre en la base real. Archivar después.
