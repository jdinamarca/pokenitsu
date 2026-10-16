import { afterEach, describe, expect, it } from 'vitest';
import { allowedEmails, googleEnabled, mails } from '../src/index.js';

describe('cuentas compartidas', () => {
  const env = { ...process.env };
  afterEach(() => {
    process.env = { ...env };
  });
  it('los invitados se leen del .env, sin espacios ni mayúsculas', () => {
    process.env.AUTH_ALLOWED_EMAILS = ' Ash@Paleta.cl, misty@celeste.cl ,';
    expect([...allowedEmails()]).toEqual(['ash@paleta.cl', 'misty@celeste.cl']);
    delete process.env.AUTH_ALLOWED_EMAILS;
    expect(allowedEmails().size).toBe(0);
  });
  it('Google solo con sus dos credenciales', () => {
    process.env.GOOGLE_CLIENT_ID = 'id';
    delete process.env.GOOGLE_CLIENT_SECRET;
    expect(googleEnabled()).toBe(false);
    process.env.GOOGLE_CLIENT_SECRET = 'secreto';
    expect(googleEnabled()).toBe(true);
  });
  it('los correos llevan el link y escapan el nombre', () => {
    const m = mails.reset('<Ash>', 'https://localhost:5180/api/auth/reset-password/abc');
    expect(m.subject).toBe('Cambia tu contraseña de Nitsu Collectibles');
    expect(m.html).toContain('https://localhost:5180/api/auth/reset-password/abc');
    expect(m.html).toContain('&lt;Ash&gt;');
    expect(m.text).toContain('El link vale 1 hora');
  });
});
