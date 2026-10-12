# 0016. Observabilidad con Sentry y logs estructurados; correo con Resend

- Estado: Aceptado
- Fecha: 2026-10-12

## Contexto
Con testers externos, los errores ocurren en navegadores y servidores que no vemos. También se necesita enviar correos: invitaciones a la alfa, verificación de cuenta y recuperación de contraseña.

## Decisión
- **Sentry** en el front y en la API/worker para errores y trazas de rendimiento, con el `user_id` (no el email) como identificador.
- **Logs estructurados** con pino (incluido en Fastify), con un id por petición; sin datos personales en los logs.
- Una ruta de salud (`/health`) que revisa la base, para el monitoreo del hosting.
- **Resend** para correos transaccionales, con dominio propio verificado (SPF/DKIM).

## Alternativas consideradas
- **Solo logs del hosting:** no agrupan errores ni muestran los del navegador.
- **Datadog o New Relic:** completos pero caros para esta etapa.
- **Amazon SES o Postmark para correo:** SES es más barato a escala pero más difícil de configurar; Postmark es igual de bueno. Resend tiene una buena API para TypeScript y plan gratis para empezar.

## Consecuencias
- Positivas: enterarse de los errores antes que los testers; correos confiables.
- Negativas: dos servicios externos más; hay que revisar que no se envíen datos personales a Sentry.
