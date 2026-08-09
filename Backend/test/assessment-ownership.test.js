import assert from 'node:assert/strict'
import test from 'node:test'

import { evaluateSubmission } from '../src/assessment/services/evaluation.service.js'
import {
  getSubmissionsByChallenge,
  rejectSubmission,
  unlockCandidate,
} from '../src/assessment/services/submission.service.js'

const ownCompanyId = 'company-a'
const foreignChallenge = {
  id: 'challenge-b',
  companyId: 'company-b',
  title: 'Foreign challenge',
  companyName: 'Company B',
  industry: 'IT',
}

const isForbidden = (error) => error?.statusCode === 403 && error?.errorCode === 'ASSESS_005'

test('foreign challenge ID cannot list submissions', async () => {
  const database = {
    challenge: { findUnique: async () => foreignChallenge },
  }

  await assert.rejects(
    getSubmissionsByChallenge(foreignChallenge.id, ownCompanyId, database),
    isForbidden,
  )
})

test('foreign submission ID cannot create evaluations or change status', async () => {
  const writes = []
  const transaction = {
    submission: {
      findUnique: async () => ({
        id: 'submission-b',
        challengeId: foreignChallenge.id,
        identityMapping: { isUnlocked: false },
      }),
      update: async () => writes.push('submission.update'),
    },
    challenge: { findUnique: async () => foreignChallenge },
    rubricCriteria: { count: async () => 1 },
    evaluationResult: { createMany: async () => writes.push('evaluationResult.createMany') },
  }
  const database = { $transaction: async (work) => work(transaction) }

  await assert.rejects(
    evaluateSubmission(
      'submission-b',
      { evaluations: [{ criteriaId: 'criteria-b', score: 8 }], generalComment: 'tampered' },
      ownCompanyId,
      database,
    ),
    isForbidden,
  )
  assert.deepEqual(writes, [])
})

test('criteria ID from another challenge cannot create partial evaluation data', async () => {
  const writes = []
  const ownChallenge = { ...foreignChallenge, id: 'challenge-a', companyId: ownCompanyId }
  const transaction = {
    submission: {
      findUnique: async () => ({
        id: 'submission-a',
        challengeId: ownChallenge.id,
        identityMapping: { isUnlocked: false },
      }),
      update: async () => writes.push('submission.update'),
    },
    challenge: { findUnique: async () => ownChallenge },
    rubricCriteria: { count: async () => 0 },
    evaluationResult: { createMany: async () => writes.push('evaluationResult.createMany') },
  }
  const database = { $transaction: async (work) => work(transaction) }

  await assert.rejects(
    evaluateSubmission(
      'submission-a',
      { evaluations: [{ criteriaId: 'criteria-b', score: 8 }] },
      ownCompanyId,
      database,
    ),
    (error) => error?.statusCode === 400 && error?.errorCode === 'ASSESS_007',
  )
  assert.deepEqual(writes, [])
})

test('foreign submission ID cannot be rejected', async () => {
  const writes = []
  const transaction = {
    submission: {
      findUnique: async () => ({
        id: 'submission-b',
        challengeId: foreignChallenge.id,
        identityMapping: { isUnlocked: false },
      }),
      update: async () => writes.push('submission.update'),
    },
    challenge: { findUnique: async () => foreignChallenge },
  }
  const database = { $transaction: async (work) => work(transaction) }

  await assert.rejects(rejectSubmission('submission-b', ownCompanyId, database), isForbidden)
  assert.deepEqual(writes, [])
})

test('foreign submission ID cannot approve, unlock, or create evidence', async () => {
  const writes = []
  const transaction = {
    submission: {
      findUnique: async () => ({
        id: 'submission-b',
        challengeId: foreignChallenge.id,
        identityMapping: {
          hashId: 'Candidate_B',
          userId: 'candidate-b',
          challengeId: foreignChallenge.id,
          isUnlocked: false,
        },
        evaluationResults: [],
      }),
      update: async () => writes.push('submission.update'),
    },
    challenge: { findUnique: async () => foreignChallenge },
    identityMapping: { update: async () => writes.push('identityMapping.update') },
    verifiedEvidence: { create: async () => writes.push('verifiedEvidence.create') },
  }
  const database = { $transaction: async (work) => work(transaction) }

  await assert.rejects(unlockCandidate('submission-b', ownCompanyId, database), isForbidden)
  assert.deepEqual(writes, [])
})
