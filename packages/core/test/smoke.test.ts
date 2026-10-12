import { describe, expect, it } from 'vitest';
import * as core from '../src/index.js';

describe('core', () => {
  it('se puede importar', () => expect(core.VERSION).toMatch(/^\d+\.\d+\.\d+$/));
});
