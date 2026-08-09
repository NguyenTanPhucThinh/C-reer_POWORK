import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('Verification evidence upload retains retry data and follows the frozen Backend contract', async () => {
  const page = await readFile(
    new URL('../app/candidate/my-submissions/[id]/verification/page.tsx', import.meta.url),
    'utf8'
  );

  const uploadHelper = page.slice(
    page.indexOf('function uploadRecordingBlob'),
    page.indexOf('function describeEvidenceError')
  );
  assert.match(uploadHelper, /new XMLHttpRequest\(\)/);
  assert.match(uploadHelper, /request\.open\('PUT', uploadUrl\)/);
  assert.match(uploadHelper, /setRequestHeader\('Content-Type', 'video\/webm'\)/);
  assert.match(uploadHelper, /request\.upload\.onprogress/);
  assert.match(uploadHelper, /request\.status === 401 \|\| request\.status === 403/);
  assert.match(uploadHelper, /PresignedUrlExpiredError/);
  assert.match(uploadHelper, /NetworkError/);
  assert.doesNotMatch(uploadHelper, /axios/);

  const submission = page.slice(
    page.indexOf('async function submitVerificationEvidence'),
    page.indexOf('useEffect(() =>', page.indexOf('async function submitVerificationEvidence'))
  );
  assert.match(submission, /evidenceSubmissionLock\.current/);
  assert.match(submission, /state\.questions\.map/);
  assert.match(submission, /blob\.size === 0/);
  assert.match(submission, /blob\.type !== 'video\/webm'/);
  assert.match(submission, /blob\.size > VERIFICATION_MAX_FILE_BYTES/);
  assert.match(submission, /requestVerificationRecordingUpload/);
  assert.match(submission, /upload\.objectKey !== objectKey/);
  assert.match(submission, /uploadRecordingBlob/);
  assert.match(submission, /completeEvidenceOnce/);
  assert.match(submission, /getVerificationStatus/);
  assert.ok(
    submission.indexOf('blob.size > VERIFICATION_MAX_FILE_BYTES') <
      submission.indexOf('requestVerificationRecordingUpload')
  );
  assert.ok(
    submission.indexOf('requestVerificationRecordingUpload') <
      submission.indexOf('uploadRecordingBlob')
  );
  assert.ok(submission.indexOf('uploadRecordingBlob') < submission.indexOf('completeEvidenceOnce'));
  assert.ok(
    submission.indexOf('completeEvidenceOnce') < submission.indexOf('getVerificationStatus')
  );

  assert.match(page, /completeRequest\.current\?\.id === verificationId/);
  assert.match(page, /VERIFICATION_ALREADY_COMPLETED/);
  assert.match(page, /state\.evidenceUploaded/);
  assert.match(page, /phase === 'SCANNING'/);
  assert.match(page, /session\.status === 'PendingScan'/);
  assert.match(page, /window\.setTimeout\(poll, 1500\)/);
  assert.match(page, /SCAN_POLL_RECOVERED/);
  assert.match(page, /disabled=\{!allAnswersValid \|\| isSubmitting\}/);
  assert.match(page, /role="progressbar"/);
  for (const status of ['Ready', 'Rejected', 'ScanFailed', 'Expired']) {
    assert.match(page, new RegExp(`${status}: '(?:COMPLETED|FAILED)'`));
  }
  assert.match(page, /Mất kết nối trong khi hoàn tất/);
  assert.match(page, /URL upload đã hết hạn/);
  assert.match(page, /Video vượt quá giới hạn dung lượng/);
  assert.match(page, /Backend chưa xác nhận hoàn tất/);
  assert.match(page, /Xin URL mới và thử lại/);
  assert.match(page, /FILE_TOO_LARGE:[\s\S]*action: null/);
});
