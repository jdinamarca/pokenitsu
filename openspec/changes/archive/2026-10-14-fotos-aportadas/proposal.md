# Proposal

## Why

Faltan 3.630 imágenes del catálogo, y 3.547 son japonesas que ninguna fuente abierta tiene. PokeCottage negó el permiso, y Limitless, TCG Collector y TCGplayer todavía no responden. La única forma de completarlas sin depender de nadie es que **los coleccionistas aporten fotos de sus propias cartas**, con autorización explícita, y que el dueño las apruebe. El usuario eligió el flujo de las maquetas V, W y X del canvas, con dos decisiones:
- cualquier cuenta puede aportar;
- el crédito se muestra con el nombre de quien sacó la foto.

## What Changes

- **Aportar** (diálogo de foto que ya existe):
  - Si la carta no tiene foto en Nitsu, aparece el interruptor **"Compartir con la comunidad"**.
  - Para compartirla hay que marcar *"Acepto los Términos para aportar fotos"*, con enlace a la página de términos. Se guarda qué versión se aceptó y cuándo.
  - La foto se encuadra en un marco con la forma de la carta antes de enviarla.
  - Sin compartir, todo sigue como hoy: la foto queda solo para ti.
- **Revisar** (pestaña nueva, solo para el dueño):
  - "📸 Fotos por revisar", con un contador.
  - Muestra la foto enviada, cómo quedará, los datos de la carta, quién la mandó y cuántas fotos le aprobaron antes.
  - Antes de aprobar hay que marcar 3 cosas: carta correcta, nítida y entera, y que no parece sacada de otro sitio.
  - Se puede rechazar con un motivo: borrosa, carta equivocada, con sleeve o reflejo, o no parece suya.
  - Se puede girar la foto.
- **Publicar:**
  - Al aprobarla, la foto pasa a ser la imagen de la carta para todos, en WebP de 245 y 600 px, igual que la copia propia del catálogo.
  - Lleva el crédito **"📸 Foto de <nombre>"** en la ficha de la carta.
- **Mis aportes** (en Mi perfil):
  - Muestra las fotos aprobadas, las que están en revisión y las rechazadas, con su motivo y la opción de reintentar.
  - Muestra la insignia "📸 Fotógrafo/a Nitsu" desde la primera foto aprobada.
- **Términos para aportar fotos** (`/terminos-fotos`), una página corta. Quien aporta declara que:
  - sacó la foto él mismo y la carta es suya o la tiene en sus manos, sin copiarla de tiendas, eBay, redes ni otros sitios;
  - da a Nitsu Collectibles permiso gratuito y no exclusivo para mostrarla, recortarla y achicarla dentro de la app, con su crédito;
  - es responsable si la foto es de otra persona.

  Además, los términos dicen que:
  - Nitsu puede quitar cualquier foto y bloquear los aportes de quien suba fotos ajenas;
  - quien aportó una foto puede pedir que se quite;
  - cualquiera puede reportar una foto que sea suya.
- **Reportar esta foto:** un enlace junto al crédito.
  - Quien reporta indica el motivo (*"Es mi foto"*, *"No corresponde a la carta"*, *"Otro"*) y un contacto.
  - Los reportes llegan a la pestaña de revisión del dueño.
- **Quitar y bloquear:**
  - Desde un reporte, o desde la ficha, el dueño puede quitar una foto aportada: la carta vuelve a quedar sin foto y el aporte queda como "retirado".
  - También puede bloquear los aportes de esa cuenta: no podrá enviar más fotos, pero sigue usando la app.
- **Se buscan:** las cartas sin foto que más coleccionistas tienen, con el avance del catálogo con foto, para saber qué conviene fotografiar.

**Fuera del alcance:**
- Revisión legal de los términos: el texto es un borrador razonable y conviene que lo revise un abogado antes del lanzamiento público.
- Recorte automático por detección de bordes: en esta versión el encuadre lo hace quien sube la foto.
- Avisos por correo cuando se aprueba o rechaza una foto.
- Reemplazar fotos que el catálogo ya tiene: solo se aportan cartas sin foto.
- Subir las fotos al storage de producción: va con `imagenes:subir`.

## Impact

- **Base:** migración `032_photo_submissions.sql` (aportes con RLS y versión de términos aceptada, reportes, bloqueo de aportes y columnas de crédito en `card_images`).
- **API:** rutas de aportes, revisión, Mis aportes y Se buscan, en `apps/api/src/index.js`. El procesamiento de imagen se reutiliza de `imagenes.js`.
- **Front:** `apps/web/public/index.html` (diálogo de foto, pestaña de revisión con reportes, perfil, crédito y "Reportar esta foto" en la ficha) y `apps/web/public/terminos-fotos.html`.
- **Specs:** `fotos-aportadas` (nueva).
- **README.**
