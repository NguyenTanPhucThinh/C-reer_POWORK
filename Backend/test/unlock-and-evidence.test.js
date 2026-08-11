import assert from 'node:assert/strict'
import test from 'node:test'

import { unlockCandidate } from '../src/assessment/services/submission.service.js'
import { hasCompanyUnlockedCandidate } from '../src/assessment/services/unlock-lookup.service.js'
import { addToTalentPool } from '../src/talent-pool/services/talent-pool.service.js'
import { addToTalentPool as addToTalentPoolController } from '../src/talent-pool/controllers/talent-pool.controller.js'

const companyId = 'company-1'
const userId = 'candidate-1'
const hashId = 'Candidate_A'

const createUnlockDatabase = () => {
  const state = { isUnlocked: false, status: 'EVALUATED', evidences: [] }
  const challenge = {
    id: 'challenge-1',
    companyId,
    title: 'Challenge',
    companyName: 'Company',
    industry: 'IT',
  }

  return {
    state,
    database: {
      $transaction: async (work) => {
        const before = structuredClone(state)
        const tx = {
          submission: {
            findUnique: async () => ({
              id: 'submission-1',
              challengeId: challenge.id,
              status: state.status,
              fileStatus: 'SAFE',
              identityMapping: { hashId, userId, isUnlocked: state.isUnlocked },
              evaluationResults: [{ score: 8, criteria: { maxScore: 10, weight: 100 } }],
            }),
            update: async ({ data }) => {
              state.status = data.status
            },
          },
          challenge: { findUnique: async () => challenge },
          identityMapping: {
            updateMany: async () => {
              if (state.isUnlocked) return { count: 0 }
              state.isUnlocked = true
              return { count: 1 }
            },
          },
          verifiedEvidence: {
            create: async ({ data }) => {
              state.evidences.push(data)
            },
          },
        }

        try {
          return await work(tx)
        } catch (error) {
          Object.assign(state, before)
          throw error
        }
      },
    },
  }
}

test('unlock is one-time and a repeated request creates no duplicate evidence', async () => {
  const { state, database } = createUnlockDatabase()
  const getUserById = async () => ({ email: 'candidate@example.com', full_name: 'Candidate' })

  await unlockCandidate('submission-1', companyId, database, getUserById)
  await assert.rejects(
    unlockCandidate('submission-1', companyId, database, getUserById),
    (error) => error?.statusCode === 409 && error?.errorCode === 'ASSESS_004',
  )

  assert.equal(state.isUnlocked, true)
  assert.equal(state.status, 'APPROVED')
  assert.equal(state.evidences.length, 1)
  assert.equal(state.evidences[0].sourceHashId, hashId)
})

test('a failure before unlock commit rolls back every database state', async () => {
  const { state, database } = createUnlockDatabase()

  await assert.rejects(
    unlockCandidate('submission-1', companyId, database, async () => {
      throw new Error('IAM lookup failed')
    }),
    /IAM lookup failed/,
  )

  assert.deepEqual(state, { isUnlocked: false, status: 'EVALUATED', evidences: [] })
})

test('unlock lookup accepts only the company that owns an unlocked Challenge', async () => {
  const queries = []
  const database = {
    identityMapping: {
      findMany: async ({ where }) => {
        queries.push(where)
        return [{ challengeId: 'challenge-1' }, { challengeId: 'challenge-2' }]
      },
    },
    challenge: {
      findFirst: async ({ where }) => {
        queries.push(where)
        return where.companyId === companyId ? { id: 'challenge-1' } : null
      },
    },
  }

  assert.equal(await hasCompanyUnlockedCandidate({ companyId, userId }, database), true)
  assert.equal(
    await hasCompanyUnlockedCandidate({ companyId: 'company-2', userId }, database),
    false,
  )
  assert.deepEqual(queries[0], { userId, isUnlocked: true })
  assert.deepEqual(queries[1].id.in, ['challenge-1', 'challenge-2'])
})

test('Talent Pool rejects a Candidate unlocked by another company without side effects', async () => {
  const calls = []
  const database = {
    talentPool: {
      findUnique: async () => calls.push('findUnique'),
      create: async () => calls.push('create'),
    },
  }

  await assert.rejects(
    addToTalentPool(
      { companyId, userId },
      {
        database,
        getUserById: async () => calls.push('getUserById'),
        hasCompanyUnlockedCandidate: async () => false,
      },
    ),
    (error) => error?.statusCode === 403 && error?.errorCode === 'POOL_007',
  )
  assert.deepEqual(calls, [])
})

test('Talent Pool stores the JWT company only after its own unlock is verified', async () => {
  const writes = []
  const database = {
    talentPool: {
      findUnique: async () => null,
      create: async ({ data }) => writes.push(data),
    },
  }

  await addToTalentPool(
    { companyId, userId },
    {
      database,
      getUserById: async () => ({ user_id: userId }),
      hasCompanyUnlockedCandidate: async ({ companyId: checkedCompany }) =>
        checkedCompany === companyId,
    },
  )

  assert.deepEqual(writes, [{ companyId, userId, status: 'IN_POOL' }])
})

test('Talent Pool HTTP boundary accepts snake_case only', async () => {
  await assert.rejects(
    addToTalentPoolController({ body: { userId }, user: { companyId } }, {}),
    (error) => error?.statusCode === 400 && error?.errorCode === 'POOL_001',
  )
})
