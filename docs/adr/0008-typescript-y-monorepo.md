# 0008. TypeScript en un monorepo con pnpm

- Estado: Aceptado
- Fecha: 2026-10-12

## Contexto
El código actual es JavaScript sin tipos: un `server/index.js` de ~950 líneas y un `public/index.html` de ~2.700. La lógica crítica (precios, parser de `25r lp*2`, reglas de ubicación, conteo de colecciones) está mezclada con la interfaz y en parte duplicada entre front y servidor. Con varios usuarios, un error de tipos puede mezclar o perder datos.

## Decisión
- Todo el código nuevo y migrado en **TypeScript** estricto.
- Monorepo con **pnpm workspaces**:
  - `apps/api`: servidor Fastify ([0009](0009-api-fastify-kysely-typebox.md))
  - `apps/web`: front React ([0012](0012-front-react-vite-pwa.md))
  - `packages/core`: lógica de negocio pura, sin red ni base de datos (precios, parser, ubicaciones, colecciones), usada por ambos
- La migración es gradual: primero se mueve la lógica a `packages/core` con pruebas, sin cambiar el comportamiento.

## Alternativas consideradas
- **Seguir en JavaScript con JSDoc:** menos fricción, pero tipos más débiles y sin chequeo real en el front.
- **Repos separados para front y API:** duplicaría `packages/core` o requeriría publicarlo.
- **Nx o Turborepo:** útiles con muchos paquetes; con tres, pnpm workspaces basta (se puede sumar Turborepo después).

## Consecuencias
- Positivas: errores detectados al compilar, refactors seguros, una sola implementación de cada regla.
- Negativas: se agrega un paso de build y configuración de TypeScript.
