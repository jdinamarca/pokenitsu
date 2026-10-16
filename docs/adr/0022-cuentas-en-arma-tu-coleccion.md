# 0022. Las cuentas se atienden en "Arma tu colección", con su configuración compartida

- Estado: Aceptado
- Fecha: 2026-10-15

## Contexto
Con [0021](0021-arma-tu-coleccion-reemplaza-a-nitsu.md), "Arma tu colección" tiene su propio login, pero las cuentas seguían en el Better Auth de la API de Nitsu ([0011](0011-autenticacion-con-better-auth.md)). El front de la app nueva le pasaba `/api/auth/*` al puerto 3000: si Nitsu no estaba corriendo, no se podía entrar. El usuario pidió que la app nueva funcione sola. Nitsu todavía tiene pantallas que no se han movido, así que tiene que seguir funcionando, con las mismas cuentas.

## Decisión
- **La configuración de las cuentas vive en un paquete, `@pokenitsu/auth`:** las reglas de Better Auth (invitados de la alfa, contraseña, verificación de correo, recuperación, Google, sesión de 30 días, cookie `pokenitsu`) y los correos (plantillas y Resend). Cada API lo usa con su propia dirección (`baseURL`) y sus orígenes confiables.
- **La API de "Arma tu colección" atiende `/api/auth/*` y `/api/auth-options`** con la dirección del front (`ARMA_AUTH_URL`, por defecto `http://localhost:5180`), así los links de los correos y la vuelta de Google llegan a la app nueva. Ya no necesita a Nitsu.
- **La sesión se obtiene con Better Auth** (`getSession`), que verifica la firma de la cookie.
- **Nitsu sigue atendiendo sus cuentas con el mismo paquete**, en su propia dirección. Las dos instancias usan las mismas tablas, el mismo secreto y la misma cookie: una sesión sirve en las dos apps.

## Alternativas consideradas
- **Copiar la configuración en la app nueva:** dos configuraciones que pueden divergir (un email invitado en una app y no en la otra).
- **Una sola API para las dos apps:** quitaría la duplicación de servidores, pero mezcla la transición de pantallas con la de cuentas. Queda para cuando se retire Nitsu.
- **Seguir pasando `/api/auth` a Nitsu:** sin cambios, pero mantiene la dependencia que el usuario quiere quitar.

## Consecuencias
- Positivas: la app nueva se levanta sola, las reglas de cuentas son las mismas en las dos apps y la cookie de sesión se verifica de verdad.
- Negativas: hay un paquete más que compilar. La vuelta de Google cambia de dirección: hay que agregar `http://localhost:5180/api/auth/callback/google` en la consola de Google Cloud (y la de producción, cuando haya despliegue). Mientras convivan, dos servidores atienden cuentas.
