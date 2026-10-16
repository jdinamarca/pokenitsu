import { defineConfig } from 'tsup';

// ESM for both APIs; types come from tsc (tsconfig.build.json)
export default defineConfig({ entry: ['src/index.ts'], format: ['esm'], outDir: 'dist', target: 'es2022', clean: true, sourcemap: true });
