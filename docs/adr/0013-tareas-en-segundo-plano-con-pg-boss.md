# 0013. Tareas en segundo plano con pg-boss

- Estado: Aceptado
- Fecha: 2026-10-12

## Contexto
Hoy las descargas de precios, ilustradores y del catálogo corren dentro del proceso del servidor, con su estado en memoria. Si el servidor se reinicia, se pierde el avance; no hay reintentos ordenados ni límite de llamadas a las APIs externas, y con varios usuarios habrá más trabajo.

## Decisión
- Usar **pg-boss**, una cola de trabajos que vive en el mismo Postgres.
- Trabajos: descargar y renovar precios, completar ilustradores y rarezas, sincronizar el catálogo, actualizar el tipo de cambio y enviar correos.
- Corren en un proceso **worker** separado de la API (misma imagen, otro comando), con reintentos exponenciales y límite de concurrencia por fuente externa.
- Los trabajos periódicos (precios diarios, Cardmarket cada 3 días) se programan con el cron de pg-boss.

## Alternativas consideradas
- **BullMQ + Redis:** muy probado, pero suma un servicio más para operar y pagar.
- **Cron del proveedor de hosting o funciones programadas:** sin colas ni reintentos por trabajo.
- **Seguir en el proceso de la API:** pierde trabajo en cada reinicio y compite con las peticiones de los usuarios.

## Consecuencias
- Positivas: trabajos que sobreviven reinicios, reintentos y visibilidad del estado, sin infraestructura nueva.
- Negativas: la cola agrega carga a Postgres (baja para este volumen); hay que desplegar dos procesos.
