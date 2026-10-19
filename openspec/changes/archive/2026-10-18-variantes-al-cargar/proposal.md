# Proposal

## Why

Al cargar el Eevee de Sandstorm (EX2 #63), Cargar solo ofrece una variante: la automática según la rareza (Normal). Las demás solo se pueden cargar escribiendo un sufijo (`63r` para Reverse), y las que no tienen sufijo no se pueden cargar de ninguna forma. Así funcionaba también Nitsu. Pero el Full ya sabe que esa carta existe en inglés como Normal, Reverse, con 3 códigos e-Reader distintos (FXE-WTF-G7Z, -JPX y -TE5) y como "No e-Reader Logo".

## What Changes

- **En la ficha de la carta marcada, bajo su estado**, aparece "Variante" con una ficha por cada variante de la carta. La automática viene marcada; si no está en la lista, viene marcada la primera.
- **La variante marcada se carga:** "Cargar una" (que pasa a decir "Cargar una · Reverse"), el segundo clic en la carta y Enter con su número. La vista previa ("Se cargará…") y la foto de la ficha muestran esa variante.
- **Un sufijo escrito (`63r`) sigue mandando** sobre lo marcado, como hoy. Al marcar otra carta, la variante vuelve a la automática.
- **De dónde salen las variantes de una carta**, sin repetir:
  1. las de su Full en el idioma de la sesión; si el Full tiene la carta pero no en ese idioma, las de todos sus idiomas. Hoy solo existen Full para la familia Eevee;
  2. las del catálogo (`cards.variants`);
  3. las que ya tienes de esa carta en tu inventario;
  4. si no se conoce ninguna, Normal, Holo y Reverse.

  El orden es Normal, Holo, Reverse, 1st Edition, Poké Ball, Master Ball, Cosmos y después las de sello, por nombre.
- **Una variante de sello del Full se guarda en el inventario con el nombre que ya usa el catálogo**: `fxewtfg7z` para FXE-WTF-G7Z, `reverseholo` + código para un reverse con sello. Así esa copia cuenta en el Master Set y se ve igual en Nitsu.

**Fuera del alcance:**
- cambiar la sintaxis de la entrada o agregar sufijos nuevos;
- un selector de variante en cada carta de la vitrina (la etiqueta de la carta sigue diciendo la automática);
- completar las variantes del catálogo para las cartas que no tienen ninguna.

## Capabilities

### New Capabilities

### Modified Capabilities
- `carga-en-la-vitrina`: se agrega elegir la variante en la ficha antes de cargar.

## Impact

- **Datos:** sin migración. No escribe nada nuevo: carga las mismas filas de inventario, solo que con la variante elegida.
- **API:** `GET /api/sets/:id/cards` suma a cada carta las variantes de su Full (`full: [{ lang, variant }]`), leídas de `arma.printings` por `card_id`. Una consulta más por expansión, sin fuentes externas.
- **Código:**
  - `packages/core/src/arma.ts`: `inventoryVariant(finish, stamp)`, que convierte una variante del Full en el nombre del inventario, y `variantFromInventory`, que reconoce `reverseholo…` y `holo…`;
  - `apps/arma/server/session.ts`: compara los sellos sin guiones, para que `fxewtfg7z` del inventario encuentre `fxe-wtf-g7z` si el Full lo escribe así;
  - `apps/arma/server/inventory.ts`: `full` por carta;
  - `apps/arma/src/load.ts`: `variantsOf(card, lang)` y `planRow` con la variante elegida;
  - `apps/arma/src/Cargar.tsx`: las fichas de variante, el botón y la foto;
  - estilos en `styles.css`.
- **Documentación:** README.
