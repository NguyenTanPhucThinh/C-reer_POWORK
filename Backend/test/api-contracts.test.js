import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import {
  createChallengeSchema,
  updateChallengeStatusSchema,
} from '../src/challenge/models/challenge.schema.js'
import {
  createSubmissionSchema,
  evaluateSubmissionSchema,
  unlockSubmissionSchema,
} from '../src/assessment/models/submission.schema.js'
import { registerSchema } from '../src/iam/models/auth.schema.js'

test('public API accepts only the documented snake_case contracts', async () => {
  const registration = {
    email: 'candidate@example.com',
    password: 'Test12345!',
    full_name: 'POWORK Candidate',
    role: 'Candidate',
  }
  assert.equal(registerSchema.safeParse(registration).success, false)
  assert.equal(registerSchema.safeParse({ ...registration, accepted_terms: true }).success, true)

  assert.equal(
    createChallengeSchema.safeParse({
      title: 'API contract',
      description: 'Boundary mapping',
      industry: 'IT',
      deadline: '2026-12-31T00:00:00.000Z',
      rubrics: [{ criteria_name: 'Correctness', weight: 100, max_score: 10 }],
    }).success,
    true,
  )
  assert.equal(updateChallengeStatusSchema.safeParse({ status: 'Open' }).success, true)
  assert.equal(updateChallengeStatusSchema.safeParse({ status: 'OPEN' }).success, false)

  assert.equal(
    createSubmissionSchema.safeParse({
      challenge_id: crypto.randomUUID(),
      submission_method: 'FILE',
      solution_url: 'key',
    }).success,
    true,
  )
  assert.equal(
    createSubmissionSchema.safeParse({ challengeId: crypto.randomUUID(), solutionUrl: 'key' })
      .success,
    false,
  )
  assert.equal(
    evaluateSubmissionSchema.safeParse({
      evaluations: [{ criteria_id: crypto.randomUUID(), score: 8 }],
      general_comment: 'Good',
    }).success,
    true,
  )
  assert.equal(unlockSubmissionSchema.safeParse({ action: 'APPROVE' }).success, true)
  assert.equal(unlockSubmissionSchema.safeParse({ action: 'REJECT' }).success, false)

  const [challengeController, submissionController, uploadController] = await Promise.all([
    readFile(
      new URL('../src/challenge/controllers/challenge.controller.js', import.meta.url),
      'utf8',
    ),
    readFile(
      new URL('../src/assessment/controllers/submission.controller.js', import.meta.url),
      'utf8',
    ),
    readFile(
      new URL('../src/assessment/controllers/upload.controller.js', import.meta.url),
      'utf8',
    ),
  ])

  assert.match(challengeController, /challenge_id: challengeId/)
  assert.match(submissionController, /submission_id: submissionId/)
  assert.match(submissionController, /challenge_id: challengeId/)
  assert.match(uploadController, /challenge_id: challengeId/)
})
