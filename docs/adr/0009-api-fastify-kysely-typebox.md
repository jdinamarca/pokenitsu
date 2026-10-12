# 0009. API con Fastify, Kysely y validación con TypeBox

- Estado: Aceptado
- Fecha: 2026-10-12

## Contexto
La API actual usa Fastify 5 y `pg` con SQL escrito a mano; funciona y es rápida. Faltan tipos en las consultas y validación declarativa de las entradas (hoy se valida a mano en cada ruta).

## Decisión
- Mantener **Fastify**, organizado en plugins por capacidad (catálogo, inventario, precios, ubicaciones, lotes, colecciones…), igual que las especificaciones de OpenSpec.
- Consultas con **Kysely** (query builder con tipos, SQL explícito); los tipos de las tablas se generan desde la base.
- Esquemas de entrada y salida con **TypeBox** (JSON Schema nativo de Fastify), que además documentan la API (OpenAPI).
- Las migraciones siguen en SQL ([0002](0002-postgres-y-migraciones-sql.md)).

## Alternativas consideradas
- **Prisma o Drizzle:** buenos ORMs, pero esconden más el SQL y traen su propio sistema de migraciones; el proyecto ya depende de SQL específico (JSONB, arreglos, upserts, `FOR UPDATE`).
- **Zod:** muy popular, pero TypeBox se integra sin adaptadores con la validación de Fastify.
- **NestJS o Express:** NestJS agrega mucha estructura para una persona; Express es más lento y menos tipado.

## Consecuencias
- Positivas: consultas con tipos sin perder control del SQL; entradas inválidas rechazadas antes de llegar al código.
- Negativas: hay que regenerar los tipos de la base después de cada migración (un script en CI).
