import { describe, expect, it } from 'vitest';
import { limitlessFile, limitlessUrl } from './limitless.ts';

describe('fotos-solo-local-en-catalogo: el archivo de Limitless', () => {
  it('número de tres cifras', () => expect(limitlessFile('ja-SV2a', '133')).toEqual({ code: 'SV2a', n: '133' }));
  it('sin ceros a la izquierda', () => expect(limitlessFile('ja-S8b', '001')).toEqual({ code: 'S8b', n: '1' }));
  it('promos SV', () => expect(limitlessFile('ja-SV-P', '001')).toEqual({ code: 'SVP', n: '1' }));
  it('promos MEGA', () => expect(limitlessFile('ja-M-P', '012')).toEqual({ code: 'MP', n: '12' }));
  it('una XY con otro código en Limitless', () => expect(limitlessFile('ja-XY1a', '001')).toEqual({ code: 'XY1x', n: '1' }));
  it('Red Flash es XY8b en TCGdex y XY8r en Limitless', () => expect(limitlessFile('ja-XY8b', '001')).toEqual({ code: 'XY8r', n: '1' }));
  it('una expansión que solo tiene Limitless', () => expect(limitlessFile('ja-SMI', '019')).toEqual({ code: 'SMI', n: '19' }));
  it('número con letras', () => expect(limitlessFile('ja-S8b', 'TG05')).toBeNull());
  it('una expansión que no es japonesa', () => expect(limitlessFile('sv3pt5', '133')).toBeNull());
  it('la dirección', () =>
    expect(limitlessUrl({ code: 'S8b', n: '1' })).toBe('https://limitlesstcg.nyc3.cdn.digitaloceanspaces.com/tpc/S8b/S8b_1_R_JP_LG.png'));
});
