## ADDED Requirements

### Requirement: Aportar la foto de una carta sin foto
Cuando una carta no tiene foto en el catálogo, el diálogo de foto SHALL ofrecer "Compartir con la comunidad" a cualquier cuenta. Para enviar, el usuario MUST aceptar los "Términos para aportar fotos" vigentes, enlazados desde el diálogo, y el sistema SHALL guardar la versión aceptada y la fecha. La foto SHALL encuadrarse en un marco con la forma de la carta antes de enviarse. Sin compartir, la foto SHALL quedar solo para ese usuario, como hasta ahora.

#### Scenario: Compartir una foto
- **WHEN** un usuario sube la foto de ブラッキーVMAX (S8b #101), activa "Compartir con la comunidad", marca la autorización y toca "Guardar y compartir"
- **THEN** la foto queda en revisión y aparece en sus aportes como "en revisión"

#### Scenario: Sin aceptar los términos
- **WHEN** activa "Compartir con la comunidad" pero no marca "Acepto los Términos para aportar fotos"
- **THEN** no puede enviarla


#### Scenario: Carta que ya tiene foto
- **WHEN** abre el diálogo de una carta con foto en el catálogo
- **THEN** no aparece "Compartir con la comunidad"

### Requirement: Revisar los aportes
Solo el dueño SHALL ver la pestaña "Fotos por revisar", con la cola de aportes pendientes. Por cada aporte SHALL ver la foto, cómo quedará, la carta, quién la envió y cuántas fotos le aprobaron. Para aprobar MUST marcar que es la carta correcta, que se ve nítida y entera, y que no parece sacada de otro sitio. Para rechazar SHALL elegir un motivo. Ningún otro usuario SHALL ver los aportes pendientes de otros.

#### Scenario: Aprobar
- **WHEN** el dueño marca las tres comprobaciones y toca "Aprobar y publicar"
- **THEN** la carta muestra esa foto para todos, con el crédito de quien la envió

#### Scenario: Rechazar
- **WHEN** el dueño rechaza un aporte por "Borrosa"
- **THEN** quien la envió lo ve rechazado con ese motivo y puede reintentar

#### Scenario: Otro usuario
- **WHEN** una cuenta que no es la del dueño pide la cola de revisión
- **THEN** la respuesta es 403

### Requirement: Crédito y Mis aportes
Una foto aprobada SHALL mostrar "📸 Foto de <nombre>" en la ficha de la carta. Mi perfil SHALL mostrar los aportes del usuario: aprobados, en revisión y rechazados con su motivo.

#### Scenario: Ver el crédito
- **WHEN** cualquier usuario abre la ficha de ブラッキーVMAX después de aprobada
- **THEN** ve la foto y "📸 Foto de María"

### Requirement: Se buscan
El sistema SHALL listar las cartas sin foto ordenadas por cuántos coleccionistas las tienen, junto con el porcentaje del catálogo con foto, sin revelar quién las tiene.

#### Scenario: Cartas más buscadas
- **WHEN** el usuario abre "Se buscan"
- **THEN** ve primero las cartas sin foto que más cuentas tienen en su colección, con ese número

### Requirement: Términos para aportar fotos
El sistema SHALL publicar en `/terminos-fotos` los términos con su versión. Los términos SHALL indicar que quien aporta:
- sacó la foto él mismo y no la copió de otro sitio;
- da a Nitsu Collectibles un permiso gratuito y no exclusivo para mostrarla, recortarla y achicarla en la app con su crédito;
- es responsable si la foto es ajena.

También SHALL indicar que Nitsu puede quitar fotos y bloquear aportes, y cómo pedir que se quite o reportar una foto.

#### Scenario: Leer los términos
- **WHEN** el usuario toca el enlace "Términos para aportar fotos" en el diálogo
- **THEN** se abre la página de términos con su versión, sin perder la foto que estaba subiendo

### Requirement: Reportar, quitar y bloquear
Junto al crédito de una foto aportada SHALL aparecer "Reportar esta foto". Cualquiera, con o sin sesión, SHALL poder enviar un reporte con motivo y contacto. Los reportes SHALL llegar a la pestaña de revisión del dueño. El dueño SHALL poder quitar una foto aportada, con lo que la carta vuelve a quedar sin foto, y bloquear los aportes de esa cuenta. Una cuenta con los aportes bloqueados MUST NOT poder enviar fotos.

#### Scenario: Foto robada
- **WHEN** alguien reporta la foto de ブラッキーVMAX con el motivo "Es mi foto" y el dueño toca "Quitar foto y bloquear aportes"
- **THEN** la carta queda sin foto, el aporte queda retirado y esa cuenta ya no puede enviar fotos

#### Scenario: Cuenta bloqueada
- **WHEN** una cuenta con los aportes bloqueados intenta compartir una foto
- **THEN** ve que no puede aportar fotos y el servidor responde 403
