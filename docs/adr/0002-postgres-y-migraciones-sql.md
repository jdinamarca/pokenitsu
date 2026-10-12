# 0002. PostgreSQL como base de datos, con migraciones SQL numeradas

- Estado: Aceptado (registra una decisión ya tomada)
- Fecha: 2026-10-12

## Contexto
Los datos son relacionales (expansiones → cartas → filas de inventario → lotes, colecciones, ubicaciones) y necesitan transacciones: cerrar un lote o importar un respaldo toca muchas filas que deben cambiar todas o ninguna. También se usan arreglos (`cards.dex`) y JSON (`locations.rule`, `card_prices.usd`).

## Decisión
- Usar PostgreSQL como única base de datos.
- Las migraciones son archivos SQL numerados en `db/migrations/` (`001_init.sql`, `002_…`) que se aplican solos al arrancar, una vez cada uno (tabla `schema_migrations`), dentro de una transacción.
- Una migración aplicada no se edita: los cambios van en una nueva.

## Alternativas consideradas
- **SQLite:** más simple para un solo usuario, pero no sirve para varios usuarios concurrentes en la nube ni para Row Level Security.
- **MongoDB u otra documental:** el modelo es claramente relacional y necesita transacciones entre colecciones.
- **Migraciones generadas por un ORM:** esconden el SQL real; con SQL escrito a mano se controla cada índice y cada cambio de clave primaria.

## Consecuencias
- Positivas: transacciones, JSONB, arreglos y RLS ([0010](0010-multiusuario-con-user-id-y-rls.md)) disponibles; cualquier Postgres administrado sirve para producción.
- Negativas: hay que escribir las migraciones a mano y no hay "rollback" automático; se compensa con respaldos antes de migrar en producción.
