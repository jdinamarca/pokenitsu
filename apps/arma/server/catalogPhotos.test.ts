import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, afterEach, describe, expect, it, vi } from 'vitest';

// no database (the cache is always empty) and the photos in a temporary folder, set before local.ts reads it
vi.mock('./db.ts', () => ({ pool: { query: async () => ({ rows: [] }) }, tx: async () => {} }));
const dir = await mkdtemp(join(tmpdir(), 'arma-pc-'));
process.env.LOCAL_IMAGE_DIR = dir;
afterAll(() => rm(dir, { recursive: true }));
afterEach(() => vi.unstubAllGlobals());
const { billsStep, pokecottageStep } = await import('./catalogPhotos.ts');
type Job = Parameters<typeof pokecottageStep>[2];

const POLITE = { albumPause: 40, photoPause: 40, errorPause: 10, maxFails: 3 };
const job = (): Job => ({
  running: true,
  phase: 'pokecottage',
  sets: 0,
  done: 0,
  pokemon: 2,
  pokemonDone: 0,
  billsSets: 0,
  billsDone: 0,
  billsSkipped: [],
  current: null,
  bySource: {
    limitless: { fetched: 0, existing: 0, missing: 0, failed: 0 },
    pokecottage: { fetched: 0, existing: 0, missing: 0, failed: 0 },
    billsarchive: { fetched: 0, existing: 0, missing: 0, failed: 0 },
  },
  skipped: [],
});
const album = (dex: number) => ({
  cards: [37, 38].map(n => ({
    id: `${dex}-${n}`,
    imageUrl: `https://pokecottagecdn.com/mastersets/images/cards/${dex}-${n}.webp`,
    pokemonNumber: dex,
    cardNumber: String(n),
    variantType: 'default',
    set: { id: 'jpn_b02', name: 'Pokémon Jungle' },
  })),
});
const groups = [133, 134].map(dex => ({
  dex,
  cards: [37, 38].map(n => ({ id: `ja-PMCG2-${dex}-${n}`, set_id: 'ja-PMCG2', number: String(n).padStart(3, '0'), dex: [dex] })),
}));
// the two cards of each group share expansion and number in the test: one Pokédex each keeps them apart
const io = {
  species: async (dex: number) => `p${dex}`,
  jaByName: new Map([['pokemonjungle', 'ja-PMCG2']]),
  record: vi.fn(async () => {}),
};

/** a fake PokeCottage: what it answers to each request, and when and how many at once it was asked */
function fakePokecottage(answer: (url: string, n: number) => Response | undefined) {
  const log: { url: string; at: number; end: number }[] = [];
  let now = 0;
  let most = 0;
  vi.stubGlobal('fetch', async (u: string) => {
    const url = String(u);
    const at = Date.now();
    most = Math.max(most, ++now);
    await new Promise(r => setTimeout(r, 5));
    now--;
    log.push({ url, at, end: Date.now() });
    const custom = answer(url, log.length);
    if (custom) return custom;
    if (url.endsWith('.json')) return new Response(JSON.stringify(album(Number(/data\/(\d+)-/.exec(url)![1]))), { status: 200 });
    return new Response(new Uint8Array([1, 2, 3]), { status: 200, headers: { 'content-type': 'image/webp' } });
  });
  return { log, most: () => most };
}

describe('fotos-pokecottage-en-catalogo: el ritmo con PokeCottage', () => {
  it('las fotos van a la carpeta temporal de la prueba', async () => {
    const { LOCAL_IMAGE_DIR } = await import('./local.ts');
    expect(LOCAL_IMAGE_DIR).toBe(dir);
  });

  it('de a una, con pausa, y cada foto registrada', async () => {
    const pc = fakePokecottage(() => undefined);
    const j = job();
    await pokecottageStep(groups, io, j, POLITE);
    expect(pc.most()).toBe(1);
    expect(pc.log).toHaveLength(6); // 2 albums + 4 photos
    for (let i = 1; i < pc.log.length; i++) expect(pc.log[i]!.at - pc.log[i - 1]!.end).toBeGreaterThanOrEqual(POLITE.albumPause - 2);
    expect(j.bySource.pokecottage.fetched).toBe(4);
    expect(j.pokemonDone).toBe(2);
    expect(io.record).toHaveBeenCalledTimes(4);
  });

  it('una segunda pasada no pide ninguna foto', async () => {
    const pc = fakePokecottage(() => undefined);
    const j = job();
    await pokecottageStep(groups, io, j, POLITE);
    // the albums aren't cached in this test (no database): only them
    expect(pc.log.filter(x => !x.url.endsWith('.json'))).toHaveLength(0);
    expect(j.bySource.pokecottage.existing).toBe(4);
  });

  it('un 429 con Retry-After: 2 hace esperar 2 s y repetir la misma', async () => {
    const pc = fakePokecottage((_, n) => (n === 1 ? new Response(null, { status: 429, headers: { 'retry-after': '2' } }) : undefined));
    const j = job();
    await pokecottageStep(groups.slice(0, 1), io, j, POLITE);
    expect(pc.log[0]!.url).toBe(pc.log[1]!.url);
    expect(pc.log[1]!.at - pc.log[0]!.end).toBeGreaterThanOrEqual(1990);
    expect(j.stopped).toBeUndefined();
    expect(j.pokemonDone).toBe(1);
  }, 10_000);

  it('tres 500 seguidos detienen el paso', async () => {
    const pc = fakePokecottage(() => new Response(null, { status: 500 }));
    const j = job();
    const four = [133, 134, 135, 136].map(dex => ({ dex, cards: [{ id: `c${dex}`, set_id: 'ja-PMCG2', number: '037', dex: [dex] }] }));
    await pokecottageStep(four, io, j, POLITE);
    expect(j.stopped).toMatch(/3 veces seguidas/);
    // each album asked once (no quick retry), and the fourth never
    expect(pc.log.map(x => x.url.match(/data\/(\d+)/)![1])).toEqual(['133', '134', '135']);
    expect(j.bySource.pokecottage.failed).toBe(2);
    expect(pc.most()).toBe(1);
  });
});

describe("fotos-billsarchive-japonesas: el ritmo con Bill's Archive", () => {
  const CDN = 'https://bills-archive.nyc3.cdn.digitaloceanspaces.com/tcgdex_cards_jp';
  const html = (code: string, ns: number[]) => ns.map(n => `<img src="${CDN}/${code}/${code}-${n}_x.webp">`).join('');
  const jungle = {
    setId: 'ja-PMCG2',
    name: 'Pokémon Jungle',
    total: 3,
    cards: [{ id: 'ja-PMCG2-048', set_id: 'ja-PMCG2', number: '048' }],
  };
  const fake = (pages: Record<string, string>) => {
    const log: { url: string; at: number; end: number }[] = [];
    vi.stubGlobal('fetch', async (u: string) => {
      const url = String(u);
      const at = Date.now();
      await new Promise(r => setTimeout(r, 5));
      log.push({ url, at, end: Date.now() });
      if (url.endsWith('.html')) {
        const slug = /\/([a-z0-9-]+)-jp\.html$/.exec(url)![1]!;
        return pages[slug] ? new Response(pages[slug], { status: 200 }) : new Response(null, { status: 404 });
      }
      return new Response(new Uint8Array([1, 2, 3]), { status: 200, headers: { 'content-type': 'image/webp' } });
    });
    return log;
  };

  it('la página de la expansión, después la foto, con pausa, y la foto registrada', async () => {
    const log = fake({ 'pokemon-jungle': html('pmcg2', [1, 2, 48]) });
    const record = vi.fn(async () => {});
    const j = job();
    await billsStep([jungle], record, j, POLITE);
    expect(log.map(x => x.url.replace(/.*\//, ''))).toEqual(['pokemon-jungle-jp.html', 'pmcg2-48_x.webp']);
    expect(log[1]!.at - log[0]!.end).toBeGreaterThanOrEqual(POLITE.albumPause - 2);
    expect(record).toHaveBeenCalledWith(
      'ja-PMCG2-048',
      expect.stringMatching(/^billsarchive\/pmcg2-48_x\.webp$/),
      expect.stringContaining('pmcg2-48_x'),
    );
    expect(j.bySource.billsarchive.fetched).toBe(1);
    expect(j.billsDone).toBe(1);
  });

  it('una página que no calza con el catálogo no baja nada y se anota', async () => {
    const log = fake({ 'pokemon-jungle': html('pmcg2', [1, 48]) });
    const j = job();
    await billsStep(
      [jungle],
      vi.fn(async () => {}),
      j,
      POLITE,
    );
    expect(log).toHaveLength(1);
    expect(j.billsSkipped).toEqual(['Pokémon Jungle (su página no calza con el catálogo)']);
  });

  it('una expansión que no tiene se anota y sigue', async () => {
    fake({});
    const j = job();
    await billsStep(
      [{ ...jungle, name: 'Holon Research Tower' }],
      vi.fn(async () => {}),
      j,
      POLITE,
    );
    expect(j.billsSkipped).toEqual(['Holon Research Tower (no la tiene)']);
    expect(j.stopped).toBeUndefined();
  });
});
