# 0011. Autenticación con Better Auth

- Estado: Aceptado
- Fecha: 2026-10-12

## Contexto
Los alfa testers necesitan cuentas. Construir login propio (contraseñas, sesiones, recuperación, OAuth) es riesgoso. Los servicios externos (Clerk, Auth0) cobran por usuario activo y guardan las cuentas fuera de la base.

## Decisión
- Usar **Better Auth**, librería de TypeScript que corre dentro de la API y guarda usuarios y sesiones en el mismo Postgres.
- Métodos iniciales: email + contraseña (con verificación por correo) y Google.
- Sesiones con cookie `HttpOnly`, `Secure` y `SameSite=Lax`.
- Durante la alfa, registro solo por invitación (los emails aprobados de `alpha_signups`).

## Alternativas consideradas
- **Supabase Auth:** muy buena si todo el backend fuera Supabase; aquí la API es propia y ataría la identidad a ese proveedor.
- **Clerk o Auth0:** excelentes, pero de pago por usuario y con datos fuera de la base.
- **Login propio:** demasiado riesgo para el beneficio.

## Consecuencias
- Positivas: sin costo por usuario, datos en nuestra base, `user_id` disponible directamente para RLS ([0010](0010-multiusuario-con-user-id-y-rls.md)).
- Negativas: se mantienen las actualizaciones de seguridad de la librería; el envío de correos depende de un proveedor ([0016](0016-observabilidad-y-correo.md)).
