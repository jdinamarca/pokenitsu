# Proposal

## Why

TCGdex no tiene imagen para unas 3.500 de las 4.435 cartas japonesas del catálogo (en Rocket Gang, ninguna). Hoy se ve una imagen de referencia de otra expansión, que ayuda a reconocer el Pokémon pero no muestra la carta real. PokeCottage sí tiene las fotos de las cartas japonesas de Pokémon en sus checklists por especie, y el usuario quiere además poder poner fácilmente la foto de sus propias cartas.

## What Changes

- **Fotos de PokeCottage a pedido**: al elegir una expansión japonesa con cartas sin foto, la API busca en la checklist de PokeCottage de cada Pokémon de esas cartas (`<dex>-<nombre>.json`) las fotos de las cartas japonesas, las cruza por código de expansión y número, y guarda el link en el catálogo. Cada especie se consulta una vez (se recuerda 30 días) y llena todas las expansiones japonesas a la vez. Solo cartas de Pokémon: entrenadores y energías no tienen checklist.
- **Solo con permiso explícito de configuración**: funciona si `POKECOTTAGE_IMAGES=on` en `.env`. Los términos de PokeCottage permiten uso personal; para la alfa con testers queda apagado salvo que PokeCottage lo autorice.
- **Foto propia más rápida**: si la carta no tiene foto real, la vista previa muestra "📷 Tomar o subir la foto de tu carta"; en el celular el diálogo ofrece "📸 Tomar foto" con la cámara. Las fotos grandes se achican en el navegador antes de subirlas.

**Fuera del alcance:**
- Pokellector y TCG Collector (sus términos prohíben o bloquean el acceso automático).
- Descargar o copiar las imágenes de PokeCottage: solo se guarda su link, como ya hace la importación de checklists.
- Fotos de entrenadores/energías japonesas (solo las propias).
- Datos del usuario: no se tocan; se agregan links de imagen al catálogo y una tabla de control. El inventario no cambia.

## Capabilities

### New Capabilities
<!-- Ninguna. -->

### Modified Capabilities
- `fotos-de-variantes`: fotos de PokeCottage para cartas japonesas sin imagen, y foto propia desde la vista previa y la cámara.

## Impact

- Migración `025_pokecottage_checks.sql`.
- `apps/api/src/pokecottage.js` (`fillJaImages`, nombre de archivo por especie, equivalencias de código), `index.js` (`POST /api/sets/:id/photos`).
- `apps/web/public/index.html`: pedir fotos al elegir una expansión japonesa, botón de foto en la vista previa, cámara y achicado en el diálogo de foto.
- `.env` local del usuario: `POKECOTTAGE_IMAGES=on`. README.
- Se apila sobre el PR #14.
