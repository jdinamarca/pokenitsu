## 1. Fusión

- [ ] 1.1 `pokecottage.ts`: `finishUnknown` en los sellos sin `foil`; core `mergeClaims`: el sello de PokeCottage toma el único acabado de TCGdex, con pruebas (Prismatic Evolutions #75, Espeon #86 sin cambio)
- [ ] 1.2 core `mergeClaims`: un sello con su año (`trick-or-trade` / `trick-or-trade24`), con prueba

## 2. Bulbapedia (cartas adicionales)

- [ ] 2.1 core `parseAdditionalCards`, con pruebas sobre las líneas de Obsidian Flames y Prismatic Evolutions
- [ ] 2.2 `bulbapedia-idiomas.ts` devuelve las cartas adicionales; `importer.ts` las aplica; migración `010` con la fuente

## 3. Cruce de expansiones

- [ ] 3.1 `catalog.ts`: cruce por identificador; prueba de que `hgss3` y `svp` cruzan

## 4. Verificación

- [ ] 4.1 En la copia `pokemon_fotos`, volver a traer los 9 Full:
  - Prismatic Evolutions tiene 9 impresiones menos;
  - Espeon #86 y Umbreon #130 quedan como dice Bulbapedia;
  - no quedan impresiones `td:hgss3` ni `td:svp`, y ninguna carta de Undaunted o SVP se pierde;
  - las copias del inventario siguen contando;
  - `pnpm test`, `typecheck` y `lint`; las pruebas de Chrome `master`, `mazos` y `variantes`; huella de la base real igual
- [ ] 4.2 README
