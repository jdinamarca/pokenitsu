# Design

## Context

- `/api/artists` agrupa `cards.artist` de las expansiones internacionales (≈1.700 ilustradores) con su total; el avance del usuario se calcula en el front desde `data.inv` y `meta()` (`m[2]` = ilustrador), solo con expansiones `ptcg`.
- `/api/artists/cards?name=` devuelve todas las cartas de un ilustrador con su expansión y año.
- La Pokédex ya tiene: `cardTier`, estilos `.dexhead`, `.dexsum`, `.album`/`.slot`, selector de copias y panel de filtros. Los lotes ya tienen `POST /api/lots` y `POST /api/lots/:id/items/batch`.

## Decisions

### 1. Mismo lenguaje visual que la Pokédex y Expansiones
Lista de tarjetas (`.artcard`) con portada (carta en formato completo, recortada a la ilustración), nombre, estrella, avance y, en "Para vender", "N cartas · ~$X". El detalle reutiliza `.dexsum` (avance, barra de niveles clicable, kit) y `.album`/`.slot` (faltantes en blanco y negro). Se muestran 60 tarjetas y "Ver más" (la lista completa tiene ~1.700).

### 2. Portada
`/api/artists` agrega `img`: la carta más reciente del ilustrador en el catálogo (excluyendo expansiones de promos y McDonald's, como la referencia de la Pokédex). En el front, si el usuario tiene cartas del ilustrador, la portada es la imagen de su copia de mayor nivel.

### 3. Cálculo en el front
Un solo recorrido de `data.inv` agrupa por ilustrador: cartas distintas que cuentan (con filtros de copias, idioma, serie, niveles), mejor copia, y para el kit: copias para vender, cartas distintas y valor (`priceOf × forSale`). Se recalcula al cambiar filtros o el inventario.

### 4. Favoritos en la base de datos
Tabla `favorite_artists(name text PRIMARY KEY, created_at)`. Se guardan en la base (no en el navegador) porque son datos del usuario: sobreviven a cambiar de dispositivo y pasarán a ser por usuario con multiusuario (ADR 0010). Rutas: `GET /api/artists/favorites`, `PUT /api/artists/favorites` `{name, on}`.

### 5. Kit → lote
"Crear lote de venta" crea un lote `sell` llamado "Kit <ilustrador>" y le agrega en lote (`items/batch`) cada fila del inventario de ese ilustrador con copias para vender (respetando idioma, serie y niveles), por sus copias para vender. Luego abre la pestaña Lotes en ese lote.

### 6. Aviso de favorito
En la carga (`commitEntry`, y en rangos agrupado), si el ilustrador de la carta cargada es favorito, un aviso dorado con el nombre y su avance. En un rango, un solo aviso con los favoritos encontrados.

## Risks / Trade-offs

- [1.700 tarjetas con imágenes] → se pintan 60 y "Ver más"; imágenes con `loading="lazy"`.
- [Nombres de ilustradores escritos distinto en distintas fuentes (ej. "kawayoo" / "Kawayoo")] → fuera de alcance; se ve como dos ilustradores.
- [La portada del catálogo puede ser una carta japonesa-only o sin imagen] → se usa la más reciente con imagen; si falla, se oculta.
