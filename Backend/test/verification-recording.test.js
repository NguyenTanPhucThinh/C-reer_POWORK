import assert from 'node:assert/strict'
import test from 'node:test'

import { completeVerificationSchema } from '../src/assessment/models/submission.schema.js'
import {
  completeVerification,
  createVerificationRecordingObjectKey,
  createVerificationRecordingUpload,
} from '../src/assessment/services/verification-recording.service.js'

const now = new Date('2026-08-09T12:00:00.000Z')
const questionIds = ['11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222']
const questions = questionIds.map((questionId) => ({
  questionId,
  question: 'Question',
  minimumLength: 80,
  maximumLength: 4000,
}))
const answers = questionIds.map((questionId, index) => ({
  questionId,
  answer: `${index + 1} `.padEnd(80, 'a'),
}))
const objectKey = 'verifications/33333333-3333-4333-8333-333333333333.webm'

const createDatabase = ({ ownerId = 'candidate-1', status = 'PENDING_UPLOAD' } = {}) => {
  let transactionCount = 0
  let updateCount = 0
  const state = {
    id: 'verification-1',
    status,
    expiresAt: new Date('2026-08-09T12:15:00.000Z'),
    questions: structuredClone(questions),
    answers: null,
    recordingObjectKey: status === 'ANSWERING' ? null : objectKey,
    recordingMimeType: null,
    recordingSize: null,
    answeringCompletedAt: null,
    submission: { identityMapping: { userId: ownerId } },
  }

  const database = {
    submissionVerification: {
      findUnique: async ({ where }) => (where.id === state.id ? structuredClone(state) : null),
      updateMany: async ({ where, data }) => {
        if (where.id !== state.id) return { count: 0 }
        if (where.status && where.status !== state.status) return { count: 0 }
        if (
          'recordingObjectKey' in where &&
          where.recordingObjectKey !== state.recordingObjectKey
        ) {
          return { count: 0 }
        }
        if (where.expiresAt?.gt && state.expiresAt <= where.expiresAt.gt) return { count: 0 }
        updateCount += 1
        Object.assign(state, data)
        return { count: 1 }
      },
    },
  }
  database.$transaction = async (work) => {
    transactionCount += 1
    return work(database)
  }

  return {
    database,
    state,
    getTransactionCount: () => transactionCount,
    getUpdateCount: () => updateCount,
  }
}

const statObject = async () => ({
  size: 1024,
  metaData: { 'content-type': 'video/webm' },
})

const complete = (database, overrides = {}, dependencies = {}) =>
  completeVerification(
    {
      verificationId: 'verification-1',
      userId: 'candidate-1',
      objectKey,
      recordingMimeType: 'video/webm',
      answers: structuredClone(answers),
      ...overrides,
    },
    { database, statObject, now, ...dependencies },
  )

test('recording object keys are anonymous UUIDs and contain no original identity', () => {
  const key = createVerificationRecordingObjectKey()
  assert.match(
    key,
    /^verifications\/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.webm$/i,
  )
  for (const identity of ['candidate-1', 'candidate@example.com', 'Nguyen Van A', 'camera.webm']) {
    assert.equal(key.includes(identity), false)
  }
})

test('upload URL issuance is owned, stateful, and idempotent', async () => {
  const { database, state, getUpdateCount } = createDatabase({ status: 'ANSWERING' })
  const presign = async (key) => `https://minio.test/${key}`
  const first = await createVerificationRecordingUpload('verification-1', 'candidate-1', {
    database,
    presign,
    now,
  })
  const repeated = await createVerificationRecordingUpload('verification-1', 'candidate-1', {
    database,
    presign,
    now,
  })

  assert.equal(getUpdateCount(), 1)
  assert.equal(state.status, 'PENDING_UPLOAD')
  assert.equal(repeated.objectKey, first.objectKey)
  assert.equal(first.expiresIn, 300)
  assert.equal(first.uploadUrl, `https://minio.test/${first.objectKey}`)
})

test('foreign Candidate cannot obtain a URL or complete a recording', async () => {
  const foreignUpload = createDatabase({ ownerId: 'candidate-2', status: 'ANSWERING' })
  await assert.rejects(
    createVerificationRecordingUpload('verification-1', 'candidate-1', {
      database: foreignUpload.database,
      presign: async () => 'url',
      now,
    }),
    (error) => error?.errorCode === 'VERIFICATION_FORBIDDEN',
  )

  const foreignComplete = createDatabase({ ownerId: 'candidate-2' })
  await assert.rejects(
    complete(foreignComplete.database),
    (error) => error?.errorCode === 'VERIFICATION_FORBIDDEN',
  )
  assert.equal(foreignComplete.getUpdateCount(), 0)
})

test('complete request schema rejects unknown fields and unsupported MIME types', () => {
  const payload = {
    object_key: objectKey,
    recording_mime_type: 'video/webm',
    answers: answers.map(({ questionId, answer }) => ({ question_id: questionId, answer })),
  }
  assert.equal(completeVerificationSchema.safeParse(payload).success, true)
  assert.equal(
    completeVerificationSchema.safeParse({ ...payload, recording_mime_type: 'video/mp4' }).success,
    false,
  )
  assert.equal(
    completeVerificationSchema.safeParse({ ...payload, user_id: 'candidate-1' }).success,
    false,
  )
})

test('fake object key and missing object are blocked without database writes', async () => {
  const fakeKey = createDatabase()
  await assert.rejects(
    complete(fakeKey.database, {
      objectKey: 'verifications/44444444-4444-4444-8444-444444444444.webm',
    }),
    (error) => error?.errorCode === 'VERIFICATION_RECORDING_INVALID',
  )
  assert.equal(fakeKey.getUpdateCount(), 0)

  const missing = createDatabase()
  await assert.rejects(
    complete(
      missing.database,
      {},
      { statObject: async () => Promise.reject({ code: 'NoSuchKey' }) },
    ),
    (error) => error?.errorCode === 'VERIFICATION_RECORDING_NOT_FOUND',
  )
  assert.equal(missing.getUpdateCount(), 0)
})

test('answers must cover saved questions exactly once and meet their minimum length', async () => {
  const cases = [
    answers.slice(0, 1),
    [answers[0], { ...answers[1], questionId: questionIds[0] }],
    [answers[0], { ...answers[1], questionId: '44444444-4444-4444-8444-444444444444' }],
    [answers[0], { ...answers[1], answer: 'too short' }],
  ]
  for (const invalidAnswers of cases) {
    const session = createDatabase()
    await assert.rejects(
      complete(session.database, { answers: invalidAnswers }),
      (error) => error?.errorCode === 'VERIFICATION_ANSWER_INVALID',
    )
    assert.equal(session.getUpdateCount(), 0)
  }
})

test('invalid size or stored MIME type cannot enter pending scan', async () => {
  for (const object of [
    { size: 0, metaData: { 'content-type': 'video/webm' } },
    { size: 1024, metaData: { 'content-type': 'video/mp4' } },
    { size: 11 * 1024 * 1024, metaData: { 'content-type': 'video/webm' } },
  ]) {
    const session = createDatabase()
    await assert.rejects(
      complete(session.database, {}, { statObject: async () => object }),
      (error) => error?.errorCode === 'VERIFICATION_RECORDING_INVALID',
    )
    assert.equal(session.getUpdateCount(), 0)
  }
})

test('answers and recording metadata enter PENDING_SCAN in one transaction', async () => {
  const session = createDatabase()
  const queued = []
  const result = await complete(session.database, {}, { queueScan: (id) => queued.push(id) })

  assert.deepEqual(result, { verificationId: 'verification-1', status: 'PENDING_SCAN' })
  assert.equal(session.getTransactionCount(), 1)
  assert.equal(session.state.status, 'PENDING_SCAN')
  assert.deepEqual(session.state.answers, answers)
  assert.equal(session.state.recordingMimeType, 'video/webm')
  assert.equal(session.state.recordingSize, 1024)
  assert.equal(session.state.answeringCompletedAt.toISOString(), now.toISOString())
  assert.deepEqual(queued, ['verification-1'])
})

test('transaction failure leaves no partial completion state and queues no scan', async () => {
  const session = createDatabase()
  const queued = []
  session.database.$transaction = async (work) => {
    const before = structuredClone(session.state)
    try {
      await work(session.database)
      throw new Error('commit failed')
    } catch (error) {
      Object.assign(session.state, before)
      throw error
    }
  }

  await assert.rejects(
    complete(session.database, {}, { queueScan: (id) => queued.push(id) }),
    /commit failed/,
  )
  assert.equal(session.state.status, 'PENDING_UPLOAD')
  assert.equal(session.state.answers, null)
  assert.equal(session.state.recordingMimeType, null)
  assert.equal(session.state.recordingSize, null)
  assert.deepEqual(queued, [])
})

test('concurrent complete requests allow exactly one state transition', async () => {
  const session = createDatabase()
  const results = await Promise.allSettled([complete(session.database), complete(session.database)])

  assert.equal(results.filter(({ status }) => status === 'fulfilled').length, 1)
  assert.equal(results.filter(({ status }) => status === 'rejected').length, 1)
  assert.equal(session.getUpdateCount(), 1)
  assert.equal(session.state.status, 'PENDING_SCAN')
})
