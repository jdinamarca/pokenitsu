import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist/', 'test/legacy/', 'coverage/'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  // [\x00-\x7F] is on purpose: it tells ASCII names (English series, "Charizard ex") from Japanese ones
  { rules: { 'no-control-regex': 'off' } },
);
