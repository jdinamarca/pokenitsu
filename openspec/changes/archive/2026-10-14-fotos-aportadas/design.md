# Design

## Context

- **Fotos propias de hoy:** son privadas, por usuario (`variant_images` con RLS). Se suben a `/api/card-image/upload`, se achican en el navegador a 1200 px y se guardan en `ART_DIR` (`public/art/`).
- **Fotos del catálogo:** son compartidas. Están en `cards.image_*`, y la copia propia en `card_images`, con WebP de 245 y 600 px en `IMAGE_DIR`, servidos por `/img/…`.
- **Dueño:** es la primera cuenta (`isOwner`/`ownerOnly` en `index.js`). Hoy cura los artes conectados.
- **Producción:** la base usa el rol `nitsu_app` sin BYPASSRLS. Las lecturas entre usuarios usan `asSystem()` (`db.js`), que activa `app.all_users`, la vía que ya prevén las políticas `por_usuario`.

## Goals / Non-Goals

**Goals:**
- Que cualquier cuenta pueda proponer la foto de una carta sin foto, con consentimiento registrado.
- Que solo el dueño publique, después de revisar.
- Que la foto publicada se sirva igual que el resto del catálogo, con crédito.
- Que nadie vea los aportes de otros antes de que se aprueben, salvo el dueño.

**Non-Goals:**
- Detectar la carta automáticamente.
- Moderar con IA.
- Avisar por correo.
- Llevar un historial de versiones de una foto.

## Decisions

1. **Tabla `photo_submissions`** con: id, `card_id`, `user_id` (RLS: cada uno ve las suyas), archivo, `status` (`pending` | `approved` | `rejected`), `reason`, `consent_text`, `consent_at`, `rotation`, `created_at`, `reviewed_at`.
   - El dueño las lee y actualiza con `asSystem()`, después de `ownerOnly`. Es el mismo mecanismo que usan los precios compartidos y las migraciones, y funciona con el rol sin BYPASSRLS.
   - *Alternativa descartada:* funciones `SECURITY DEFINER`. Agregaban SQL nuevo sin ganar seguridad frente a `asSystem`, que ya existe.
   - *Alternativa descartada:* reutilizar `variant_images`. Es por variante y por usuario, y mezclar privado con público complica la RLS.
2. **Encuadre en el navegador:** al compartir, quien sube la foto la ajusta bajo un marco 63:88 (arrastrar y zoom). El navegador envía el recorte, de hasta 1200 px de alto.
   - El servidor solo gira, si el dueño lo pide, y genera los WebP. Es simple y no requiere detección de bordes.
   - El "recorte automático" de la maqueta queda como mejora futura.
3. **Al aprobar:**
   - Se generan `cards/<set>/<id>-small.webp` y `-large.webp` con la misma función `save` de `imagenes.js`.
   - Se marca `card_images` con `status = 'ok'`, `source = 'aporte'` y `credit_user_id`.
   - `cards.image_*` pasa a apuntar a `/img/…`.
   - Así `/img`, `bigImg`, la sincronización del catálogo (que no pisa imágenes `/img/`) y la futura `imagenes:subir` funcionan sin cambios.
4. **Solo cartas sin foto:**
   - El interruptor aparece solo si la carta no tiene imagen.
   - El servidor rechaza un aporte si la carta ya tiene `card_images` ok.
   - Si dos personas aportan la misma carta, al aprobar una las demás pendientes quedan rechazadas con el motivo "Ya tiene foto".
5. **Crédito:** se muestra el nombre de la cuenta (`user.name`), guardado como referencia y no como copia. Si la cuenta se borra, la foto queda sin crédito.
6. **Se buscan:** una consulta con `asSystem()` devuelve las cartas sin foto ordenadas por cuántas cuentas distintas las tienen en su inventario. Devuelve solo números, nunca quién las tiene.
   - "Sin foto" significa que nuestra copia no la tiene y que la carta no muestra un link que funcione. Los links rotos (404) cuentan como sin foto; los de Scrydex cuentan como con foto, porque se ven.
7. **Términos versionados:**
   - `terminos-fotos.html` lleva una versión, por ejemplo `2026-10-14`.
   - Cada aporte guarda `terms_version` y `consent_at`, y el servidor rechaza un aporte que no traiga la versión vigente.
   - Si los términos cambian, la siguiente vez que alguien comparta se le pide aceptarlos de nuevo.
8. **Reportes y bloqueo:**
   - Tabla `photo_reports`: `card_id`, motivo, contacto, mensaje, quién reporta (o nadie, si no tiene sesión), estado y fecha.
   - Tabla `photo_contributor_blocks`: `user_id`, motivo y fecha.
   - Quitar una foto aportada borra sus WebP, vuelve `cards.image_*` al link original (o a ninguno), deja `card_images` como `missing` y marca el aporte como `withdrawn`.
   - El reporte se puede enviar sin sesión, porque el dueño de una foto robada puede no tener cuenta. Tiene un límite simple por IP.
9. **Archivos de aportes pendientes:** van en `IMAGE_DIR/aportes/<id>.jpg`, fuera de `public/`. Solo el dueño y su autor los pueden pedir, por una ruta autenticada.

## Risks / Trade-offs

- **Fotos ajenas declaradas como propias:**
  - Quien aporta acepta los términos, y queda registrado qué versión aceptó y cuándo.
  - El dueño revisa marcas de agua y fondos de tienda.
  - Cualquiera puede reportar una foto, y quitarla o bloquear a quien la subió se hace en un toque.
  - Los términos no reemplazan la revisión de un abogado antes del lanzamiento.
- **Cola grande:** si llegan muchas fotos, la revisión es manual. El contador y el "Saltar" ayudan. Sumar revisores queda fuera del alcance.
- **Calidad dispareja frente a los escaneos:** se mitiga con el encuadre 63:88, los consejos del diálogo y la lista de chequeo.
- **Espacio:** los aportes rechazados se borran del disco a los 30 días.
