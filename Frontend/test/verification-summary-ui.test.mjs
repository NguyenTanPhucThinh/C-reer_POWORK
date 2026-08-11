import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8');

test('Employer submission uses the protected verification summary contract without mock data', async () => {
  const [api, card, page] = await Promise.all([
    read('../lib/api/endpoints.ts'),
    read('../components/assessment/VerificationSummaryCard.tsx'),
    read('../app/employer/submissions/[submission_id]/grade/page.tsx'),
  ]);

  assert.match(api, /\/verification-summary/);
  for (const field of ['verification_status', 'completed_at', 'question_count', 'scan_status']) {
    assert.match(api, new RegExp(field));
  }
  for (const state of [
    'NotStarted',
    'PendingCamera',
    'CameraActive',
    'GeneratingQuestions',
    'Answering',
    'PendingUpload',
    'PendingScan',
    'Ready',
    'Rejected',
    'ScanFailed',
  ]) {
    assert.match(card, new RegExp(`${state}:`));
  }
  assert.match(card, /summary\.questionCount/);
  assert.match(card, /summary\.completedAt/);
  assert.match(card, /!isUnlocked/);
  assert.match(page, /useVerificationSummary\(submission\.submission_id\)/);
  assert.doesNotMatch(card, /mock/i);
});
