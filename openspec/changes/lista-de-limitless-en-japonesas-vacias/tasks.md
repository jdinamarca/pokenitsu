## 1. Datos

- [x] 1.1 Migración `013_lista_de_limitless.sql`: columna `public.cards.list_source` (referencia `arma.sources`)
- [x] 1.2 `jaLists.ts`: `parseLimitlessList`, `jaLocalId`, `limitlessListUrl`, `fillJaSetFromLimitless` (modo local, solo expansiones que TCGdex respondió vacías, Pokédex por nombre, una a la vez por expansión, cache de un día)

## 2. Servidor

- [x] 2.1 `GET /api/sets/:id/cards`: llenar desde Limitless después de TCGdex y devolver `list` en cada carta
- [x] 2.2 Trabajo de fotos del catálogo: primer paso con las listas de las expansiones vacías (TCGdex si nunca se abrió, después Limitless) y su avance (`lists`)
- [x] 2.3 Enlazar las impresiones del Full de la expansión con las cartas nuevas

## 3. Interfaz

- [x] 3.1 Ficha de Cargar: "Dato de Limitless · solo uso local"
- [x] 3.2 Por reemplazar: línea de avance de las listas

## 4. Verificación

- [x] 4.1 Pruebas de `parseLimitlessList` con filas reales de S10D y SV4a
- [x] 4.2 En una copia de la base: abrir S10D en Cargar, ver las 88 cartas, la 052 イーブイ con Pokédex 133 y la nota, y cargarla; S10a sigue con las cartas de TCGdex; sin modo local no se llena
- [x] 4.3 En la copia: la descarga de fotos llena las expansiones vacías y muestra su avance
