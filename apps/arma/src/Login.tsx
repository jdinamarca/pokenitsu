// The way in (login-en-arma): "Mostrador" from the canvas (AK). On the left the felt case with real cards under the light
// of the glass, which grows when a field is focused; on the right the form. Every flow of Nitsu's login, same accounts.
import { useEffect, useState, type FormEvent } from 'react';
import { AUTH_ERR, authOptions, authPost, back, VERIFY_BACK } from './auth.ts';

type Mode = 'in' | 'up' | 'forgot' | 'reset' | 'sent';
const UI: Record<Mode, { title: string; sub: string; go: string }> = {
  in: { title: 'Entrar', sub: 'Con tu email o con Google.', go: 'Entrar' },
  up: { title: 'Crear cuenta', sub: 'Durante la alfa solo pueden crear cuenta los emails invitados.', go: 'Crear mi cuenta' },
  forgot: {
    title: '¿Olvidaste tu contraseña?',
    sub: 'Escribe tu email y te mandamos un link para elegir una nueva.',
    go: 'Enviarme el link',
  },
  reset: { title: 'Contraseña nueva', sub: 'Elige una contraseña de al menos 10 caracteres.', go: 'Guardar contraseña' },
  sent: { title: 'Revisa tu correo', sub: '', go: '' },
};
// the cards on the shelf: our own copies; two in the dark until a field is focused
const SHELF = [
  { img: '/img/cards/sv3pt5/sv3pt5-133-large.webp', tag: '151 · Normal', dot: 'ok' },
  { img: '/img/cards/base2/base2-51-large.webp', tag: 'Jungle · 1st Edition', dot: 'review', dim: true },
  { img: '/img/cards/sv8pt5/sv8pt5-74-large.webp', tag: 'Prismatic · Normal', dot: 'ok' },
  { img: '/img/cards/pgo/pgo-54-large.webp', tag: 'Pokémon GO', dot: 'ok', dim: true },
  { img: '/img/cards/swshp/swshp-SWSH042-large.webp', tag: 'SWSH Promo', dot: 'own' },
];
type Note = { text: string; tone: 'ok' | 'warn' | 'err' } | null;

// after entering, back to where the person was going (only a path of this app)
const safeBack = (v: string | null) => (v && v.startsWith('/') && !v.startsWith('//') && !v.startsWith('/entrar') ? v : '/');

export function Login() {
  const [q] = useState(() => new URLSearchParams(location.search));
  const volver = safeBack(q.get('volver'));
  const [mode, setMode] = useState<Mode>(() => (q.get('token') ? 'reset' : q.get('error') === 'INVALID_TOKEN' ? 'forgot' : 'in'));
  const [token] = useState(() => q.get('token') || '');
  const [note, setNote] = useState<Note>(() => {
    const err = q.get('error');
    if (err && q.get('verificado'))
      return { text: 'El link para confirmar tu correo venció o ya se usó. Entra con tu contraseña y te mandamos otro.', tone: 'warn' };
    if (q.get('verificado')) return { text: '¡Correo confirmado! Entra con tu contraseña.', tone: 'ok' };
    if (err === 'INVALID_TOKEN') return { text: AUTH_ERR.INVALID_TOKEN!, tone: 'warn' };
    if (err) return { text: AUTH_ERR[err] || `No se pudo entrar con Google (${err.replace(/_/g, ' ').toLowerCase()}).`, tone: 'err' };
    return null;
  });
  const [sent, setSent] = useState({ kind: '', email: '' });
  const [google, setGoogle] = useState(false);
  const [busy, setBusy] = useState(false);
  const [resendWait, setResendWait] = useState(false);
  const [f, setF] = useState({ name: '', email: '', pass: '', pass2: '' });

  useEffect(() => {
    // the email links leave their token or error in the URL: read once, then a clean address
    if (location.search) history.replaceState(null, '', volver === '/' ? '/entrar' : `/entrar?volver=${encodeURIComponent(volver)}`);
    void authOptions().then(o => setGoogle(!!o.google));
    // already in (an account just confirmed by its email link signs in by itself): straight to the app
    void fetch('/api/auth/get-session')
      .then(r => r.json())
      .then(s => s?.user && !q.get('token') && location.replace(volver))
      .catch(() => {});
  }, [volver, q]);

  const fail = (text: string) => setNote({ text, tone: 'err' });
  const sentScreen = (kind: string, email: string, text = '') => {
    setSent({ kind, email });
    setMode('sent');
    setNote(text ? { text, tone: 'warn' } : null);
  };
  const go = (m: Mode) => {
    setMode(m);
    setNote(null);
  };
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF(v => ({ ...v, [k]: e.target.value }));

  async function submit(e: FormEvent) {
    e.preventDefault();
    const email = f.email.trim(),
      password = f.pass;
    if ((mode === 'in' || mode === 'up') && (!email || !password)) return fail('Escribe tu email y tu contraseña.');
    if (mode === 'up' && password.length < 10) return fail(AUTH_ERR.PASSWORD_TOO_SHORT!);
    if (mode === 'up' && password !== f.pass2) return fail('Las contraseñas no coinciden.');
    if (mode === 'forgot' && !email) return fail('Escribe tu email.');
    if (mode === 'reset') {
      if (password.length < 10) return fail(AUTH_ERR.PASSWORD_TOO_SHORT!);
      if (password !== f.pass2) return fail('Las contraseñas no coinciden.');
    }
    setBusy(true);
    setNote(null);
    try {
      if (mode === 'in' || mode === 'up') {
        const name = f.name.trim() || email.split('@')[0];
        const { ok, status, j } = await authPost(
          mode === 'up' ? 'sign-up/email' : 'sign-in/email',
          mode === 'up'
            ? { name, email, password, callbackURL: back(VERIFY_BACK) }
            : { email, password, rememberMe: true, callbackURL: back(VERIFY_BACK) },
        );
        if (!ok && j.code === 'EMAIL_NOT_VERIFIED')
          return sentScreen('verify', email, 'Aún no confirmas tu correo: te reenviamos el link.');
        if (!ok) return fail(AUTH_ERR[j.code || ''] || j.message || `No se pudo (HTTP ${status}).`);
        if (mode === 'up' && !j.token) return sentScreen('verify', email);
        return location.assign(volver);
      }
      if (mode === 'forgot') {
        const { ok, j } = await authPost('request-password-reset', { email, redirectTo: back('/entrar') });
        if (!ok && j.code === 'INVALID_EMAIL') return fail(AUTH_ERR.INVALID_EMAIL!);
        return sentScreen('reset', email); // the same answer whether the account exists or not
      }
      if (mode === 'reset') {
        const { ok, j } = await authPost('reset-password', { newPassword: password, token });
        if (!ok) return fail(AUTH_ERR[j.code || ''] || j.message || 'No se pudo cambiar la contraseña.');
        setF(v => ({ ...v, pass: '', pass2: '' }));
        setMode('in');
        setNote({ text: 'Listo: entra con tu contraseña nueva.', tone: 'ok' });
      }
    } catch {
      fail('No pude hablar con el servidor de cuentas. ¿Está corriendo Nitsu?');
    } finally {
      setBusy(false);
    }
  }

  async function resend() {
    setResendWait(true);
    try {
      const { ok, j } = await authPost('send-verification-email', { email: sent.email, callbackURL: back(VERIFY_BACK) });
      setNote(
        ok
          ? { text: 'Te lo reenviamos. Revisa también la carpeta de spam.', tone: 'ok' }
          : { text: j.message || 'No se pudo reenviar.', tone: 'err' },
      );
    } catch {
      fail('No pude hablar con el servidor de cuentas.');
    }
    setTimeout(() => setResendWait(false), 20000); // a pause so it isn't sent ten times
  }

  async function withGoogle() {
    setBusy(true);
    try {
      const { ok, j } = await authPost('sign-in/social', {
        provider: 'google',
        callbackURL: back(volver),
        newUserCallbackURL: back(volver),
        errorCallbackURL: back('/entrar'),
      });
      if (ok && j.url) return location.assign(j.url);
      fail(j.message || 'No se pudo entrar con Google.');
    } catch {
      fail('No pude hablar con el servidor de cuentas.');
    }
    setBusy(false);
  }

  const ui = UI[mode];
  const sub =
    mode === 'sent'
      ? sent.kind === 'verify'
        ? `Te enviamos un link a ${sent.email}. Ábrelo para confirmar tu correo y entrar.`
        : `Si hay una cuenta con ${sent.email}, te enviamos un link para elegir una contraseña nueva. Vale 1 hora.`
      : ui.sub;
  return (
    <div className="login">
      <section className="login-hero">
        <p className="brand">Nitsu · Arma tu colección</p>
        <h1>Tu colección, carta por carta, bajo la luz.</h1>
        <p className="lead">Inventario, el Full de cada Pokémon y de dónde sale cada dato. Entra y sigue donde quedaste.</p>
        <div className="login-case" aria-hidden="true">
          <div className="login-shelf">
            {SHELF.map(c => (
              <div key={c.img} className={'lc' + (c.dim ? ' dim' : '')}>
                <img src={c.img} alt="" />
                <span className="tag">
                  <span className="tag-text">{c.tag}</span>
                  <span className={'sticker s-' + c.dot} />
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="login-panel">
        <form className="login-form" onSubmit={e => void submit(e)} noValidate>
          <h2>{ui.title}</h2>
          {sub && <p className="hint">{sub}</p>}
          {(mode === 'in' || mode === 'up') && (
            <div className="login-tabs" role="group" aria-label="Entrar o crear cuenta">
              <button
                type="button"
                className={'view' + (mode === 'in' ? ' sel' : '')}
                aria-pressed={mode === 'in'}
                onClick={() => go('in')}
              >
                Entrar
              </button>
              <button
                type="button"
                className={'view' + (mode === 'up' ? ' sel' : '')}
                aria-pressed={mode === 'up'}
                onClick={() => go('up')}
              >
                Crear cuenta
              </button>
            </div>
          )}
          {mode === 'up' && (
            <label className="fld">
              Tu nombre
              <input autoComplete="name" value={f.name} onChange={set('name')} />
            </label>
          )}
          {(mode === 'in' || mode === 'up' || mode === 'forgot') && (
            <label className="fld">
              Email
              <input type="email" autoComplete="email" value={f.email} onChange={set('email')} required />
            </label>
          )}
          {(mode === 'in' || mode === 'up' || mode === 'reset') && (
            <label className="fld">
              {mode === 'reset' ? 'Contraseña nueva' : 'Contraseña'}
              <input
                type="password"
                autoComplete={mode === 'in' ? 'current-password' : 'new-password'}
                minLength={mode === 'in' ? undefined : 10}
                value={f.pass}
                onChange={set('pass')}
                required
              />
            </label>
          )}
          {(mode === 'up' || mode === 'reset') && (
            <label className="fld">
              Repítela
              <input type="password" autoComplete="new-password" value={f.pass2} onChange={set('pass2')} required />
            </label>
          )}
          {mode === 'up' && <p className="hint">Al menos 10 caracteres. Te enviaremos un correo para confirmar tu email.</p>}
          <p className={'login-msg' + (note ? ' ' + note.tone : '')} role="alert">
            {note?.text}
          </p>
          {ui.go && (
            <button className="login-go" type="submit" disabled={busy}>
              {busy ? 'Un momento…' : ui.go}
            </button>
          )}
          {mode === 'sent' && sent.kind === 'verify' && (
            <button type="button" className="view login-secondary" disabled={resendWait} onClick={() => void resend()}>
              Reenviar el correo
            </button>
          )}
          {mode === 'in' && (
            <button type="button" className="login-link" onClick={() => go('forgot')}>
              ¿Olvidaste tu contraseña?
            </button>
          )}
          {(mode === 'forgot' || mode === 'reset' || mode === 'sent') && (
            <button type="button" className="login-link" onClick={() => go('in')}>
              ← Volver a Entrar
            </button>
          )}
          {google && (mode === 'in' || mode === 'up') && (
            <>
              <div className="login-or">
                <span>o</span>
              </div>
              <button type="button" className="login-google" disabled={busy} onClick={() => void withGoogle()}>
                <svg viewBox="0 0 48 48" width="20" height="20" aria-hidden="true">
                  <path
                    fill="#FFC107"
                    d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.4-.4-3.5z"
                  />
                  <path
                    fill="#FF3D00"
                    d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
                  />
                  <path
                    fill="#4CAF50"
                    d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"
                  />
                  <path
                    fill="#1976D2"
                    d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"
                  />
                </svg>
                Continuar con Google
              </button>
            </>
          )}
        </form>
      </section>
    </div>
  );
}
