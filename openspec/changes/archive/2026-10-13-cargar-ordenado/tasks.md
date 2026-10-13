# Tasks

## 1. Estructura

- [x] 1.1 Reordenar `#tab-cargar` en paneles `session`, `entry`, `log` y `#preview` como hijos de `.load` con áreas de grilla (escritorio y ≤900 px); verificar en Chrome sin interfaz que en 1440 px la vista previa está a la derecha y en 390 px queda entre el campo y "Últimas cargas", sin desborde horizontal (`scrollWidth <= innerWidth`)

## 2. Sesión

- [x] 2.1 Fila de expansión con "Cambiar expansión" y modo `picking` (búsqueda + recientes a pedido); verificar: sin expansión se ve la búsqueda; al elegir se esconde; `Esc` en el campo la abre con foco; `Esc` en la búsqueda la cierra y vuelve el foco al campo; un clic en una reciente la elige
- [x] 2.2 Ajustes como botones con menú (idioma, estado, ubicación, destino) que muestran el valor, se cierran al elegir o al tocar fuera, se corren si no caben y animan al abrir; verificar elegir "Caja" en ubicación, escribir `lp` + Enter (botón LP destacado) y que tras recargar se mantienen idioma, ubicación y destino

## 3. Campo, ayuda e historial

- [x] 3.1 Campo grande, línea de atajos y "Todos los atajos" con la lista completa y el sonido; verificar que el detalle abre la lista y que el sonido sigue guardándose
- [x] 3.2 "Últimas cargas" con 5 filas y "Ver las 12"; verificar con un registro de prueba en memoria (sin tocar el inventario) que se ven 5 y luego 12

## 4. Celular y cierre

- [x] 4.1 Vista previa horizontal en ≤900 px; verificar con captura a 390 px
- [x] 4.2 Cargar una carta de prueba de punta a punta (número, vista previa, historial, deshacer) y comprobar que el inventario vuelve a 32 filas / 33 copias
- [x] 4.3 Actualizar la sección "Cargar cartas" del README; correr `pnpm build && pnpm typecheck && pnpm lint && pnpm test` y las verificaciones de animación de las pasadas anteriores

## Workflow follow-up

- Commit en `cargar` y PR contra `main` (apilado sobre #10); mergear solo cuando el usuario lo pida.
- Archivar después de los cambios de animación.
