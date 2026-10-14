// Transactional email with Resend's HTTP API (ADR 0016). Without RESEND_API_KEY nothing is sent:
// the link is printed on the server console instead, so accounts work on a laptop with no mail set up.
const RESEND_URL = process.env.RESEND_API_URL || 'https://api.resend.com';
const FROM = () => process.env.EMAIL_FROM || 'Nitsu Collectibles <onboarding@resend.dev>';

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// one simple branded layout: title, a line of text, a big button and the link written out for clients that block buttons
function layout({ title, intro, button, url, outro }) {
  const html = `<!doctype html><html lang="es"><body style="margin:0;background:#f4f5fa;font-family:Nunito,Segoe UI,Arial,sans-serif;color:#1c1f2e">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#fff;border-radius:18px;padding:28px">
<tr><td style="font-size:22px;font-weight:800;letter-spacing:-.02em">Nitsu <span style="font-size:10px;letter-spacing:.3em;color:#c27c00">COLLECTIBLES</span></td></tr>
<tr><td style="padding-top:18px;font-size:22px;font-weight:800">${esc(title)}</td></tr>
<tr><td style="padding-top:8px;font-size:15px;line-height:1.55;color:#4a4f63">${esc(intro)}</td></tr>
<tr><td style="padding:22px 0"><a href="${esc(url)}" style="display:inline-block;background:#e3350d;color:#fff;text-decoration:none;font-weight:800;font-size:15px;border-radius:999px;padding:12px 24px">${esc(button)}</a></td></tr>
<tr><td style="font-size:13px;line-height:1.5;color:#6b7086">${esc(outro)}<br><br>Si el botón no funciona, copia este link:<br><a href="${esc(url)}" style="color:#2a75bb;word-break:break-all">${esc(url)}</a></td></tr>
</table></td></tr></table></body></html>`;
  const text = `${title}\n\n${intro}\n\n${button}: ${url}\n\n${outro}`;
  return { html, text };
}

export const mails = {
  verify: (name, url) => ({ subject: 'Confirma tu correo en Nitsu Collectibles', ...layout({
    title: `¡Hola${name ? ', ' + name : ''}!`, intro: 'Confirma tu correo para empezar a usar Nitsu Collectibles.',
    button: 'Confirmar mi correo', url, outro: 'El link vale 24 horas. Si no creaste una cuenta, ignora este correo.' }) }),
  reset: (name, url) => ({ subject: 'Cambia tu contraseña de Nitsu Collectibles', ...layout({
    title: 'Cambia tu contraseña', intro: `${name ? name + ', p' : 'P'}ediste cambiar la contraseña de tu cuenta.`,
    button: 'Elegir una contraseña nueva', url, outro: 'El link vale 1 hora. Si no lo pediste tú, ignora este correo: tu contraseña sigue igual.' }) }),
  exists: (name, url) => ({ subject: 'Ya tienes una cuenta en Nitsu Collectibles', ...layout({
    title: `¡Hola${name ? ', ' + name : ''}!`, intro: 'Alguien intentó crear una cuenta con este correo, pero ya tienes una. Entra con tu contraseña o, si no la recuerdas, toca "¿Olvidaste tu contraseña?".',
    button: 'Entrar a Nitsu', url, outro: 'Si no fuiste tú, ignora este correo: tu cuenta sigue igual.' }) }),
};

export async function sendMail(to, { subject, html, text }, url) {
  const key = process.env.RESEND_API_KEY;
  if (!key) { console.log(`\n✉️  Correo (modo desarrollo, sin RESEND_API_KEY) para ${to}: ${subject}\n   ${url}\n`); return; }
  const res = await fetch(`${RESEND_URL}/emails`, {
    method: 'POST', headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
    body: JSON.stringify({ from: FROM(), to: [to], subject, html, text }),
  });
  if (!res.ok) throw new Error(`Resend respondió ${res.status}: ${(await res.text()).slice(0, 200)}`);
}
