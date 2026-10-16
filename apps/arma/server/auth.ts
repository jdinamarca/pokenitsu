// Accounts (cuentas-en-arma, ADR 0022): this API serves /api/auth itself, with the rules shared with Nitsu in
// @pokenitsu/auth (same tables, secret and cookie: one session serves both apps). Nitsu no longer has to be running.
import { createAuth, fromNodeHeaders, googleEnabled, type Auth } from '@pokenitsu/auth';
import type { FastifyInstance } from 'fastify';
import type { IncomingHttpHeaders } from 'node:http';
import { pool } from './db.ts';

// where the browser reaches this API: the front's address (Vite passes /api here), so the links in the emails and
// Google's come back through it
const BASE = process.env.ARMA_AUTH_URL || 'http://localhost:5180';

let auth: Auth | null = null;
// after the migrations: Better Auth checks its tables when it starts
export function initAuth() {
  auth = createAuth({ pool, baseURL: BASE, trustedOrigins: [BASE, 'http://localhost:5180', 'http://127.0.0.1:5180'] });
}
const ready = () => {
  if (!auth) throw new Error('Las cuentas aún no están listas');
  return auth;
};

/** the session of a request, with its cookie's signature checked; null without one */
export const sessionOf = (headers: IncomingHttpHeaders) => ready().api.getSession({ headers: fromNodeHeaders(headers) });

export function authRoutes(app: FastifyInstance) {
  app.route({
    method: ['GET', 'POST'],
    url: '/api/auth/*',
    async handler(req, reply) {
      const res = await ready().handler(
        new Request(new URL(req.url, `http://${req.headers.host}`), {
          method: req.method,
          headers: fromNodeHeaders(req.headers),
          ...(req.body ? { body: JSON.stringify(req.body) } : {}),
        }),
      );
      reply.status(res.status);
      // several cookies come as separate Set-Cookie headers: send them all
      res.headers.forEach((v, k) => {
        if (k !== 'set-cookie') reply.header(k, v);
      });
      const cookies = res.headers.getSetCookie();
      if (cookies.length) reply.header('set-cookie', cookies);
      return reply.send(res.body ? await res.text() : null);
    },
  });
  // which ways to log in this server offers (the login screen shows the Google button only when it works)
  app.get('/api/auth-options', async () => ({ google: googleEnabled() }));
}
