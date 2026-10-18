import { describe, expect, it, vi } from 'vitest';
import type { DesignLink } from '@pokenitsu/core';

// no database: the cache is always empty
vi.mock('./db.ts', () => ({ pool: { query: async () => ({ rows: [] }) }, tx: async () => {} }));
const { artistsFromLinks, artistStep, dexIds } = await import('./details.ts');
const { SourceBusy } = await import('./sources/http.ts');
const { NoCardList } = await import('./sources/bulbapedia.ts');
type Job = Parameters<typeof artistStep>[2];

const link = (en: string, ja: string, jaNum = ''): DesignLink => ({
  a: { setKey: en.split('#')[0]!, number: en.split('#')[1]! },
  b: { setKey: ja, number: jaNum },
  source: 'bulbapedia',
});
const card = (id: string, set_id: string, number_norm: string, artist: string | null = null) => ({ id, set_id, number_norm, artist });
const EN: Record<string, string> = { 'ex10|1': 'Kagemaru Himeno', 'ex10|2': 'Ryo Ueda', 'ex11|3': 'Midori Harada' };
const enArtist = (set: string, num: string) => EN[`${set}|${num}`];

describe('dexIds', () => {
  it("keeps the species of TCGdex's forms (384.1 → 384) and drops what isn't a number", () => {
    expect(dexIds([384.1])).toEqual([384]);
    expect(dexIds([25, 644])).toEqual([25, 644]);
    expect(dexIds([])).toBeNull();
    expect(dexIds(undefined)).toBeNull();
    expect(dexIds(['x', 0])).toBeNull();
  });
});

describe('artistsFromLinks', () => {
  it('copies the English illustrator to the paired Japanese card by number', () => {
    const got = artistsFromLinks([link('ex10#1', 'ja-PCG4', '003')], [card('ja-PCG4-3', 'ja-PCG4', '3')], enArtist);
    expect([...got]).toEqual([['ja-PCG4-3', 'Kagemaru Himeno']]);
  });
  it('without a Japanese number, only when the species has a single card in that set', () => {
    expect([...artistsFromLinks([link('ex10#1', 'ja-PCG4')], [card('a', 'ja-PCG4', '3')], enArtist)]).toEqual([['a', 'Kagemaru Himeno']]);
    const two = [card('a', 'ja-PCG4', '3'), card('b', 'ja-PCG4', '9', 'Ken Sugimori')];
    expect(artistsFromLinks([link('ex10#1', 'ja-PCG4')], two, enArtist).size).toBe(0);
  });
  it('never replaces an illustrator that is there', () => {
    expect(artistsFromLinks([link('ex10#1', 'ja-PCG4', '3')], [card('a', 'ja-PCG4', '3', 'Otro')], enArtist).size).toBe(0);
  });
  it('gives nothing when two pairs disagree, or the English card has no illustrator', () => {
    const c = [card('a', 'ja-PCG4', '3')];
    expect(artistsFromLinks([link('ex10#1', 'ja-PCG4', '3'), link('ex10#2', 'ja-PCG4', '3')], c, enArtist).size).toBe(0);
    expect(artistsFromLinks([link('ex10#7', 'ja-PCG4', '3')], c, enArtist).size).toBe(0);
  });
});

const POLITE = { pagePause: 30, errorPause: 10, maxFails: 3 };
const job = (): Job => ({
  running: true,
  phase: 'ilustrador',
  current: null,
  steps: {
    tcgdex: { total: 0, done: 0, filled: 0, missing: 0, failed: 0 },
    pokedex: { total: 0, done: 0, filled: 0, missing: 0, failed: 0 },
    ilustrador: { total: 2, done: 0, filled: 0, missing: 0, failed: 0 },
  },
});
const groups = [
  { dex: 196, name: 'Espeon' },
  { dex: 197, name: 'Umbreon' },
];

describe('artistStep', () => {
  it('asks one species after the other and adds up what it wrote', async () => {
    const asked: string[] = [];
    const j = job();
    await artistStep(groups, { links: async g => (asked.push(g.name), []), write: async () => ({ filled: 2, missing: 1 }) }, j, POLITE);
    expect(asked).toEqual(['Espeon', 'Umbreon']);
    expect(j.steps.ilustrador).toMatchObject({ done: 2, filled: 4, missing: 2, failed: 0 });
    expect(j.stopped).toBeUndefined();
  });
  it('waits what a 429 asks and asks that species again', async () => {
    let calls = 0;
    const j = job();
    const t0 = Date.now();
    await artistStep(
      groups.slice(0, 1),
      {
        links: async () => {
          if (++calls === 1) throw new SourceBusy(60, 'https://bulbapedia.bulbagarden.net/w/api.php');
          return [];
        },
        write: async () => ({ filled: 1, missing: 0 }),
      },
      j,
      POLITE,
    );
    expect(calls).toBe(2);
    expect(Date.now() - t0).toBeGreaterThanOrEqual(55);
    expect(j.steps.ilustrador).toMatchObject({ done: 1, filled: 1, failed: 0 });
    expect(j.waitingUntil).toBeUndefined();
  });
  it('a species without a card list is not a failure', async () => {
    const j = job();
    await artistStep(
      groups.slice(0, 1),
      {
        links: async () => {
          throw new NoCardList('Bulbapedia no trajo la lista de cartas');
        },
        write: async () => ({ filled: 0, missing: 3 }),
      },
      j,
      POLITE,
    );
    expect(j.steps.ilustrador).toMatchObject({ done: 1, missing: 3, failed: 0 });
  });
  it('stops after three failures in a row', async () => {
    const j = job();
    let calls = 0;
    await artistStep(
      [...groups, { dex: 133, name: 'Eevee' }, { dex: 134, name: 'Vaporeon' }],
      {
        links: async () => {
          calls++;
          throw new Error('HTTP 500');
        },
        write: async () => ({ filled: 0, missing: 0 }),
      },
      j,
      POLITE,
    );
    expect(calls).toBe(3);
    expect(j.stopped).toMatch(/3 veces seguidas/);
    expect(j.steps.ilustrador.failed).toBe(3);
  });
});
