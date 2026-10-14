// Card pictures from the console (see imagenes.js):
//   pnpm imagenes:descargar [--set sv3pt5] [--limite 50] [--reintentar]   copy what is missing (safe to stop and rerun)
//   pnpm imagenes:estado                                                   how many are copied, missing, skipped or failed
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool, migrate } from './db.js';
import { copyAll, IMAGE_DIR } from './imagenes.js';

const args = process.argv.slice(2), cmd = args[0];
const opt = name => { const i = args.indexOf('--' + name); return i < 0 ? undefined : args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true; };
await migrate(join(dirname(fileURLToPath(import.meta.url)), '..', 'db', 'migrations'));

if (cmd === 'descargar') {
  const n = await copyAll({ set: opt('set'), limit: opt('limite') ? Number(opt('limite')) : undefined, retry: !!opt('reintentar') });
  console.log(`Listo: ✓ ${n.ok} copiadas · sin foto ${n.missing} · omitidas ${n.skipped} · errores ${n.error}`);
} else if (cmd === 'estado') {
  const { rows } = await pool.query(
    `SELECT status, count(DISTINCT card_id)::int AS cartas, coalesce(sum(bytes), 0)::bigint AS bytes FROM card_images GROUP BY 1 ORDER BY 1`);
  const { rows: [t] } = await pool.query(
    `SELECT count(*)::int AS total FROM cards c JOIN sets s ON s.id = c.set_id WHERE s.source IN ('ptcg', 'tcgdex-ja')`);
  const { rows: notes } = await pool.query(
    `SELECT status, note, count(DISTINCT card_id)::int AS n FROM card_images WHERE status <> 'ok' GROUP BY 1, 2 ORDER BY 3 DESC LIMIT 8`);
  console.log(`Carpeta: ${IMAGE_DIR}\nCatálogo: ${t.total} cartas`);
  for (const r of rows) console.log(`  ${r.status.padEnd(8)} ${String(r.cartas).padStart(6)} cartas${r.bytes > 0 ? ` · ${(r.bytes / 1048576).toFixed(1)} MB` : ''}`);
  const seen = rows.reduce((a, r) => a + r.cartas, 0);
  console.log(`  pendiente ${String(Math.max(0, t.total - seen)).padStart(5)} cartas`);
  if (notes.length) { console.log('Motivos:'); for (const r of notes) console.log(`  ${r.status} · ${r.note} · ${r.n}`); }
} else {
  console.log('Uso: pnpm imagenes:descargar [--set <id>] [--limite N] [--reintentar]  |  pnpm imagenes:estado');
}
process.exit(0);
