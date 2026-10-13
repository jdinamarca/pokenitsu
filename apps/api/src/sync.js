// npm run sync — downloads the full card catalog (all sets) into the database
import { syncAllCards } from './catalog.js';
import { rawPool } from './db.js';

const r = await syncAllCards(p => console.log(`[${p.done}/${p.total}] ${p.set}`));
console.log(`Listo: ${r.synced} sets sincronizados.`);
if (r.failed.length) console.log('Fallaron (vuelve a correr npm run sync para reintentar):\n' + r.failed.join('\n'));
await rawPool.end();
