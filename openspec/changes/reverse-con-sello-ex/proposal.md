# Proposal

## Why

En Eevee δ #68 de EX Delta Species, Cargar ofrecía "Reverse" y "Expansion Stamp" como dos variantes, y el Full las mostraba como dos impresiones. Es la misma carta:
- TCGplayer y pokemontcg la llaman "Reverse", sin sello;
- TCGdex la anota como normal con el sello de la expansión;
- PokeCottage la llama "Expansion Stamp" (su identificador es `133-ex11-68-reverseHolo-hd5chxcnz`).

En las expansiones EX desde Team Rocket Returns (ex7) hasta Power Keepers (ex16), PokeCottage nunca lista una Reverse Holo sin sello: en esas expansiones, la reverse holo es la carta con el logo de la expansión estampado. En Sandstorm (ex2) sí lista una Reverse Holo sin sello. El usuario pidió unirlas.

## What Changes

- **Al fusionar las fuentes**, en una carta de una expansión EX (`ex1`–`ex16`) donde:
  - PokeCottage tiene el sello de la expansión;
  - PokeCottage no tiene una reverse sin sello;
  - otra fuente sí la tiene;

  el sello de la expansión pasa a ser esa Reverse, como sea que lo anote cada fuente: TCGdex lo pone como normal (Delta Species #68), reverse (Unseen Forces #55) o holo (las raras holo, como Vaporeon #18), y PokeCottage como normal. Queda una sola impresión, con el código de la Reverse (`EEV·EX11·68·EN·R`) y las cuatro fuentes detrás.
- **En la vitrina**, esa impresión se llama "Reverse · Sello de la expansión", porque una de sus fuentes dice que lleva el sello.
- **En la familia Eevee** se unen 10 impresiones:
  - de EX Unseen Forces: Eevee #55, Vaporeon #19, Jolteon #8 y Flareon #5;
  - de EX Delta Species: Eevee #68 y #69, Vaporeon #18, Jolteon #7, Flareon #5, Espeon #4 y Umbreon #17.

  Con las anotaciones de TCGdex como reverse u holo, se quitan 12 impresiones en total al volver a traer los 6 Full.
- **No cambian** los sellos de la expansión de Obsidian Flames, Undaunted ni Prismatic Evolutions, porque PokeCottage sí tiene ahí una reverse aparte.

**Fuera del alcance:**
- reimportar automáticamente: el usuario aprieta "Volver a traer" en cada Pokémon;
- Obsidian Flames y Prismatic Evolutions, donde TCGdex (holo o reverse con sello) y PokeCottage (normal con sello) también anotan distinto un mismo sello. Queda anotado para revisarlo aparte.

## Capabilities

### New Capabilities

### Modified Capabilities
- `universo-de-impresiones`: una regla más al fusionar las fuentes.

## Impact

- **Datos:** sin migración ni cambios en el inventario.
  - La impresión unida conserva el código de la Reverse, así que una copia "reverse" que ya tengas sigue contando.
  - La impresión "·N~SET-LOGO" desaparece al volver a traer el Full. Sus fotos solo locales pasan a la Reverse por la ref de PokeCottage, como ya hace el importador.
- **Código:**
  - `packages/core/src/arma.ts`: `mergeClaims`, con pruebas;
  - `apps/arma/src/model.ts`: `variantName`, con pruebas.
