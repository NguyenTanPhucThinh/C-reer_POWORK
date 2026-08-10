import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8');

test('integrity counters stay neutral, explained, and contextualized beside evidence', async () => {
  const [sections, page] = await Promise.all([
    read('../components/assessment/VerificationDashboardSections.tsx'),
    read('../app/employer/submissions/[submission_id]/verification/page.tsx'),
  ]);
  const integritySection = sections.match(
    /export function VerificationIntegritySignalsSection[\s\S]*?export function VerificationQuestionAnswersSection/
  )?.[0];

  assert.ok(integritySection);
  assert.match(integritySection, /Client-reported signals/);
  assert.match(integritySection, /không đủ để\s+tự động kết luận/);
  assert.match(integritySection, /role="tooltip"/);
  assert.match(integritySection, /title={signal\.explanation}/);
  assert.doesNotMatch(integritySection, /text-error|bg-error|border-error/);
  assert.match(page, /VerificationIntegritySignalsSection[\s\S]*EmployerVerificationVideoPlayer/);
  assert.match(page, /VerificationQuestionAnswersSection/);
  assert.match(page, /VerificationTimelineSection/);
});
