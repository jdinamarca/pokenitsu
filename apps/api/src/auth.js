// Accounts and sessions with Better Auth (ADR 0011): users and sessions live in our Postgres
import { betterAuth } from 'better-auth';
import { APIError } from 'better-auth/api';
import { rawPool } from './db.js';

const port = Number(process.env.PORT || 3000);
// the app is opened as localhost or 127.0.0.1; both are the same origin for logging in
const origins = [process.env.BETTER_AUTH_URL, `http://localhost:${port}`, `http://127.0.0.1:${port}`,
  ...String(process.env.BETTER_AUTH_TRUSTED_ORIGINS || '').split(',')].map(s => (s || '').trim()).filter(Boolean);

// during the alpha only invited emails can create an account (AUTH_ALLOWED_EMAILS, comma separated)
export const allowedEmails = () => new Set(String(process.env.AUTH_ALLOWED_EMAILS || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean));

// created after the migrations run: Better Auth checks its tables when it starts
export const createAuth = () => betterAuth({
  database: rawPool, // its own tables, without Row Level Security
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL || `http://127.0.0.1:${port}`,
  trustedOrigins: [...new Set(origins)],
  emailAndPassword: { enabled: true, minPasswordLength: 10 },
  // 30-day sessions renewed daily; the cookie keeps a 5-minute copy so each API call doesn't hit the session table
  session: { expiresIn: 60 * 60 * 24 * 30, updateAge: 60 * 60 * 24, cookieCache: { enabled: true, maxAge: 5 * 60 } },
  advanced: { cookiePrefix: 'pokenitsu' },
  telemetry: { enabled: false },
  databaseHooks: {
    user: {
      create: {
        before: async user => {
          if (!allowedEmails().has(String(user.email).toLowerCase())) throw new APIError('FORBIDDEN', { message: 'Este email no está invitado. Durante la alfa solo pueden crear cuenta los emails invitados.' });
          return { data: user };
        },
      },
    },
  },
});
