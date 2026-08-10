import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8');

test('unlocked Employer dashboard renders every evidence area from the protected API', async () => {
  const [api, page, sections] = await Promise.all([
    read('../lib/api/endpoints.ts'),
    read('../app/employer/submissions/[submission_id]/verification/page.tsx'),
    read('../components/assessment/VerificationDashboardSections.tsx'),
  ]);

  assert.match(api, /\/verification-dashboard/);
  for (const field of ['statistics', 'timeline', 'questions', 'answers', 'video']) {
    assert.match(api, new RegExp(field));
  }
  assert.match(page, /useVerificationDashboard/);
  for (const section of [
    'VerificationOverview',
    'VerificationTimelineSection',
    'VerificationStatisticsSection',
    'VerificationQuestionAnswersSection',
    'VerificationVideoStatusSection',
  ]) {
    assert.match(page, new RegExp(section));
    assert.match(sections, new RegExp(`function ${section}`));
  }
  assert.doesNotMatch(page, /mock/i);
});
