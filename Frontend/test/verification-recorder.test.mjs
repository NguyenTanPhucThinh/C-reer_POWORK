import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('Verification recorder fails unsupported browsers early and records bounded WebM evidence', async () => {
  const [hook, page, env] = await Promise.all([
    readFile(new URL('../lib/hooks/useVerificationRecorder.ts', import.meta.url), 'utf8'),
    readFile(
      new URL('../app/candidate/my-submissions/[id]/verification/page.tsx', import.meta.url),
      'utf8'
    ),
    readFile(new URL('../.env.example', import.meta.url), 'utf8'),
  ]);

  assert.match(hook, /navigator\.mediaDevices\?\.getUserMedia/);
  assert.match(hook, /typeof MediaRecorder === 'undefined'/);
  assert.match(hook, /MediaRecorder\.isTypeSupported\(VERIFICATION_RECORDING_MIME_TYPE\)/);
  assert.match(hook, /document\.fullscreenEnabled/);
  assert.match(hook, /videoBitsPerSecond: VERIFICATION_VIDEO_BITS_PER_SECOND/);
  assert.match(hook, /audioBitsPerSecond: VERIFICATION_AUDIO_BITS_PER_SECOND/);
  assert.match(hook, /recorder\.onstart = \(\) => \{[\s\S]*updateStatus\('recording'\)/);
  assert.match(hook, /blob\.size > VERIFICATION_MAX_FILE_BYTES/);
  assert.match(hook, /track\.onended/);
  assert.match(hook, /track\.stop\(\)/);
  assert.match(hook, /\(\) => \(\) => \{/);
  assert.match(env, /NEXT_PUBLIC_MAX_FILE_SIZE_MB=10/);

  assert.match(page, /<video[\s\S]*autoPlay[\s\S]*muted[\s\S]*playsInline/);
  assert.match(page, /status === 'recording'/);
  assert.match(page, /aria-live="polite"/);
  assert.match(page, /animate-pulse/);
  assert.match(page, />Recording</);
  for (const event of ['ORAL_STARTED', 'ORAL_COMPLETED', 'CAMERA_INTERRUPTED', 'CAMERA_RESTORED']) {
    assert.match(page, new RegExp(`'${event}'`));
  }
});
