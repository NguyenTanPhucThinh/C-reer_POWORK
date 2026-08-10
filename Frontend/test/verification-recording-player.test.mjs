import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8');

test('Employer player requests short-lived recording access only on demand and refreshes locally', async () => {
  const [api, player, page] = await Promise.all([
    read('../lib/api/endpoints.ts'),
    read(
      '../app/employer/submissions/[submission_id]/verification/_components/EmployerVerificationVideoPlayer.tsx'
    ),
    read('../app/employer/submissions/[submission_id]/verification/page.tsx'),
  ]);

  assert.match(api, /\/verification-recording/);
  assert.match(api, /recording_url/);
  assert.match(api, /expires_in/);
  assert.match(player, /onClick={openPlayer}/);
  assert.match(player, /Date\.now\(\) \+ result\.expiresIn/);
  assert.match(player, /requestRecordingUrl\(true\)/);
  assert.match(player, /setAccess\(null\)/);
  assert.doesNotMatch(player, /object_key|objectKey/);
  assert.doesNotMatch(player, /useQuery|zustand|localStorage|sessionStorage/);
  assert.match(page, /EmployerVerificationVideoPlayer/);
  assert.match(page, /app\/employer|employer/i);
});
