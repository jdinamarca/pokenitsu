# Proposal

## Why

El panel de Mi perfil creció con la sección Mis aportes (#48) y ya no cabe en una pantalla normal. "Cerrar sesión" quedó al final y hay que hacer scroll dentro del panel para llegar a él (el #50 solo agregó ese scroll). El usuario eligió en el canvas de diseño la maqueta **AA · Pestañas y salida arriba**.

## What Changes

- La cabecera del panel muestra avatar, nombre, etiquetas (Dueño, Alfa, Email sin verificar) y el botón **Cerrar sesión** a la derecha. El botón queda siempre a la vista, sin scroll.
- Debajo de la cabecera hay tres pestañas: **Colección**, **Aportes** y **Cuenta**. Solo se ve una a la vez, así que el panel queda corto.
  - Colección: las 6 cifras que llevan a su sección (se mantienen las balls al pasar el mouse) y la línea "Coleccionista desde… · última carga… · idiomas · lotes abiertos".
  - Aportes: aprobadas, en revisión y rechazadas, la insignia "📸 Fotógrafo/a Nitsu" y el acceso a "Mis aportes y Se buscan". Si el servidor no responde los aportes, la pestaña no aparece.
  - Cuenta: email, avatar, nombre, contraseña, esta sesión y cerrar en otros dispositivos.
- El panel recuerda la última pestaña abierta en ese navegador.
- Se mantiene la altura máxima con scroll interno del #50 como respaldo para cuando se abre un formulario (cambiar contraseña o elegir entrenador).

**Fuera del alcance:**
- No cambia el comportamiento de ninguna acción del perfil (cambiar nombre, contraseña, avatar, cerrar sesiones). Tampoco cambian las cifras ni cómo se calculan.
- No hay cambios en la API ni en la base de datos.
- No se crea una página de perfil aparte. Las opciones Y y Z del canvas quedaron descartadas.
- No se migra el front a React/Vite.

## Capabilities

### New Capabilities

(ninguna)

### Modified Capabilities

- `cuentas`: el requisito "Mi perfil" pasa a describir la cabecera con Cerrar sesión siempre visible y las pestañas Colección / Aportes / Cuenta.

## Impact

- `apps/web/public/index.html`: `renderProfile`, `onProfileClick` y los estilos `.profilepop`.
- `README.md`: la descripción de Mi perfil.
- No hay dependencias nuevas ni cambios en la API.
