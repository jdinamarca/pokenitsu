# 0023. "Arma tu colección" escribe el inventario compartido, con las operaciones de un paquete

- Estado: Aceptado
- Fecha: 2026-10-16

## Contexto
[0021](0021-arma-tu-coleccion-reemplaza-a-nitsu.md) decidió que "Arma tu colección" reemplaza a Nitsu por etapas, y [0022](0022-cuentas-en-arma-tu-coleccion.md) le dio sus propias cuentas. La segunda etapa trae a arma las dos pantallas que más se usan, Cargar y Mi inventario. Hasta ahora arma solo escribía en su esquema (`arma`) y leía el inventario en solo lectura ([0020](0020-arma-tu-coleccion-app-aparte.md)). Para cargar cartas tiene que escribir en el inventario del usuario, que es el mismo que usa Nitsu, mientras Nitsu siga funcionando.

## Decisión
- **Arma escribe en las tablas de `public` del inventario** (`inventory`, `inventory_log`, `price_overrides`) y lee `locations`, `user_settings`, `card_prices` y `variant_images`. No hay inventario aparte: lo que se carga en una app se ve en la otra.
- **Las operaciones viven en un paquete, `@pokenitsu/inventory`:** sumar o restar copias, deshacer (un rango entero), mover, marcar personales, mi precio, resolver una carta por expansión y número, bajar las cartas de una expansión (pokemontcg.io y TCGdex) y el tipo de cambio. El SQL se movió tal cual desde la API de Nitsu, que ahora también lo usa. La cuenta de copias (cuántas quedan, cuáles son personales, cuáles se mueven primero) está en `@pokenitsu/core`, con pruebas.
- **Arma toca `public` solo dentro de `asViewer`** (`apps/arma/server/viewerTx.ts`): una transacción con `set_config('app.user_id', …)`. La RLS forzada ([0018](0018-rls-forzado-con-usuario-por-conexion.md)) deja a cada cuenta en sus filas. Una consulta fuera del helper no ve filas.
- **Mismo contrato que Nitsu:** las rutas `POST /api/inventory/add`, `/undo`, `/move`, `/personal` y `PUT /api/prices/own` de arma reciben y responden lo mismo que las de Nitsu.
- **Lo que arma no hace todavía:** gestionar ubicaciones, bajar precios ni completar los detalles de las cartas japonesas (Pokédex, ilustrador). Usa lo que Nitsu dejó guardado.

## Alternativas consideradas
- **Que arma llame por HTTP a la API de Nitsu:** volvería la dependencia que [0022](0022-cuentas-en-arma-tu-coleccion.md) sacó.
- **Copiar el SQL en arma:** dos implementaciones que se separan con el tiempo. Una carga daría filas distintas según la app.
- **Un inventario propio de arma, migrado después:** obligaría a sincronizar dos inventarios mientras convivan las apps.

## Consecuencias
- Positivas: una sola implementación de cada operación, verificada con una prueba diferencial (la API de Nitsu antes y después del cambio deja las mismas filas). Arma puede cargar en cualquier expansión aunque Nitsu nunca la haya abierto.
- Negativas: arma ya no es "solo lectura" sobre `public`; un error en arma puede tocar el inventario real (por eso todo pasa por el paquete y por `asViewer`). Hay otro paquete que compilar. Mientras Nitsu no corra, las cartas japonesas recién bajadas no tienen Pokédex y, sin foto, tampoco foto de referencia.
