import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('Dynamic Profile refreshes unlocked evidence when Candidate returns', async () => {
  const hook = await readFile(
    new URL('../lib/hooks/useDynamicProfile.ts', import.meta.url),
    'utf8'
  );

  assert.match(hook, /queryKey: \['candidate-profile', userId\]/);
  assert.match(hook, /staleTime: 0/);
  assert.match(hook, /refetchOnMount: 'always'/);
  assert.match(hook, /refetchOnWindowFocus: true/);
  assert.match(hook, /refetchInterval: 30_000/);
});
