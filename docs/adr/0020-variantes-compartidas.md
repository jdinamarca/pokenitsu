# 0020. Variantes de cada carta compartidas, editadas por el dueño

- Estado: Aceptado
- Fecha: 2026-10-15

## Contexto
Para un master set no basta con la carta: cuentan sus variantes (reverse, Poké Ball, Master Ball, cosmos, 1st Edition, sellos de prerelease, staff o Pokémon Center, y las cartas de los mazos de Battle Academy, que traen el mazo y un número extra). Ninguna fuente abierta las tiene completas. Al revisar las 92 Eevee en inglés, TCGdex no tenía las reverse de la era BW–Sun & Moon, TCGplayer no tenía sellos, y ninguna tenía Battle Academy. Hay que revisarlas carta por carta, y esa revisión es la misma para todos los coleccionistas. Antes las variantes por carta venían de los checklists de PokeCottage (`collection_cards.vlist`, por colección y por usuario), que se quitaron en la migración 030.

## Decisión
- La lista de variantes de cada carta es un **dato compartido** del catálogo: las tablas `card_variants_list` y `card_variants_reviewed` no tienen `user_id` ni Row Level Security (migración 033). Es el mismo criterio de [0019](0019-artes-conectados-compartidos.md).
- Mientras el dueño no revise una carta, su lista sale de las fuentes: TCGdex (`variants_detailed`) y las variantes de TCGplayer de sus precios, combinadas por una regla de `packages/core` (`suggestVariants`). En cuanto el dueño edita la lista de una carta, esa carta queda revisada y las sugerencias no la vuelven a tocar.
- Solo el **dueño** agrega o quita variantes. Para las demás cuentas la API responde 403.
- Lo que tiene cada persona sigue saliendo de su inventario, que es por usuario. Quitar una variante nunca borra copias.
- Las variantes estándar conservan sus identificadores de siempre (`normal`, `reverse`, `firstedition`, `pokeballholo`…). Las demás usan `acabado~sello` o `acabado~ba-mazo-nº`.

## Alternativas consideradas
- **Variantes por colección y por usuario (como el `vlist` de antes):** cada coleccionista tendría que repetir la misma investigación.
- **Solo las sugerencias de las fuentes, sin edición:** quedan vacíos conocidos (reverse BW–SM, sellos, Battle Academy) y errores, como promos holo que TCGdex llama "normal".
- **Usar Bulbapedia como fuente:** su licencia (CC BY-NC-SA) es no comercial. Queda pendiente revisarla antes de usarla.

## Consecuencias
- Positivas: una sola revisión sirve a todos, y los espacios de las colecciones reflejan el master set real.
- Negativas: el avance de las colecciones baja al pasar de un espacio por carta a uno por variante. Si otra persona tiene que curar variantes, hará falta el rol de administrador que ya anticipaba el 0019.
