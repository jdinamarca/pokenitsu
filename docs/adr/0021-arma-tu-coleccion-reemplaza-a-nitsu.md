# 0021. "Arma tu colección" pasa a ser la app que reemplaza a Nitsu, por etapas

- Estado: Aceptado
- Fecha: 2026-10-15

## Contexto
[0020](0020-arma-tu-coleccion-app-aparte.md) creó "Arma tu colección" (`apps/arma`) como una opción aparte, para no arriesgar la app actual (`apps/web` + `apps/api`). Ya está en el stack destino de [0012](0012-front-react-vite-pwa.md) (Vite + React + TypeScript), con un diseño propio (la "Vitrina de tienda") y su propia API. El usuario decidió que sea ahí donde se vaya moviendo Nitsu, funcionalidad por funcionalidad, empezando por el login. Las cuentas, las sesiones y los correos viven en Better Auth, dentro de la API de Nitsu ([0011](0011-autenticacion-con-better-auth.md)).

## Decisión
- **La app destino es `apps/arma`.** Cada funcionalidad de Nitsu que se rediseñe se construye ahí, en un cambio propio, con el diseño de la app nueva (`apps/arma/DESIGN.md`). La app actual sigue funcionando mientras dure la transición y no se borra nada hasta que su reemplazo esté terminado.
- **Primera etapa: el acceso.** La app nueva tiene su propio login (`/entrar`), pero **las cuentas siguen en el Better Auth de Nitsu.** El front de la app nueva le pasa `/api/auth/*` a esa API, que acepta el origen de la app nueva como confiable para sus links de vuelta. La misma cuenta y la misma sesión sirven en las dos apps.
- Lo de [0020](0020-arma-tu-coleccion-app-aparte.md) sigue vigente: esquema `arma`, migraciones propias, procedencia por dato e inventario leído con la RLS del usuario. Lo que cambia es su papel: deja de ser una opción aparte y pasa a ser la app principal en construcción.

## Alternativas consideradas
- **Seguir rediseñando dentro de `apps/web`:** sin migración, pero es un HTML de miles de líneas sin build. Es lo que [0012](0012-front-react-vite-pwa.md) ya decidió dejar.
- **Mover Better Auth a la API nueva ahora:** una sola API de cuentas desde el principio, pero toca Google, los correos y los orígenes en el primer paso, con más riesgo de dejar a alguien sin acceso. Queda para una etapa posterior.
- **Una app nueva desde cero:** sin la deuda de `apps/arma`, pero repetiría el stack, el diseño y la API que ya están hechos y probados.

## Consecuencias
- Positivas: cada funcionalidad se rediseña una vez, en el stack destino. Las cuentas no se tocan y se puede volver atrás.
- Negativas: durante la transición hay dos fronts y dos APIs, y la app nueva necesita que la API de Nitsu esté corriendo para entrar. Unificar las APIs y mover las cuentas son etapas pendientes. Hay que mantener los dos logins hasta retirar el viejo.
