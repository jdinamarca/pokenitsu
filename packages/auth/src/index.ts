// Accounts and sessions with Better Auth (ADR 0011), shared by Nitsu's API and Arma tu colección's (cuentas-en-arma,
// ADR 0022): the same rules, tables, secret and cookie, so one session serves both apps. Each API only says where it
// lives (baseURL) and which origins it trusts.
import { betterAuth } from 'better-auth';
import { APIError, createAuthMiddleware } from 'better-auth/api';
import type { Pool } from 'pg';
import { mails, sendMail } from './mail.js';

export { mails, sendMail };
// Fastify/Node headers → the Headers Better Auth reads (getSession, the /api/auth handler)
export { fromNodeHeaders } from 'better-auth/node';

// during the alpha only invited emails can create an account (AUTH_ALLOWED_EMAILS, comma separated)
export const allowedEmails = () =>
  new Set(
    String(process.env.AUTH_ALLOWED_EMAILS || '')
      .split(',')
      .map(s => s.trim().toLowerCase())
      .filter(Boolean),
  );
// Google only when both credentials are in .env; the login screen asks /api/auth-options to show its button
export const googleEnabled = () => !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

const NOT_INVITED = {
  code: 'NOT_INVITED',
  message: 'Este email no está invitado. Durante la alfa solo pueden crear cuenta los emails invitados.',
};
// a failed send must not break the sign-up or reveal anything: it is logged and the person can ask again
const mail = (to: string, m: Parameters<typeof sendMail>[1], url: string) =>
  sendMail(to, m, url).catch((e: Error) => console.error('No se pudo enviar el correo:', e.message));

export interface AuthOptions {
  /** its own pool, without Row Level Security: Better Auth's tables are not per user */
  pool: Pool;
  /** where this app's /api/auth lives, as the browser reaches it: the links in the emails and Google come back here */
  baseURL: string;
  trustedOrigins: string[];
}

// created after the migrations run: Better Auth checks its tables when it starts
export const createAuth = ({ pool, baseURL, trustedOrigins }: AuthOptions) =>
  betterAuth({
    database: pool,
    secret: process.env.BETTER_AUTH_SECRET,
    baseURL,
    trustedOrigins: [...new Set(trustedOrigins.filter(Boolean))],
    // new accounts confirm their email before entering (the ones from before were marked verified by a migration)
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 10,
      requireEmailVerification: true,
      sendResetPassword: async ({ user, url }) => mail(user.email, mails.reset(user.name, url), url),
      resetPasswordTokenExpiresIn: 60 * 60,
      revokeSessionsOnPasswordReset: true,
      // signing up with an email that already has an account looks the same on screen; the owner gets a mail saying so
      onExistingUserSignUp: async ({ user }) => {
        const url = `${baseURL}/entrar`;
        return mail(user.email, mails.exists(user.name, url), url);
      },
    },
    emailVerification: {
      sendVerificationEmail: async ({ user, url }) => mail(user.email, mails.verify(user.name, url), url),
      sendOnSignUp: true,
      sendOnSignIn: true,
      autoSignInAfterVerification: true,
      expiresIn: 60 * 60 * 24,
    },
    socialProviders: googleEnabled()
      ? { google: { clientId: process.env.GOOGLE_CLIENT_ID!, clientSecret: process.env.GOOGLE_CLIENT_SECRET!, prompt: 'select_account' } }
      : {},
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
        if (
          ctx.path === '/sign-up/email' &&
          !allowedEmails().has(
            String(ctx.body?.email || '')
              .trim()
              .toLowerCase(),
          )
        )
          throw new APIError('FORBIDDEN', NOT_INVITED);
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
export type Auth = ReturnType<typeof createAuth>;
