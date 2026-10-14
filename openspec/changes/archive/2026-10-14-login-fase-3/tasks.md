## 1. API

- [x] 1.1 `mail.js`: envío con Resend por HTTP, plantillas en español y modo desarrollo (link en la consola)
- [x] 1.2 `auth.js`: verificación obligatoria (al crear y al intentar entrar), recuperar contraseña (1 h, cierra sesiones), Google con invitación y vinculación
- [x] 1.3 Migración: cuentas existentes verificadas
- [x] 1.4 `GET /api/auth-options` público y `/entrar` que conserva los parámetros
- [x] 1.5 Rechazar de inmediato el email no invitado y avisar por correo al dueño cuando su email intenta crear otra cuenta

## 2. Pantalla de inicio

- [x] 2.1 "Revisa tu correo" con reenviar (tras crear cuenta o al entrar sin confirmar)
- [x] 2.2 "¿Olvidaste tu contraseña?" y "Nueva contraseña" con el token del link
- [x] 2.3 "Continuar con Google" (solo si está activo) y errores que vuelven del login de Google
- [x] 2.4 Mensajes de vuelta: "¡Correo confirmado!", link vencido

## 3. Verificación y docs

- [x] 3.1 Probar en una copia de la base: crear cuenta, confirmar, entrar sin confirmar, recuperar contraseña, links vencidos, Google con credenciales falsas (redirige a Google) y sin credenciales (sin botón), correo vía un Resend simulado
- [x] 3.2 README con las variables de `.env` y los pasos de Resend y Google
