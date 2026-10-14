// Accounts and sessions with Better Auth (ADR 0011): users and sessions live in our Postgres
import { betterAuth } from 'better-auth';
import { APIError, createAuthMiddleware } from 'better-auth/api';
import { rawPool } from './db.js';
import { mails, sendMail } from './mail.js';

const port = Number(process.env.PORT || 3000);
// the app is opened as localhost or 127.0.0.1; both are the same origin for logging in
const origins = [process.env.BETTER_AUTH_URL, `http://localhost:${port}`, `http://127.0.0.1:${port}`,
  ...String(process.env.BETTER_AUTH_TRUSTED_ORIGINS || '').split(',')].map(s => (s || '').trim()).filter(Boolean);

// during the alpha only invited emails can create an account (AUTH_ALLOWED_EMAILS, comma separated)
export const allowedEmails = () => new Set(String(process.env.AUTH_ALLOWED_EMAILS || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean));

const baseURL = () => process.env.BETTER_AUTH_URL || `http://127.0.0.1:${port}`;
// Google only when both credentials are in .env; the login screen asks /api/auth-options to show its button
export const googleEnabled = () => !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
const NOT_INVITED = { code: 'NOT_INVITED', message: 'Este email no está invitado. Durante la alfa solo pueden crear cuenta los emails invitados.' };
// a failed send must not break the sign-up or reveal anything: it is logged and the person can ask again
const mail = (to, m, url) => sendMail(to, m, url).catch(e => console.error('No se pudo enviar el correo:', e.message));

// created after the migrations run: Better Auth checks its tables when it starts
export const createAuth = () => betterAuth({
  database: rawPool, // its own tables, without Row Level Security
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: baseURL(),
  trustedOrigins: [...new Set(origins)],
  // new accounts confirm their email before entering (the ones from before were marked verified by a migration)
  emailAndPassword: {
    enabled: true, minPasswordLength: 10, requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) => mail(user.email, mails.reset(user.name, url), url),
    resetPasswordTokenExpiresIn: 60 * 60, revokeSessionsOnPasswordReset: true,
    // signing up with an email that already has an account looks the same on screen; the owner gets a mail saying so
    onExistingUserSignUp: async ({ user }) => { const url = `${baseURL()}/entrar`; return mail(user.email, mails.exists(user.name, url), url); },
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => mail(user.email, mails.verify(user.name, url), url),
    sendOnSignUp: true, sendOnSignIn: true, autoSignInAfterVerification: true, expiresIn: 60 * 60 * 24,
  },
  socialProviders: googleEnabled() ? { google: { clientId: process.env.GOOGLE_CLIENT_ID, clientSecret: process.env.GOOGLE_CLIENT_SECRET, prompt: 'select_account' } } : {},
  // Google with the email of an existing account signs into that account (Google verifies the email)
  account: { accountLinking: { enabled: true, trustedProviders: ['google'] } },
  // 30-day sessions renewed daily; the cookie keeps a 5-minute copy so each API call doesn't hit the session table
  session: { expiresIn: 60 * 60 * 24 * 30, updateAge: 60 * 60 * 24, cookieCache: { enabled: true, maxAge: 5 * 60 } },
  advanced: { cookiePrefix: 'pokenitsu' },
  telemetry: { enabled: false },
  // with email verification on, Better Auth answers a failed sign-up as if it worked (so nobody can probe which emails
  // have accounts); an email that is not invited is told so up front instead of waiting for a mail that never comes
  hooks: {
    before: createAuthMiddleware(async ctx => {
      if (ctx.path === '/sign-up/email' && !allowedEmails().has(String(ctx.body?.email || '').trim().toLowerCase())) throw new APIError('FORBIDDEN', NOT_INVITED);
    }),
  },
  // Google sign-ups go through here too
  databaseHooks: {
    user: {
      create: {
        before: async user => {
          if (!allowedEmails().has(String(user.email).toLowerCase())) throw new APIError('FORBIDDEN', NOT_INVITED);
          return { data: user };
        },
      },
    },
  },
});
