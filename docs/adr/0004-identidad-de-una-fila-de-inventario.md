# 0004. Una fila de inventario = carta + variante + idioma + estado + ubicación

- Estado: Aceptado (registra una decisión ya tomada)
- Fecha: 2026-10-12

## Contexto
Un vendedor de challa tiene muchas copias de la misma carta que difieren en variante (normal, reverse, 1st Edition…), idioma, estado (NM a DMG) y lugar donde están guardadas. Cada una de esas diferencias cambia el precio o dónde buscarla. Registrar cada copia individual sería lento de cargar y de mostrar.

## Decisión
- La clave primaria de `inventory` es `(card_id, variant, lang, cond, loc)`, con `qty` copias y `personal` (cuántas de ellas son de la colección personal, 0..qty).
- Una "carta" es expansión + número; las internacionales son la misma carta en cualquier idioma, y las japonesas, chinas y escritas a mano tienen expansiones propias.
- Una fila con 0 copias se borra. Mover copias entre filas las fusiona.
- Cada cambio se registra en `inventory_log` para poder deshacerlo.

## Alternativas consideradas
- **Una fila por copia física:** permitiría notas o fotos por copia, pero multiplica las filas (miles por usuario) y complica la carga rápida.
- **Ubicación o estado como atributos aparte:** no permitiría tener copias de la misma carta en dos cajas o en dos estados.

## Consecuencias
- Positivas: cargar `25r lp*2` es un solo upsert; los conteos por ubicación, estado o idioma son directos.
- Negativas: cambiar algo de "una copia" significa mover N copias entre filas (`moveRow`), con cuidado de mover primero las de venta.
- Con multiusuario, la clave pasa a incluir `user_id` ([0010](0010-multiusuario-con-user-id-y-rls.md)).
