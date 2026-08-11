import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('Candidate verification API keeps the frozen Backend contract at one boundary', async () => {
  const [types, endpoints] = await Promise.all([
    readFile(new URL('../lib/types/assessment.ts', import.meta.url), 'utf8'),
    readFile(new URL('../lib/api/endpoints.ts', import.meta.url), 'utf8'),
  ]);

  for (const status of [
    'PendingCamera',
    'CameraActive',
    'GeneratingQuestions',
    'Answering',
    'PendingUpload',
    'PendingScan',
    'Ready',
    'Rejected',
    'ScanFailed',
    'Expired',
  ]) {
    assert.match(types, new RegExp(`'${status}'`));
  }

  const verificationBoundary = endpoints.slice(
    endpoints.indexOf('interface VerificationSessionResponse'),
    endpoints.indexOf('// Profile Module')
  );

  for (const operation of [
    'startVerification',
    'resumeVerification',
    'getVerificationStatus',
    'generateVerificationQuestions',
    'sendVerificationEvent',
    'requestVerificationRecordingUpload',
    'completeVerification',
  ]) {
    assert.match(verificationBoundary, new RegExp(`${operation}:`));
  }

  assert.match(verificationBoundary, /oral_duration_seconds: payload\.oralDurationSeconds/);
  assert.match(verificationBoundary, /questionId: question\.question_id/);
  assert.match(verificationBoundary, /object_key: payload\.objectKey/);
  assert.match(verificationBoundary, /recording_mime_type: payload\.recordingMimeType/);
  assert.match(verificationBoundary, /question_id: answer\.questionId/);
  assert.doesNotMatch(verificationBoundary, /user_id|userId/);
});
