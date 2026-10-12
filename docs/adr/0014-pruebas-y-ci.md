# 0014. Pruebas automáticas y CI

- Estado: Aceptado
- Fecha: 2026-10-12

## Contexto
Hoy todo se prueba a mano con Chrome sin interfaz. Los próximos cambios (multiusuario, migración a TypeScript y React) tocan casi todo el código; sin pruebas automáticas es fácil romper reglas sin notarlo.

## Decisión
- **Vitest** para pruebas unitarias de `packages/core` (precios, parser, ubicaciones, colecciones) y de la API.
- **Pruebas de integración contra un Postgres real** en Docker (base de prueba que se crea y se borra; nunca la del usuario), incluidas pruebas de aislamiento entre usuarios ([0010](0010-multiusuario-con-user-id-y-rls.md)).
- **Playwright** para los flujos de punta a punta: cargar cartas, cerrar un lote, seguir una colección, login.
- Los escenarios de OpenSpec (WHEN/THEN) son la lista mínima de casos.
- **GitHub Actions** en cada push y pull request: chequeo de tipos, lint (ESLint + Prettier), pruebas unitarias e integración. Playwright en cada pull request a `main`.
- `main` protegido: solo entra código con CI en verde.

## Alternativas consideradas
- **Jest:** más lento y con más configuración para ESM y TypeScript.
- **Mocks de base de datos:** no detectan errores de SQL ni de RLS.
- **Cypress:** válido, pero Playwright es más rápido y prueba varios navegadores, incluido el celular emulado.

## Consecuencias
- Positivas: los refactors se hacen con red de seguridad; los errores se detectan antes de llegar a los testers.
- Negativas: escribir y mantener pruebas toma tiempo; CI con Postgres y Playwright tarda unos minutos.
