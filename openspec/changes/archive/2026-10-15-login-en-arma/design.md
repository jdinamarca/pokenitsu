# Design

## Context

- **La app nueva hoy:** "Arma tu colección" lee la sesión de la cookie `pokenitsu.session_token`, que pone Better Auth desde Nitsu (puerto 3000). Las cookies de `localhost` sirven en todos los puertos. Sin sesión, `App.tsx` muestra un enlace "Entrar en Nitsu".
- **Better Auth** (`apps/api/src/auth.js`):
  - `baseURL` es el de Nitsu y `trustedOrigins` incluye solo los orígenes de Nitsu más `BETTER_AUTH_TRUSTED_ORIGINS`;
  - email y contraseña con verificación obligatoria; las cuentas nuevas solo para emails en `AUTH_ALLOWED_EMAILS`, con el error `NOT_INVITED`;
  - recuperación con un token de 1 hora; Google solo si está configurado (`/api/auth-options`).
- **El login de Nitsu** (`apps/web/public/index.html`) usa:
  - `sign-in/email` y `sign-up/email` con `callbackURL: '/entrar?verificado=1'`;
  - `send-verification-email`;
  - `request-password-reset` con `redirectTo: '/entrar'` y `reset-password` con el `token` de la URL;
  - `sign-in/social` (Google), con `errorCallbackURL: '/entrar'`.

  Lee de la URL `token`, `error` y `verificado=1`, y sus modos son entrar, crear, pedir link, contraseña nueva y "revisa tu correo".
- **Diseño elegido:** AK · Mostrador (canvas, 15-10-2026).

## Goals / Non-Goals

**Goals:**
- Que todo el acceso funcione desde la app nueva con las mismas cuentas, sin tocar datos ni romper Nitsu.

**Non-Goals:**
- Mover Better Auth.
- Pantallas que no sean de acceso.

## Decisions

**1. Proxy, no copia.** En `vite.config.ts`, `/api/auth` y `/api/auth-options` van a Nitsu (`http://127.0.0.1:${NITSU_PORT || 3000}`), declarados **antes** de `/api`, que sigue yendo a la API de la app nueva. El navegador ve un solo origen (5180). Las cookies que pone Better Auth llegan a `localhost` y las lee la API de la app nueva, como hoy.
- *Alternativa descartada:* llamar al 3000 directo desde el navegador. Necesitaría CORS con credenciales y daría peores errores.

**2. URLs de vuelta absolutas al origen de la app nueva.**
- **Callbacks:** `callbackURL`, `redirectTo`, `errorCallbackURL` y `newUserCallbackURL` se arman con `location.origin` (`http://localhost:5180/entrar?verificado=1`, etc.).
- **Origen confiable:** `auth.js` suma a `trustedOrigins` `ARMA_WEB_ORIGIN` o, por defecto, `http://localhost:5180` y `http://127.0.0.1:5180`. Sin eso, Better Auth rechaza esos callbacks. Es configuración de código, no del `.env` del usuario.
- **Links de los correos:** siguen apuntando a la API (`/api/auth/verify-email?…&callbackURL=…`), y es la API la que redirige a la app nueva.

**3. Ruta sin librería de rutas.**
- `App.tsx` decide por `location.pathname`: `/entrar` muestra el login; el resto, la app (con sesión) o una redirección a `/entrar?volver=<ruta>`.
- Al entrar, `location.assign(volver || '/')`.
- Vite ya sirve `index.html` en cualquier ruta.

**4. `src/auth.ts`:** `authPost(path, body)` (POST JSON a `/api/auth/…`, que devuelve `{ ok, status, j }`), `authOptions()`, `signOut()`, y los textos de error por código, copiados de Nitsu (`NOT_INVITED`, `INVALID_EMAIL_OR_PASSWORD`, `EMAIL_NOT_VERIFIED`, `INVALID_TOKEN`, `USER_ALREADY_EXISTS`…).

**5. `Login.tsx`:**
- **Modos:** `in`, `up`, `forgot`, `reset`, `sent`, en un solo componente, con la misma lógica que Nitsu.
- **Repisa (AK):** 5 cartas de las copias propias (`/img/cards/…`, ya servidas por la API de la app nueva).
  - Las cartas son fijas: Eevee de 151, Jungle 1st Edition, Prismatic Poké Ball, Pokémon GO y una promo SWSH. No dependen de la sesión, porque no la hay.
  - Al enfocar un campo, la luz del vidrio sube y las cartas en penumbra se encienden, con `:has(input:focus)` en CSS y sin JS. Con "reducir movimiento", sin transición.
- **Formulario:** inputs con `<label>`, `autocomplete` correcto, mensajes en una región `role="alert"` y botón principal con la luz cálida.
- **Celular** (menos de 900 px): una columna, con el formulario primero y la repisa abajo, que hace scroll horizontal.

**6. Cerrar sesión:** un botón "Cerrar sesión" al pie del riel (sobrio, como los chips de vista) que llama a `sign-out` y lleva a `/entrar`.

**7. ADR 0021:** "Arma tu colección es la app que reemplaza a Nitsu, por etapas". La ADR 0020 queda vigente para cómo está hecha (API y esquema propios); lo que cambia es su papel. Las cuentas siguen en Better Auth de Nitsu hasta que una etapa futura las mueva.

## Risks / Trade-offs

- **[El 3000 tiene que estar corriendo]** → Sin Nitsu no hay login. El login lo dice ("No pude hablar con el servidor de cuentas") y el README explica que `pnpm dev` (Nitsu) y `pnpm arma` corren juntos. Unificarlos es otra etapa.
- **[Callbacks rechazados en producción]** → `ARMA_WEB_ORIGIN` es configurable, para cuando haya despliegue.
- **[Dos logins durante la transición]** → Comparten cuentas y sesión, así que no se pisan.
