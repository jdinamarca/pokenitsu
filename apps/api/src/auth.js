// Accounts and sessions with Better Auth (ADR 0011). The rules live in @pokenitsu/auth (cuentas-en-arma, ADR 0022),
// shared with Arma tu colección's API: same tables, secret and cookie, so one session serves both apps. Here only
// where Nitsu lives and which origins it trusts.
import { createAuth as create } from '@pokenitsu/auth';
import { rawPool } from './db.js';

export { allowedEmails, googleEnabled } from '@pokenitsu/auth';

const port = Number(process.env.PORT || 3000);
// the app is opened as localhost or 127.0.0.1; both are the same origin for logging in
const origins = [process.env.BETTER_AUTH_URL, `http://localhost:${port}`, `http://127.0.0.1:${port}`,
  ...String(process.env.BETTER_AUTH_TRUSTED_ORIGINS || '').split(',')].map(s => (s || '').trim()).filter(Boolean);

// created after the migrations run: Better Auth checks its tables when it starts
export const createAuth = () => create({ pool: rawPool, baseURL: process.env.BETTER_AUTH_URL || `http://127.0.0.1:${port}`, trustedOrigins: origins });
