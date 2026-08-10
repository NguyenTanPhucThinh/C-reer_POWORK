import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import { createSubmissionSchema } from '../src/assessment/models/submission.schema.js'
import { createSubmission } from '../src/assessment/repositories/submission.repository.js'
import { assertSubmissionReviewable } from '../src/assessment/services/ownership.service.js'
import { sanitizeSubmissionContent } from '../src/assessment/services/submission.service.js'

const challengeId = crypto.randomUUID()
const validText = 'Một bài làm có nội dung hợp lệ và đủ dài để hệ thống tiếp nhận an toàn.'

test('submission contract accepts exactly one file or text shape', () => {
  assert.equal(
    createSubmissionSchema.safeParse({
      challenge_id: challengeId,
      submission_method: 'FILE',
      solution_url: 'submissions/challenge/file.pdf',
    }).success,
    true,
  )
  for (const content_format of ['RICH_TEXT', 'MARKDOWN']) {
    assert.equal(
      createSubmissionSchema.safeParse({
        challenge_id: challengeId,
        submission_method: 'TEXT',
        content_format,
        content: validText,
      }).success,
      true,
    )
  }

  for (const payload of [
    { challenge_id: challengeId, submission_method: 'FILE' },
    {
      challenge_id: challengeId,
      submission_method: 'TEXT',
      content_format: 'MARKDOWN',
      content: validText,
      solution_url: 'unexpected',
    },
    {
      challenge_id: challengeId,
      submission_method: 'TEXT',
      content_format: 'HTML',
      content: validText,
    },
  ]) {
    assert.equal(createSubmissionSchema.safeParse(payload).success, false)
  }
})

test('rich text is sanitized before storage without removing supported formatting', () => {
  const dirty = `<h2 onmouseover="alert(1)">${validText}</h2><script>alert(1)</script><a href="javascript:alert(2)">link</a>`
  const clean = sanitizeSubmissionContent(dirty, 'RICH_TEXT')

  assert.match(clean, /<h2>/)
  assert.doesNotMatch(clean, /script|onmouseover|javascript:/i)
})

test('content with too little readable text is rejected after sanitization', () => {
  assert.throws(
    () => sanitizeSubmissionContent('<img src=x onerror=alert(1)>ngắn', 'RICH_TEXT'),
    (error) => error?.errorCode === 'ASSESS_012',
  )
})

test('text submissions persist without file metadata and are immediately reviewable', async () => {
  let stored
  const database = {
    submission: {
      create: async ({ data }) => {
        stored = data
        return { id: 'submission-1', ...data }
      },
    },
  }

  const submission = await createSubmission(
    {
      challengeId,
      hashId: 'Candidate_ANONYMOUS',
      version: 1,
      submissionMethod: 'TEXT',
      content: validText,
      contentFormat: 'MARKDOWN',
    },
    database,
  )

  assert.equal(stored.solutionUrl, null)
  assert.equal(stored.fileStatus, null)
  assert.equal(assertSubmissionReviewable(submission), submission)
})

test('database enforces mutually exclusive text and file storage', async () => {
  const migration = await readFile(
    new URL(
      '../prisma/migrations/20260810100000_add_text_submissions/migration.sql',
      import.meta.url,
    ),
    'utf8',
  )

  assert.match(migration, /submissions_content_matches_method/)
  assert.match(migration, /"submission_method" = 'FILE'/)
  assert.match(migration, /"submission_method" = 'TEXT'/)
})
