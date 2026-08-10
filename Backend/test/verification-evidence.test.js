import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import { config } from '../src/shared/config/index.js'
import { authorize } from '../src/shared/middlewares/auth.middleware.js'
import {
  getVerificationDashboard,
  getVerificationRecording,
  getVerificationSummary,
} from '../src/assessment/services/verification-recording.service.js'

const submissionId = 'submission-1'
const companyId = 'company-1'
const objectKey = 'verifications/33333333-3333-4333-8333-333333333333.webm'
const completedAt = new Date('2026-08-09T12:10:00.000Z')
const verification = {
  id: 'verification-1',
  submissionId,
  status: 'READY',
  questions: [
    {
      questionId: '11111111-1111-4111-8111-111111111111',
      question: 'Explain the main trade-off.',
      minimumLength: 80,
      maximumLength: 4000,
    },
  ],
  answers: [
    {
      questionId: '11111111-1111-4111-8111-111111111111',
      answer: 'A sufficiently detailed answer.',
    },
  ],
  selectedOralDurationSeconds: 60,
  actualOralDurationSeconds: 55,
  recordingObjectKey: objectKey,
  recordingMimeType: 'video/webm',
  recordingSize: 1024,
  oralStartedAt: new Date('2026-08-09T12:00:00.000Z'),
  oralCompletedAt: new Date('2026-08-09T12:00:55.000Z'),
  answeringStartedAt: new Date('2026-08-09T12:01:00.000Z'),
  answeringCompletedAt: new Date('2026-08-09T12:09:00.000Z'),
  completedAt,
  createdAt: new Date('2026-08-09T11:59:00.000Z'),
  cameraInterruptionCount: 1,
  cameraInterruptionDurationSeconds: 4,
  focusLossCount: 2,
  pasteBlockedCount: 3,
  selectAllBlockedCount: 4,
  copyBlockedCount: 5,
  dropBlockedCount: 6,
}

const selectFields = (record, select) =>
  Object.fromEntries(Object.keys(select).map((field) => [field, structuredClone(record[field])]))

const createDatabase = ({
  ownerCompanyId = companyId,
  isUnlocked = true,
  submissionStatus = 'APPROVED',
  verificationOverrides = {},
  hasVerification = true,
} = {}) => {
  const queries = []
  const storedVerification = { ...verification, ...verificationOverrides }
  const database = {
    submission: {
      findUnique: async ({ where, select }) => {
        queries.push({ model: 'submission', select })
        if (where.id !== submissionId) return null
        return {
          id: submissionId,
          challengeId: 'challenge-1',
          status: submissionStatus,
          identityMapping: { isUnlocked },
          verification: hasVerification
            ? selectFields(storedVerification, select.verification.select)
            : null,
        }
      },
    },
    challenge: {
      findUnique: async () => ({ id: 'challenge-1', companyId: ownerCompanyId }),
    },
  }
  return { database, queries }
}

test('summary returns only status metadata and never queries protected evidence', async () => {
  const session = createDatabase({ isUnlocked: false })
  const summary = await getVerificationSummary(submissionId, companyId, session.database)

  assert.deepEqual(summary, {
    status: 'READY',
    completedAt,
    questionCount: 1,
    scanStatus: 'SAFE',
  })
  assert.deepEqual(Object.keys(summary).sort(), [
    'completedAt',
    'questionCount',
    'scanStatus',
    'status',
  ])
  const selectedVerificationFields = session.queries[0].select.verification.select
  for (const protectedField of [
    'answers',
    'recordingObjectKey',
    'recordingMimeType',
    'recordingSize',
  ]) {
    assert.equal(protectedField in selectedVerificationFields, false)
  }
})

test('changing Submission ID cannot cross company ownership on any Employer evidence API', async () => {
  const foreign = createDatabase({ ownerCompanyId: 'company-2' })
  const calls = [
    () => getVerificationSummary(submissionId, companyId, foreign.database),
    () => getVerificationDashboard(submissionId, companyId, foreign.database),
    () =>
      getVerificationRecording(submissionId, companyId, {
        database: foreign.database,
        presign: async () => 'url',
      }),
  ]
  for (const call of calls) {
    await assert.rejects(call(), (error) => error?.errorCode === 'ASSESS_005')
  }
})

test('the owning Employer cannot access dashboard or video before unlock', async () => {
  const locked = createDatabase({ isUnlocked: false })
  const calls = [
    () => getVerificationDashboard(submissionId, companyId, locked.database),
    () =>
      getVerificationRecording(submissionId, companyId, {
        database: locked.database,
        presign: async () => 'url',
      }),
  ]
  for (const call of calls) {
    await assert.rejects(call(), (error) => error?.errorCode === 'VERIFICATION_LOCKED')
  }
})

test('unlocking another version does not expose this exact Submission evidence', async () => {
  const otherVersionUnlocked = createDatabase({ isUnlocked: true, submissionStatus: 'EVALUATED' })
  await assert.rejects(
    getVerificationDashboard(submissionId, companyId, otherVersionUnlocked.database),
    (error) => error?.errorCode === 'VERIFICATION_LOCKED',
  )
})

test('Candidate role is rejected and all evidence routes require EMPLOYER', async () => {
  assert.throws(
    () => authorize('EMPLOYER')({ user: { role: 'CANDIDATE' } }, {}, () => {}),
    (error) => error?.errorCode === 'AUTH_003',
  )

  const routes = await readFile(
    new URL('../src/assessment/routes/submission.routes.js', import.meta.url),
    'utf8',
  )
  for (const path of [
    '/submissions/:submission_id/verification-summary',
    '/submissions/:submission_id/verification-dashboard',
    '/submissions/:submission_id/verification-recording',
  ]) {
    const start = routes.indexOf(`'${path}'`)
    const block = routes.slice(start, routes.indexOf(')', start) + 1)
    assert.notEqual(start, -1)
    assert.match(block, /authenticate/)
    assert.match(block, /authorize\('EMPLOYER'\)/)
  }
})

test('dashboard and recording reject a verification that is not READY', async () => {
  const pending = createDatabase({ verificationOverrides: { status: 'PENDING_SCAN' } })
  let presignCount = 0

  await assert.rejects(
    getVerificationDashboard(submissionId, companyId, pending.database),
    (error) => error?.errorCode === 'VERIFICATION_NOT_READY',
  )
  await assert.rejects(
    getVerificationRecording(submissionId, companyId, {
      database: pending.database,
      presign: async () => {
        presignCount += 1
        return 'url'
      },
    }),
    (error) => error?.errorCode === 'VERIFICATION_NOT_READY',
  )
  assert.equal(presignCount, 0)
})

test('the owning Employer receives complete READY evidence only after unlock', async () => {
  const owned = createDatabase()
  const dashboard = await getVerificationDashboard(submissionId, companyId, owned.database)

  assert.equal(dashboard.id, 'verification-1')
  assert.equal(dashboard.status, 'READY')
  assert.deepEqual(dashboard.questions, verification.questions)
  assert.deepEqual(dashboard.answers, verification.answers)
  assert.equal(dashboard.actualOralDurationSeconds, 55)
  assert.equal(dashboard.cameraInterruptionCount, 1)
  assert.equal(dashboard.focusLossCount, 2)
  assert.equal('recordingObjectKey' in dashboard, false)
  assert.equal('userId' in dashboard, false)
})

test('recording URL is short-lived and signed only for the stored READY object', async () => {
  const owned = createDatabase()
  const signedKeys = []
  const result = await getVerificationRecording(submissionId, companyId, {
    database: owned.database,
    presign: async (key) => {
      signedKeys.push(key)
      return `https://minio.test/${key}?signature=short-lived`
    },
  })

  assert.deepEqual(signedKeys, [objectKey])
  assert.equal(result.expiresIn, config.r2.presignedExpirySeconds)
  assert.equal(result.expiresIn, 300)
  assert.match(result.recordingUrl, /signature=short-lived/)
})

test('a mismatched Verification relation is rejected before evidence is returned', async () => {
  const mismatch = createDatabase({
    verificationOverrides: { submissionId: 'submission-2' },
  })
  await assert.rejects(
    getVerificationDashboard(submissionId, companyId, mismatch.database),
    (error) => error?.errorCode === 'VERIFICATION_INVALID_STATE',
  )
})
