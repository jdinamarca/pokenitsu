# 0019. Artes conectados compartidos, editados por el dueño

- Estado: Aceptado
- Fecha: 2026-10-13

## Contexto
[0010](0010-multiusuario-con-user-id-y-rls.md) puso los grupos de artes conectados entre los datos de cada usuario, y la migración 027 los dejó en la cuenta del dueño. Pero los grupos son una curaduría de qué cartas forman un panorama, un cameo cruzado o una escena: son iguales para todos los coleccionistas. Lo que cambia por persona es cuántas piezas tiene, y eso ya sale de su inventario. Con grupos por usuario, cada tester nuevo empezaba con 0 grupos.

## Decisión
- `art_groups` y `art_group_cards` vuelven a ser **datos compartidos**: sin `user_id` y sin Row Level Security (migración 028).
- El **avance** de cada grupo se calcula con el inventario de cada cuenta, que sigue siendo por usuario.
- Solo el **dueño** (la primera cuenta, la que recibió los datos de antes de las cuentas) puede crear, editar, borrar o cambiar la imagen de un grupo; para las demás la API responde 403 y la app esconde esos botones.

## Alternativas consideradas
- **Grupos por usuario con una copia inicial para cada uno:** cada corrección del dueño no llegaría a los demás.
- **Cualquier cuenta edita los grupos de todos:** un tester podría borrar o cambiar la curaduría de todos.
- **Rol "administrador" configurable:** más flexible, pero por ahora hay un solo curador; "dueño = primera cuenta" alcanza y no necesita tabla de roles.

## Consecuencias
- Positivas: todos ven los mismos 35 grupos y las correcciones llegan a todos; el perfil puede mostrar el avance de cada uno sobre el mismo total.
- Negativas: si se quiere que otra persona cure grupos, hará falta un rol de administrador.
- Revisar si aparecen otras curadurías compartidas (por ejemplo kits) con la misma lógica.
