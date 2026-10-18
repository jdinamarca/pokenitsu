# Informe de auditoría: familia Eevee

Hecho el 2026-10-18 sobre una copia de la base (`pokemon_fotos`). Se reimportó Eevee y se importaron sus 8 evoluciones con las mismas fuentes y reglas:
- TCGdex en 13 idiomas;
- pokemontcg.io y TCGplayer;
- PokeCottage (solo texto);
- Bulbapedia (lista de cartas e idiomas por expansión);
- WikiDex;
- las deducciones de idioma.

Las cifras son del **Full**, sin reglas. Con la vista "Master set inglés", "Por verificar" baja; en Eevee queda en 97.

## Resultado por Pokémon

| Pokémon | Impresiones | Diseños | En inglés | En japonés | Por verificar | Motivos | Requests nuevas |
|---|---|---|---|---|---|---|---|
| Eevee (#133) | 1.113 | 318 | 212 | 178 | 214 | una sola fuente 206, variante sin nombre 15, idioma deducido 6, no salió en ese idioma 2, región 1 | 580 |
| Vaporeon (#134) | 473 | 110 | 95 | 67 | 84 | una sola fuente 82, idioma deducido 1, no salió en ese idioma 1 | 235 |
| Jolteon (#135) | 491 | 120 | 101 | 77 | 83 | una sola fuente 81, idioma deducido 1, no salió en ese idioma 1 | 242 |
| Flareon (#136) | 502 | 125 | 99 | 74 | 86 | una sola fuente 84, idioma deducido 1, no salió en ese idioma 1 | 247 |
| Espeon (#196) | 486 | 137 | 98 | 72 | 87 | una sola fuente 83, idioma deducido 3, no salió en ese idioma 1 | 268 |
| Umbreon (#197) | 541 | 156 | 107 | 81 | 100 | una sola fuente 91, idioma deducido 7, no salió en ese idioma 2 | 306 |
| Leafeon (#470) | 415 | 118 | 77 | 55 | 68 | una sola fuente 65, idioma deducido 2, no salió en ese idioma 1 | 252 |
| Glaceon (#471) | 385 | 112 | 71 | 50 | 60 | una sola fuente 57, idioma deducido 2, no salió en ese idioma 1 | 245 |
| Sylveon (#700) | 414 | 134 | 77 | 58 | 67 | una sola fuente 65, idioma deducido 2 | 273 |

- **Una sola fuente:** solo una fuente dice que la impresión existe, aunque las demás conocen la carta. Hay que revisarla carta por carta contra Bulbapedia ("<Pokémon> (TCG)") y las demás fuentes.
- **Idioma deducido:** el idioma se dedujo de la lista de expansiones de TCGdex, que incluye traducciones solo digitales.
- **No salió en ese idioma:** una fuente lo dice, pero otra lo contradice.

Quiénes son la fuente única más frecuente en cada uno:

- **Eevee**: TCGdex 78, PokeCottage 70, Bulbapedia (idiomas) 54
- **Vaporeon**: TCGdex 31, PokeCottage 29, Bulbapedia (idiomas) 21
- **Jolteon**: TCGdex 32, PokeCottage 29, Bulbapedia (idiomas) 19
- **Flareon**: TCGdex 32, PokeCottage 30, Bulbapedia (idiomas) 21
- **Espeon**: TCGdex 32, PokeCottage 31, Bulbapedia (idiomas) 18
- **Umbreon**: PokeCottage 33, TCGdex 32, Bulbapedia (idiomas) 25
- **Leafeon**: TCGdex 32, PokeCottage 23, Bulbapedia (idiomas) 9
- **Glaceon**: TCGdex 28, PokeCottage 19, Bulbapedia (idiomas) 9
- **Sylveon**: PokeCottage 31, TCGdex 28, Bulbapedia (idiomas) 5

## Errores del importador que se corrigieron

1. **Una carta de TCGdex sin expansión tumbaba toda la fuente** ("Cannot read properties of undefined (reading 'id')"). Ahora esa carta se salta. Al reimportar, Eevee quedó sin TCGdex: perdió 13 impresiones en otros idiomas y agregó 22 holo sin confirmar.
2. **La causa de esas cartas sin expansión era el completado de detalles (#87).** Guardaba en la cache la respuesta de TCGdex recortada (sin la expansión) bajo la misma dirección que lee el importador.
   - Ahora guarda bajo su propia clave (`…#detalles`), y el importador ignora una respuesta de la cache que no traiga la expansión.
   - En la base real, las cartas japonesas que "Completar detalles" consultó (SV8a #223 y #224, dos Eevee ex, entre ellas) quedan así hasta que vence la cache, que dura un día. Con este cambio dejan de afectar.
3. **Una entrada de PokeCottage sin expansión tumbaba toda la fuente** (Vaporeon: `134-jpn_dp4a-14-firstEdition` y `-normal`, de "Moonlit Pursuit/Dawn Dash", que no trae `set.id`). Ahora se salta y queda nombrada en el resumen (`incomplete`). Solo se considera que cambió el formato si ninguna entrada está completa. Con esto, Vaporeon pasó de 371 a 473 impresiones.

Después de las correcciones, la reimportación de Eevee dejó **las mismas 1.113 impresiones** que había antes: ninguna nueva y ninguna quitada.

## Revisión dirigida (regla de veracidad)

- **Expansiones japonesas (`ja-*`, `jpn_*`) en idioma occidental:** ninguna.
- **Sellos exclusivos de Japón en cartas occidentales:** el importador no marcó ninguno como mal archivado (`misfiled` en 0 para las 8).
- **La misma carta como holo y como holo cosmos:** un caso, **Jolteon de Ancient Origins #26 en inglés** (`JOL·XY7·26·EN·HC`). Solo PokeCottage lo dice; pokemontcg.io, TCGdex y TCGplayer conocen solo la holo y la reverse. Queda "Por verificar" (posible versión de blíster).

## Pendiente (cambio aparte)

- Revisar carta por carta las impresiones "Por verificar" de cada evolución, como los 97 de Eevee.
- Las 2 entradas de Vaporeon de "Moonlit Pursuit/Dawn Dash" (DPBP#160, 1st Edition y normal): ubicarlas a mano en su expansión japonesa.
