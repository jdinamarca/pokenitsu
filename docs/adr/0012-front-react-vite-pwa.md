# 0012. Front con Vite, React y TypeScript, instalable como PWA

- Estado: Aceptado
- Fecha: 2026-10-12

## Contexto
El front es un único `index.html` de ~2.700 líneas con JavaScript vanilla y estado global. Funciona, pero cada cambio es más riesgoso, no hay componentes reutilizables ni pruebas, y los testers van a cargar cartas desde el celular.

## Decisión
- **Vite + React + TypeScript** como aplicación de una sola página (SPA) que consume la API.
- **TanStack Query** para datos del servidor (caché, reintentos, actualizaciones optimistas al cargar cartas).
- **Tailwind CSS** con los tokens de color actuales (modo oscuro y claro).
- **PWA**: se instala en el celular y abre a pantalla completa; sin modo offline en la primera versión.
- Migración pestaña por pestaña, partiendo por Cargar y Mi colección; la versión antigua sigue disponible hasta completar la migración.
- El parser de carga y la lógica de precios vienen de `packages/core` ([0008](0008-typescript-y-monorepo.md)).

## Alternativas consideradas
- **Next.js:** su fuerte es el render en servidor y el SEO; esta app está detrás de un login y ya tiene API propia, así que agregaría un segundo servidor sin beneficio.
- **Svelte o Vue:** igual de válidos; React tiene más librerías y más ayuda disponible (incluida la de asistentes de IA).
- **Seguir en vanilla separando en módulos:** menos cambio, pero sin componentes ni tipos en las vistas.

## Consecuencias
- Positivas: componentes reutilizables, pruebas de interfaz, mejor experiencia en celular.
- Negativas: es la parte más larga de la migración; durante un tiempo conviven dos fronts.
