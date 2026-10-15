# Decisiones de arquitectura (ADR)

Por qué el sistema es como es. El **qué** hace está en [`openspec/specs/`](../../openspec/specs). Cómo se escriben: [0001](0001-registrar-decisiones-con-adr.md) y la [plantilla](0000-plantilla.md).

| # | Decisión | Estado |
|---|---|---|
| [0001](0001-registrar-decisiones-con-adr.md) | Registrar las decisiones con ADR | Aceptado |
| [0002](0002-postgres-y-migraciones-sql.md) | PostgreSQL con migraciones SQL numeradas | Aceptado |
| [0003](0003-fuentes-de-precio-y-conversion-a-clp.md) | Fuentes de precio y conversión a CLP | Aceptado |
| [0004](0004-identidad-de-una-fila-de-inventario.md) | Fila de inventario = carta + variante + idioma + estado + ubicación | Aceptado |
| [0005](0005-gana-la-ubicacion-mas-especifica.md) | Gana la ubicación más específica | Aceptado |
| [0006](0006-precio-propio-en-dolares.md) | Precio propio en USD, convertido cada día | Aceptado |
| [0007](0007-especificacion-con-openspec.md) | Especificar los cambios con OpenSpec | Aceptado |
| [0008](0008-typescript-y-monorepo.md) | TypeScript en un monorepo con pnpm | Aceptado |
| [0009](0009-api-fastify-kysely-typebox.md) | API con Fastify, Kysely y TypeBox | Aceptado |
| [0010](0010-multiusuario-con-user-id-y-rls.md) | Multiusuario con `user_id` y Row Level Security | Aceptado |
| [0011](0011-autenticacion-con-better-auth.md) | Autenticación con Better Auth | Aceptado |
| [0012](0012-front-react-vite-pwa.md) | Front con Vite + React + TypeScript, PWA | Aceptado |
| [0013](0013-tareas-en-segundo-plano-con-pg-boss.md) | Tareas en segundo plano con pg-boss | Aceptado |
| [0014](0014-pruebas-y-ci.md) | Pruebas automáticas y CI | Aceptado |
| [0015](0015-despliegue.md) | Despliegue: Vercel + Fly.io + Supabase | Aceptado |
| [0016](0016-observabilidad-y-correo.md) | Sentry, logs estructurados y Resend | Aceptado |
| [0017](0017-reconocimiento-de-cartas-con-ocr-en-el-navegador.md) | Reconocer las cartas con OCR en el navegador | **Propuesto** |
| [0018](0018-rls-forzado-con-usuario-por-conexion.md) | RLS forzado, con el usuario fijado en la conexión de cada petición | Aceptado |
| [0019](0019-artes-conectados-compartidos.md) | Artes conectados compartidos, editados por el dueño | Aceptado |
| [0020](0020-arma-tu-coleccion-app-aparte.md) | "Arma tu colección": app aparte, esquema propio y procedencia por dato | Aceptado |
