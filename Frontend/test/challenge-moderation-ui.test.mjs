import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('Challenge form preserves the frozen moderation contract', async () => {
  const [page, endpoints, proxy] = await Promise.all([
    readFile(new URL('../app/employer/challenges/create/page.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../lib/api/endpoints.ts', import.meta.url), 'utf8'),
    readFile(new URL('../app/api/backend/[...path]/route.ts', import.meta.url), 'utf8'),
  ]);

  assert.match(page, /disabled=\{isLoading\}/);
  assert.match(page, /if \(isLoading\) return/);
  assert.match(page, /useCreateChallenge/);
  assert.match(page, /createChallenge\.mutateAsync/);
  assert.match(page, /Đang kiểm tra Challenge\.\.\./);
  assert.match(page, /CHAL_MODERATION_REQUIRED/);
  assert.match(page, /CHAL_MODERATION_UNAVAILABLE/);
  assert.match(page, /Challenge đã được tạo/);
  assert.match(page, /Toàn bộ nội dung đã được giữ nguyên/);
  assert.match(page, /href="\/employer\/dashboard"/);
  assert.match(page, /href=\{`\/challenges\/\$\{result\.challenge\.challenge_id\}`\}/);
  assert.match(endpoints, /timeout: 25_000/);
  assert.match(proxy, /AbortSignal\.timeout\(20_000\)/);
});
