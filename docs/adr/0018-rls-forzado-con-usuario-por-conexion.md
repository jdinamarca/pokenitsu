# 0018. Row Level Security forzado, con el usuario fijado en la conexión de cada petición

- Estado: Aceptado
- Fecha: 2026-10-13

## Contexto
[0010](0010-multiusuario-con-user-id-y-rls.md) decidió `user_id` + Row Level Security, con la API conectada con un rol sin privilegio para saltarse RLS, migraciones con otro rol y además un filtro por usuario en cada consulta. Al implementarlo (fase 2 del login):
- La API se conecta con `pokemon`, dueño de todas las tablas, que no puede crear roles. RLS normal no aplica al dueño.
- La API tiene ~180 consultas con `pg`; agregar `WHERE user_id = …` a cada una es mucho cambio y basta uno olvidado para filtrar datos ajenos.
- Algunas tareas de sistema necesitan ver los datos de todos: elegir qué precios compartidos actualizar, completar ilustradores de las cartas que alguien tiene y limpiar cartas de checklist que ya nadie usa.

## Decisión
- RLS **forzado** (`FORCE ROW LEVEL SECURITY`) en las tablas por usuario, para que aplique también al dueño. Política: la fila es visible y escribible si `user_id = current_setting('app.user_id')`, o si `app.all_users = 'on'`.
- `user_id` tiene como valor por defecto `current_setting('app.user_id', true)`: los `INSERT` no cambian y sin usuario fallan (`NOT NULL`).
- Cada petición con sesión usa **una conexión con `app.user_id` fijado** (AsyncLocalStorage); sus consultas van en fila sobre ella y se devuelve con el valor borrado al responder. Las transacciones usan su propia conexión con el mismo usuario. Lo que sigue corriendo después de responder usa el pool sin usuario.
- Sin usuario, las tablas por usuario se ven **vacías** (un olvido muestra nada, no todo).
- Las tareas de sistema que deben ver a todos lo piden explícitamente con `asSystem()` o `set_config('app.all_users', 'on', true)`; las migraciones también.
- RLS es el filtro principal; las consultas no repiten `WHERE user_id`. Las vistas usan `security_invoker`.

## Alternativas consideradas
- **Rol aparte sin privilegios (0010):** el rol de la base local no puede crear roles; queda como mejora para producción (Supabase), donde sí se puede, sin cambiar las políticas.
- **`WHERE user_id` en cada consulta, sin RLS:** muchos cambios y un olvido filtra datos ajenos.
- **Transacción por consulta con `SET LOCAL`:** tres idas y vueltas extra por consulta.

## Consecuencias
- Positivas: aislamiento garantizado por la base; código de consultas casi sin cambios; borrar una cuenta borra sus datos en cascada.
- Negativas: una conexión por petición mientras dura; quien escriba SQL nuevo debe saber que `app.all_users` existe y usarlo solo en tareas de sistema; si alguien pudiera inyectar SQL podría fijar `app.all_users` (igual que antes podía leer todo).
- Revisar: en producción, conectar la API con un rol sin `BYPASSRLS` distinto del dueño de las tablas, y quitar el modo `all_users` si las tareas de sistema pasan a ese otro rol.
