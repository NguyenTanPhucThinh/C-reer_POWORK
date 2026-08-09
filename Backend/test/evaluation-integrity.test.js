import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import { evaluateSubmission } from '../src/assessment/services/evaluation.service.js'
import { unlockCandidate } from '../src/assessment/services/submission.service.js'

const companyId = 'company-1'
const challenge = {
  id: 'challenge-1',
  companyId,
  title: 'Challenge',
  companyName: 'Company',
  industry: 'IT',
}

const createEvaluationDatabase = ({ status = 'PENDING', criteria } = {}) => {
  const writes = []
  const transaction = {
    submission: {
      findUnique: async () => ({
        id: 'submission-1',
        challengeId: challenge.id,
        status,
        fileStatus: 'SAFE',
        identityMapping: { isUnlocked: false },
      }),
      update: async ({ data }) => writes.push(['submission.update', data]),
    },
    challenge: { findUnique: async () => challenge },
    rubricCriteria: {
      findMany: async () => criteria ?? [{ id: 'criteria-1', maxScore: 10 }],
    },
    evaluationResult: {
      createMany: async ({ data }) => writes.push(['evaluationResult.createMany', data]),
    },
  }

  return { database: { $transaction: async (work) => work(transaction) }, writes }
}

test('accepts score boundaries and writes one result per criterion', async () => {
  const { database, writes } = createEvaluationDatabase({
    criteria: [
      { id: 'criteria-1', maxScore: 10 },
      { id: 'criteria-2', maxScore: 5 },
    ],
  })

  await evaluateSubmission(
    'submission-1',
    {
      evaluations: [
        { criteriaId: 'criteria-1', score: 0 },
        { criteriaId: 'criteria-2', score: 5 },
      ],
    },
    companyId,
    database,
  )

  assert.equal(writes[0][0], 'evaluationResult.createMany')
  assert.equal(writes[0][1].length, 2)
  assert.equal(writes[1][0], 'submission.update')
})

test('rejects duplicate criteria without writing partial evaluation data', async () => {
  const { database, writes } = createEvaluationDatabase()

  await assert.rejects(
    evaluateSubmission(
      'submission-1',
      {
        evaluations: [
          { criteriaId: 'criteria-1', score: 5 },
          { criteriaId: 'criteria-1', score: 6 },
        ],
      },
      companyId,
      database,
    ),
    (error) => error?.statusCode === 400 && error?.errorCode === 'ASSESS_007',
  )
  assert.deepEqual(writes, [])
})

test('rejects scores outside criterion maxScore without writing', async () => {
  for (const score of [-1, 10.01, Number.NaN]) {
    const { database, writes } = createEvaluationDatabase()
    await assert.rejects(
      evaluateSubmission(
        'submission-1',
        { evaluations: [{ criteriaId: 'criteria-1', score }] },
        companyId,
        database,
      ),
      (error) => error?.statusCode === 400 && error?.errorCode === 'ASSESS_007',
    )
    assert.deepEqual(writes, [])
  }
})

test('only a pending submission can receive an effective evaluation', async () => {
  for (const status of ['EVALUATED', 'APPROVED', 'REJECTED']) {
    const { database, writes } = createEvaluationDatabase({ status })
    await assert.rejects(
      evaluateSubmission(
        'submission-1',
        { evaluations: [{ criteriaId: 'criteria-1', score: 5 }] },
        companyId,
        database,
      ),
      (error) => error?.statusCode === 409 && error?.errorCode === 'ASSESS_011',
    )
    assert.deepEqual(writes, [])
  }
})

test('a lost unlock race cannot alter the submission or create another snapshot', async () => {
  const writes = []
  const transaction = {
    submission: {
      findUnique: async () => ({
        id: 'submission-1',
        challengeId: challenge.id,
        status: 'EVALUATED',
        fileStatus: 'SAFE',
        identityMapping: {
          hashId: 'Candidate_A',
          userId: 'candidate-1',
          isUnlocked: false,
        },
        evaluationResults: [{ score: 8, criteria: { maxScore: 10, weight: 100 } }],
      }),
      update: async () => writes.push('submission.update'),
    },
    challenge: { findUnique: async () => challenge },
    identityMapping: {
      updateMany: async () => ({ count: 0 }),
    },
    verifiedEvidence: { create: async () => writes.push('verifiedEvidence.create') },
  }

  await assert.rejects(
    unlockCandidate('submission-1', companyId, {
      $transaction: async (work) => work(transaction),
    }),
    (error) => error?.statusCode === 409 && error?.errorCode === 'ASSESS_004',
  )
  assert.deepEqual(writes, [])
})

test('database constraints keep evaluations and unlock snapshots unique', async () => {
  const schema = await readFile(new URL('../prisma/schema.prisma', import.meta.url), 'utf8')

  assert.match(schema, /@@unique\(\[submissionId, criteriaId\]\)/)
  assert.match(schema, /sourceHashId\s+String\?\s+@unique/)
})
