// Accounts (login-en-arma, ADR 0021): the same Better Auth as Nitsu, reached through this app's /api/auth proxy, so one
// account and one session serve both apps. The links in the emails and Google's come back to this app's /entrar.

export const AUTH_ERR: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD: 'Email o contraseña incorrectos.',
  USER_ALREADY_EXISTS: 'Ya existe una cuenta con ese email: entra con tu contraseña.',
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: 'Ya existe una cuenta con ese email: entra con tu contraseña.',
  PASSWORD_TOO_SHORT: 'La contraseña debe tener al menos 10 caracteres.',
  INVALID_EMAIL: 'Ese email no es válido.',
  NOT_INVITED: 'Este email no está invitado. Durante la alfa solo pueden crear cuenta los emails invitados.',
  INVALID_TOKEN: 'El link venció o ya se usó. Pide uno nuevo.',
};

/** where the email links and Google come back: this app's own origin (Better Auth trusts it) */
export const back = (path: string) => new URL(path, location.origin).toString();
export const VERIFY_BACK = '/entrar?verificado=1';

export async function authPost(
  path: string,
  body: unknown,
): Promise<{ ok: boolean; status: number; j: { code?: string; message?: string; token?: string; url?: string } }> {
  const r = await fetch('/api/auth/' + path, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  return { ok: r.ok, status: r.status, j: await r.json().catch(() => ({})) };
}

/** whether Google is set up in the accounts server */
export const authOptions = (): Promise<{ google: boolean }> =>
  fetch('/api/auth-options')
    .then(r => r.json())
    .catch(() => ({ google: false }));

export async function signOut() {
  await authPost('sign-out', {}).catch(() => {});
  location.assign('/entrar');
}

/** the login page, remembering where to come back after entering */
export const toLogin = () => location.replace(`/entrar?volver=${encodeURIComponent(location.pathname + location.search)}`);
