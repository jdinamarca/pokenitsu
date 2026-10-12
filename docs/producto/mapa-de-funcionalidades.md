# Mapa de funcionalidades

Qué hace la plataforma, qué es esencial y en qué orden se construye. El detalle de cada función está en `openspec/specs/` (lo que existe) y en `openspec/changes/` (lo que viene). Las decisiones técnicas están en `docs/adr/`.

## Columna vertebral

Lo que hace que la plataforma valga la pena. Todo lo demás se apoya en esto.

| # | Funcionalidad | Pregunta que responde | Estado |
|---|---|---|---|
| 1 | **Ingreso de cartas** | ¿Cómo cargo 6.000 cartas sin morir en el intento? | Existe con teclado (`MEW ES` → `25r` ↵). Propuestos: rangos y repetición, escáner con cámara |
| 2 | **Pokédex por generación** | ¿Completé Kanto? ¿Con qué: challa, holo, ex, IR, SIR? ¿En qué idioma? | Existe como "kits de Pokédex" (solo copias para vender). Propuesto: niveles, mejor carta por especie, más filtros |
| 3 | **Progreso de expansiones** | ¿Cuánto me falta para completar 151? | No existe. Propuesto: avance al cargar y vista de expansiones con 3 modos |

## Funcionalidades de apoyo (ya existen)

- **Precios en CLP**: TCGplayer, Cardmarket, precio propio en USD, % por estado.
- **Mi colección**: filtros, orden, ficha de carta, edición de copias.
- **Ubicaciones**: cajas y carpetas con reglas; gana la más específica.
- **Lotes**: ventas y compras a un % del mercado.
- **Mis colecciones**: master sets por Pokémon con checklists de PokeCottage.
- **Ilustradores** y **artes conectados**: kits curados.
- **Respaldo y exportación**: JSON y CSV.

## Plataforma (para abrir la alfa)

- **Base técnica**: monorepo, TypeScript, pruebas del núcleo y CI (`monorepo-typescript-y-pruebas-del-nucleo`).
- **Cuentas y multiusuario**: login y datos separados por usuario (ADR 0010, 0011).
- **Front nuevo**: React + PWA, para usarla bien desde el celular (ADR 0012).
- **Despliegue**: Vercel + Fly.io + Supabase (ADR 0015).

## Orden recomendado

1. **Base técnica** (`monorepo-typescript-y-pruebas-del-nucleo`): las reglas nuevas de niveles y progreso viven en `packages/core` con pruebas desde el primer día.
2. **Columna vertebral, parte 1** (se pueden hacer en cualquier orden entre sí):
   - `carga-por-rangos-y-repeticion`: chico, mejora la carga de inmediato.
   - `pokedex-por-generacion`.
   - `progreso-de-expansiones`.
3. **Cuentas y despliegue de la alfa.**
4. **Columna vertebral, parte 2**: `escaner-de-cartas`. Va después del despliegue porque el navegador solo permite usar la cámara en sitios con HTTPS, y rinde mejor con el front nuevo en el celular.

## Conceptos compartidos

### Nivel de una carta
La Pokédex por generación clasifica cada copia en un nivel, de menor a mayor. La clasificación se calcula con la rareza, el nombre (mecánica: ex, GX, V…) y la variante de la copia:

| Nivel | Qué incluye |
|---|---|
| Challa | Común, poco común y rara, sin mecánica, en variante normal |
| Challa holo | Lo mismo en holo o reverse, y las raras holo sin mecánica |
| Con mecánica | ex, EX, GX, V, VMAX, VSTAR, BREAK, LV.X, Prisma, Radiante, Mega… que no son full art (incluye Doble rara) |
| Variante especial | 1st Edition, Poké Ball, Master Ball, sellos y otras variantes de checklist |
| Variocolor | Variocolor (shiny) |
| Full art | Ultra rara, full art, AS Táctico |
| IR | Ilustración rara, Galería de entrenador, Character Rare |
| SIR | Ilustración rara especial |
| Secreta | Hiper rara (dorada), arcoíris, secreta, asombrosa, estrella |

Las promos se clasifican por sus características (con mecánica, holo o challa).

### Modos de completitud de una expansión
- **Base**: los números impresos (ej. 165/165).
- **Con secretas**: también las cartas sobre el número impreso y las subcolecciones (ej. TG, GG).
- **Master set**: cada variante de cada carta (normal, reverse, holo…).
