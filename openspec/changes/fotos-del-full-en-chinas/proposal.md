# Proposal

## Why

Las cartas de las expansiones chinas (pestaña Chinas de Cargar) no muestran la foto de su impresión del Full aunque esté bajada: la Eevee CBB4C 401 tiene la foto local de PokeCottage y Cargar la muestra sin foto. La consulta que elige la impresión del Full solo acepta el japonés para una expansión japonesa y el inglés para cualquier otra, así que una carta china (idioma ZH-CN o ZH-TW) nunca encuentra una impresión en su idioma. La spec ya pide que sea "una que esté en su mismo idioma".

## What Changes

- La impresión del Full que da su foto a una carta del catálogo SHALL estar en el idioma de su expansión: japonés para una japonesa, chino simplificado o tradicional para una china, e inglés para una internacional (las internacionales no tienen idioma en el catálogo).
- Se suma un escenario para una carta china.

## Capabilities

### New Capabilities

### Modified Capabilities
- `fotos-del-catalogo-en-arma`: la regla de idioma de la impresión del Full cubre las expansiones chinas.

## Impact

- `apps/arma/server/catalogPhotos.ts` (`PRINTED_PHOTOS`): el idioma de la impresión pasa a ser el de la expansión, o inglés si no tiene. Lo usan la foto de la carta en Cargar e Inventario y la galería Por reemplazar.
- Sin migraciones ni cambios en los datos. 66 de las 1.727 cartas chinas sin foto del catálogo ganan la foto de su Full (las de la línea de Eevee); las demás siguen sin foto porque ninguna fuente la tiene.
