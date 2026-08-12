import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8');

test('Employer submission queue uses real overview data and links to grading', async () => {
  const [page, navigation] = await Promise.all([
    read('../app/employer/submissions/page.tsx'),
    read('../lib/constants/nav.ts'),
  ]);

  assert.match(page, /useEmployerOverview/);
  assert.match(page, /data\.reviewQueue\.map/);
  assert.match(page, /submission\.submissionId/);
  assert.match(page, /challengeId=\$\{submission\.challengeId\}/);
  assert.doesNotMatch(page, /mock/i);
  assert.match(navigation, /href: '\/employer\/submissions'/);
});

test('grading restores persisted rubric scores without a fixed-height overlapping workspace', async () => {
  const [page, assessmentApi] = await Promise.all([
    read('../app/employer/submissions/[submission_id]/grade/page.tsx'),
    read('../lib/api/assessment.ts'),
  ]);

  assert.match(page, /initialEvaluations=\{submission\.evaluations\}/);
  assert.match(page, /initialGeneralComment=\{submission\.general_comment\}/);
  assert.match(page, /grid grid-cols-1 items-start/);
  assert.doesNotMatch(page, /lg:h-\[calc\(100vh-7rem\)\]/);
  assert.match(assessmentApi, /evaluations: selectedSubmission\.evaluations \?\? \[\]/);
});
