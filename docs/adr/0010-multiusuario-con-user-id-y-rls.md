# 0010. Multiusuario con `user_id` y Row Level Security

- Estado: Aceptado
- Fecha: 2026-10-12

## Contexto
Hoy hay un solo inventario sin login. Para la alfa, cada tester necesita sus propios datos y nadie debe ver ni modificar los de otro. Parte de los datos es de todos (catálogo, precios de mercado, tipo de cambio) y parte es de cada usuario.

## Decisión
- **Datos compartidos** (sin `user_id`): `sets`, `cards`, `card_prices`, tipo de cambio y checklists descargadas.
- **Datos por usuario** (con `user_id` en la clave): `inventory`, `inventory_log`, `locations`, `lots`, `lot_items`, colecciones, grupos de artes conectados, `price_overrides`, `variant_images`, configuración de precios.
- Toda consulta filtra por el usuario de la sesión, y además se activa **Row Level Security** en las tablas por usuario: la API fija `app.user_id` en cada transacción (`set_config`) y las políticas solo dejan ver y escribir filas de ese usuario.
- La API se conecta con un rol sin privilegio para saltarse RLS; las migraciones usan otro rol.
- El inventario actual se migra a la cuenta del dueño.

## Alternativas consideradas
- **Una base o un esquema por usuario:** aislamiento fuerte, pero multiplica migraciones y conexiones; excesivo para decenas de usuarios.
- **Solo filtrar en el código:** basta un `WHERE` olvidado para filtrar datos ajenos; RLS es la segunda barrera.

## Consecuencias
- Positivas: aislamiento garantizado por la base aunque haya un error en una consulta.
- Negativas: cada transacción debe fijar el usuario; las pruebas deben cubrir que un usuario no ve datos de otro.
- Si se usa un Postgres con API automática expuesta (ej. Supabase), RLS es obligatorio en todas las tablas o hay que desactivar esa API ([0015](0015-despliegue.md)).
