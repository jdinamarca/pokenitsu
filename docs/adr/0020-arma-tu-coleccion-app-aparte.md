# 0020. "Arma tu colección": app aparte, esquema propio y procedencia por dato

- Estado: Aceptado
- Fecha: 2026-10-15

## Contexto
El usuario quiere armar colecciones a medida a partir de todas las impresiones que existen de un Pokémon (carta × idioma × variante), con reglas propias y sabiendo de qué fuente sale cada dato. Algunas fuentes tienen permiso; otras no: PokeCottage autorizó solo su texto, Bulbapedia es CC BY-NC-SA y TCGplayer no ha dado permiso. Por ahora se trabaja solo en local, y se pueden usar todas las fuentes siempre que cada dato quede marcado. El usuario pidió una opción completamente nueva, con un diseño premium, sin rehacer ni arriesgar la app actual (`apps/web` + `apps/api`).

## Decisión
- **App aparte, `apps/arma`:** front en Vite + React + TypeScript (el stack destino de [0012](0012-front-react-vite-pwa.md)) y una API Fastify propia, en sus propios puertos. La app actual no cambia.
- **Esquema `arma` en la misma base Postgres:** las tablas propias (impresiones, hechos con su fuente, fuentes con su permiso, diseños, vistas y caché de fuentes) llevan migraciones propias. La app nueva **solo escribe en `arma.*`**. Lee del esquema `public` el catálogo, los precios y el inventario (este último con la RLS del usuario, [0018](0018-rls-forzado-con-usuario-por-conexion.md)) y la sesión de Better Auth, para saber quién es el usuario.
- **Procedencia por dato:** cada dato de una impresión (que existe, número, nombre, ilustrador, foto, precio, equivalencia) es una fila en `arma.facts` con su fuente. Cada fuente tiene un permiso: `ok`, `text_only`, `review`, `none` u `own`. Las fotos solo pueden venir de fuentes con permiso para imágenes (copias propias del catálogo y TCGdex).
- **Las reglas que reducen el Full son funciones puras** en `packages/core` y nunca borran impresiones: el Full es la verdad y la colección es una vista.

## Alternativas consideradas
- **Rutas y tablas nuevas en `apps/api` y `public`:** menos piezas, pero mezcla la opción nueva con la actual, que el usuario quiere mantener separadas mientras se prueba.
- **Base de datos aparte:** aislamiento total, pero sin acceso directo al inventario ni al catálogo. Habría que copiarlos o duplicarlos.
- **Una sola fuente "de verdad" por impresión, sin procedencia por dato:** más simple, pero no permite saber qué falta para producción ni combinar fuentes que se completan entre sí.

## Consecuencias
- Positivas: la app actual no corre riesgo; se puede borrar todo con `DROP SCHEMA arma CASCADE`; el modelo de procedencia permite un informe "Listo para producción".
- Negativas: dos APIs que comparten base. La app nueva depende de las tablas de `public`, así que un cambio en ellas puede romperla. Para salir a producción habrá que revisar los permisos de cada fuente y la autenticación, que hoy reutiliza la cookie de Better Auth.
