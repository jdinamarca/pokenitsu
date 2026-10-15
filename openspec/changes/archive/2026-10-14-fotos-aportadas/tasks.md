## 1. Base

- [x] 1.1 Migración `032_photo_submissions.sql`: aportes con RLS y `terms_version`, `photo_reports`, `photo_contributor_blocks`, columnas `source` y `credit_user_id` en `card_images`, funciones del dueño y de "Se buscan"

## 2. API

- [x] 2.1 `POST /api/photo-submissions` (foto encuadrada + consentimiento) y `GET /api/photo-submissions/mine`
- [x] 2.2 Cola del dueño: listar, ver la foto, aprobar (WebP 245/600, `card_images`, `cards.image_*`, rechaza las otras pendientes de la carta) y rechazar con motivo
- [x] 2.3 `GET /api/wanted-photos` (Se buscan) y el crédito en los datos de la carta
- [x] 2.4 Reportes (`POST /api/photo-reports`, sin sesión y con límite), lista para el dueño, quitar foto aportada y bloquear o desbloquear aportes

## 3. Front

- [x] 3.1 Diálogo de foto: interruptor "Compartir con la comunidad", casilla de términos con enlace, encuadre 63:88, aviso si la cuenta está bloqueada
- [x] 3.4 Página `terminos-fotos.html` con versión
- [x] 3.5 "Reportar esta foto" junto al crédito; reportes, "Quitar foto" y "Bloquear aportes" en la pestaña del dueño
- [x] 3.2 Pestaña "📸 Fotos por revisar" (solo dueño) con comprobaciones, motivos y girar
- [x] 3.3 Crédito en la ficha; Mis aportes y Se buscan en Mi perfil

## 4. Verificación y docs

- [x] 4.1 Verificar en Chrome sin interfaz sobre una copia de la base, con dos cuentas (aportar, términos obligatorios, revisar, aprobar, rechazar, crédito, 403, Se buscan, reportar sin sesión, quitar y bloquear) y en celular
- [x] 4.2 README y specs
