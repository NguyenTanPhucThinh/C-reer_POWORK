import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('registration requires an explicit terms and privacy confirmation', async () => {
  const [page, schema] = await Promise.all([
    readFile(new URL('../app/(auth)/register/page.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../lib/validations/auth.ts', import.meta.url), 'utf8'),
  ]);

  assert.match(page, /\.\.\.registerField\('accepted_terms'\)/);
  assert.match(page, /\/public-page\/terms/);
  assert.match(page, /\/public-page\/security/);
  assert.match(schema, /accepted_terms: z\.boolean\(\)\.refine\(\(accepted\) => accepted/);
});
