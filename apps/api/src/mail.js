// Transactional email (ADR 0016): the templates and Resend live in @pokenitsu/auth (cuentas-en-arma), shared with
// Arma tu colección; this module keeps the old import path
export { mails, sendMail } from '@pokenitsu/auth';
