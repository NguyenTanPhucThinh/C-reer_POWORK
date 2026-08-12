import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('Candidate verification shell is resumable and derives its phase from Backend status', async () => {
  const [page, candidateLayout, dashboardShell, footer, submitPage] = await Promise.all([
    readFile(
      new URL('../app/candidate/my-submissions/[id]/verification/page.tsx', import.meta.url),
      'utf8'
    ),
    readFile(new URL('../app/candidate/layout.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../components/layout/DashboardShell.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../components/layout/Footer.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../app/candidate/challenges/[id]/submit/page.tsx', import.meta.url), 'utf8'),
  ]);

  for (const phase of [
    'PREPARING',
    'STARTING',
    'ORAL_ACTIVE',
    'GENERATING_QUESTIONS',
    'ANSWERING',
    'PREPARING_UPLOAD',
    'UPLOADING',
    'COMPLETING',
    'SCANNING',
    'COMPLETED',
    'FAILED',
  ]) {
    assert.match(page, new RegExp(`'${phase}'`));
  }

  assert.match(page, /useReducer\(verificationReducer, initialState\)/);
  assert.match(page, /phase: STATUS_PHASE\[action\.session\.status\]/);
  assert.match(page, /assessmentAPI\.startVerification/);
  assert.match(page, /assessmentAPI\.resumeVerification/);
  assert.match(page, /sessionStorage\.setItem/);
  assert.match(page, /transitionLock\.current/);
  assert.doesNotMatch(page, /apiClient\.|user_id/);
  assert.match(page, /function VerificationStepProgress/);
  assert.match(page, /aria-label="Tiến trình xác thực"/);
  assert.match(page, /aria-current=\{current \? 'step' : undefined\}/);
  assert.match(page, /const remainingSeconds = Math\.max/);
  assert.match(page, /Còn \{formatRecordingTime\(remainingSeconds\)\}/);
  assert.match(page, /motion-reduce:animate-none/);
  assert.match(page, /motion-reduce:transition-none/);
  assert.match(page, /focus-visible:ring-2/);
  assert.match(page, /sm:min-h-56/);
  assert.match(page, /rulesAccepted/);
  assert.match(page, /disabled=\{!rulesAccepted\}/);
  assert.match(page, /Không xác định được bài nộp/);
  assert.doesNotMatch(page, /framer-motion|motion\/react/);

  const fullscreenRequest = page.indexOf('document.documentElement.requestFullscreen()');
  const mediaCheck = page.indexOf('recorder.prepareMedia()');
  const sessionStart = page.indexOf('assessmentAPI.startVerification');
  assert.ok(fullscreenRequest > 0 && fullscreenRequest < mediaCheck);
  assert.ok(mediaCheck < sessionStart);
  assert.match(page, /addEventListener\('fullscreenchange'/);
  assert.match(page, /addEventListener\('visibilitychange'/);
  assert.match(page, /addEventListener\('blur'/);
  assert.match(page, /addEventListener\('beforeunload'/);
  assert.match(page, /now - lastFocusLossAt\.current < 750/);
  assert.match(page, /sendVerificationEventWithRetry\(verificationId, 'FOCUS_LOST', 2\)/);
  assert.match(page, /Quay lại toàn màn hình/);
  assert.doesNotMatch(page, /addEventListener\('keydown'/);

  assert.match(candidateLayout, /showNavigation=\{!isCandidateVerificationPath\(pathname\)\}/);
  assert.match(dashboardShell, /if \(!showNavigation\)/);
  assert.match(footer, /if \(isCandidateVerificationPath\(pathname\)\) return null/);
  assert.match(submitPage, /return assessmentAPI\.submit/);
  assert.match(
    submitPage,
    /router\.push\(`\/candidate\/my-submissions\/\$\{submission\.submission_id\}\/verification`\)/
  );
});
