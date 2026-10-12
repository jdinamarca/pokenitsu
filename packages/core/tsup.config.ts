import { defineConfig } from 'tsup';

// Two outputs from the same source:
// - ESM for the API (import { pickPrice } from '@pokenitsu/core'); types come from tsc (tsconfig.build.json)
// - a classic script for the current front, exposing window.Core (loaded with <script src="core.js">)
export default defineConfig([
  { entry: ['src/index.ts'], format: ['esm'], outDir: 'dist', target: 'es2022', clean: true, sourcemap: true },
  {
    entry: { core: 'src/index.ts' },
    format: ['iife'],
    globalName: 'Core',
    outDir: '../../apps/web/public',
    target: 'es2020',
    outExtension: () => ({ js: '.js' }),
    minify: false,
  },
]);
