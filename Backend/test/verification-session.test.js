import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import {
  startVerificationSchema,
  verificationEventSchema,
} from '../src/assessment/models/submission.schema.js'
import {
  recordVerificationEvent,
  resumeCandidateVerification,
  startCandidateVerification,
} from '../src/assessment/services/verification.service.js'

const now = new Date('2026-08-09T10:00:00.000Z')

const createDatabase = ({ ownerId = 'candidate-1', submissionExists = true } = {}) => {
  let verification = null
  let createCount = 0
  const submission = submissionExists
    ? {
        id: 'submission-1',
        fileStatus: 'PENDING_SCAN',
        identityMapping: { userId: ownerId },
      }
    : null

  const database = {
    submission: {
      findUnique: async () =>
        submission ? { ...submission, verification: verification && { ...verification } } : null,
    },
    submissionVerification: {
      create: async ({ data }) => {
        if (verification) throw Object.assign(new Error('unique'), { code: 'P2002' })
        createCount += 1
        verification = {
          id: 'verification-1',
          status: 'PENDING_CAMERA',
          actualOralDurationSeconds: null,
          completedAt: null,
          ...data,
        }
        return { ...verification }
      },
      findUnique: async ({ where }) => {
        if (!verification) return null
        if (where.submissionId && where.submissionId !== verification.submissionId) return null
        if (where.id && where.id !== verification.id) return null
        return {
          ...verification,
          submission: submission && { ...submission },
        }
      },
    },
  }

  return {
    database,
    getCreateCount: () => createCount,
    setVerificationStatus: (status) => {
      verification.status = status
    },
  }
}

const start = (database, overrides = {}) =>
  startCandidateVerification(
    {
      submissionId: 'submission-1',
      userId: 'candidate-1',
      oralDurationSeconds: 60,
      ...overrides,
    },
    database,
    now,
  )

test('Candidate creates and resumes one session without identity or recording data', async () => {
  const { database, getCreateCount } = createDatabase()
  const created = await start(database)
  const resumed = await resumeCandidateVerification(
    created.verificationId,
    'candidate-1',
    database,
    now,
  )

  assert.equal(getCreateCount(), 1)
  assert.deepEqual(resumed, created)
  assert.match(created.verificationCode, /^[A-HJ-NP-Z2-9]{4}-\d{2}$/)
  assert.equal(created.expiresAt.toISOString(), '2026-08-09T10:15:00.000Z')
  assert.equal('userId' in created, false)
  assert.equal('recordingObjectKey' in created, false)
  assert.equal('questions' in created, false)
  assert.equal('answers' in created, false)
})

test('foreign Candidate cannot create or resume a session', async () => {
  const foreign = createDatabase({ ownerId: 'candidate-2' })

  await assert.rejects(
    start(foreign.database),
    (error) => error?.errorCode === 'VERIFICATION_FORBIDDEN',
  )
  assert.equal(foreign.getCreateCount(), 0)

  const owned = createDatabase()
  const session = await start(owned.database)

  await assert.rejects(
    resumeCandidateVerification(session.verificationId, 'candidate-2', owned.database, now),
    (error) => error?.errorCode === 'VERIFICATION_FORBIDDEN',
  )
})

test('the API boundary accepts only the four documented durations and no user_id', () => {
  for (const duration of [15, 30, 60, 120]) {
    assert.equal(
      startVerificationSchema.safeParse({ oral_duration_seconds: duration }).success,
      true,
    )
  }
  for (const duration of [0, 45, 121, '60']) {
    assert.equal(
      startVerificationSchema.safeParse({ oral_duration_seconds: duration }).success,
      false,
    )
  }
  assert.equal(
    startVerificationSchema.safeParse({ oral_duration_seconds: 60, user_id: 'candidate-2' })
      .success,
    false,
  )
})

test('repeated and concurrent starts return the same session', async () => {
  const { database, getCreateCount } = createDatabase()
  const [first, second] = await Promise.all([start(database), start(database)])
  const repeated = await start(database)

  assert.equal(getCreateCount(), 1)
  assert.deepEqual(second, first)
  assert.deepEqual(repeated, first)

  await assert.rejects(
    start(database, { oralDurationSeconds: 120 }),
    (error) => error?.errorCode === 'VERIFICATION_DURATION_LOCKED',
  )
})

test('missing Submission creates no verification side effect', async () => {
  const { database, getCreateCount } = createDatabase({ submissionExists: false })

  await assert.rejects(start(database), (error) => error?.errorCode === 'VERIFICATION_NOT_FOUND')
  assert.equal(getCreateCount(), 0)
})

test('a completed or unsubmitted Submission cannot start another session', async () => {
  const completed = createDatabase()
  await start(completed.database)
  completed.setVerificationStatus('READY')

  await assert.rejects(
    start(completed.database),
    (error) => error?.errorCode === 'VERIFICATION_ALREADY_COMPLETED',
  )

  const draft = createDatabase()
  draft.database.submission.findUnique = async () => ({
    id: 'submission-1',
    fileStatus: 'AWAITING_UPLOAD',
    identityMapping: { userId: 'candidate-1' },
    verification: null,
  })
  await assert.rejects(
    start(draft.database),
    (error) => error?.errorCode === 'VERIFICATION_INVALID_STATE',
  )
  assert.equal(draft.getCreateCount(), 0)
})

test('both session routes require Candidate authentication', async () => {
  const routes = await readFile(
    new URL('../src/assessment/routes/submission.routes.js', import.meta.url),
    'utf8',
  )
  const startRoute = routes.slice(
    routes.indexOf("'/submissions/:submission_id/verification/start'"),
    routes.indexOf("'/verifications/:verification_id'"),
  )
  const resumeRoute = routes.slice(
    routes.indexOf("'/verifications/:verification_id'"),
    routes.indexOf('// Employer xem danh sách'),
  )

  for (const route of [startRoute, resumeRoute]) {
    assert.match(route, /authenticate/)
    assert.match(route, /authorize\('CANDIDATE'\)/)
  }
})

const createEventDatabase = ({
  ownerId = 'candidate-1',
  status = 'PENDING_CAMERA',
  expiresAt = new Date('2026-08-09T10:15:00.000Z'),
  selectedOralDurationSeconds = 60,
} = {}) => {
  let updateCount = 0
  const state = {
    id: 'verification-1',
    status,
    expiresAt,
    selectedOralDurationSeconds,
    oralStartedAt: null,
    oralCompletedAt: null,
    answeringStartedAt: status === 'ANSWERING' ? now : null,
    cameraInterruptedAt: null,
    cameraInterruptionCount: 0,
    cameraInterruptionDurationSeconds: 0,
    focusLossCount: 0,
    pasteBlockedCount: 0,
    selectAllBlockedCount: 0,
    copyBlockedCount: 0,
    dropBlockedCount: 0,
    submission: { identityMapping: { userId: ownerId } },
  }

  const matches = (where) => {
    if (where.id !== state.id) return false
    if (typeof where.status === 'string' && where.status !== state.status) return false
    if (where.status?.in && !where.status.in.includes(state.status)) return false
    for (const field of [
      'oralStartedAt',
      'oralCompletedAt',
      'answeringStartedAt',
      'cameraInterruptedAt',
    ]) {
      if (!(field in where)) continue
      const expected = where[field]
      const actual = state[field]
      if (expected === null ? actual !== null : actual?.getTime() !== expected.getTime())
        return false
    }
    return true
  }

  const database = {
    submissionVerification: {
      findUnique: async ({ where }) => (where.id === state.id ? structuredClone(state) : null),
      updateMany: async ({ where, data }) => {
        if (!matches(where)) return { count: 0 }
        updateCount += 1
        for (const [field, value] of Object.entries(data)) {
          state[field] = value?.increment === undefined ? value : state[field] + value.increment
        }
        return { count: 1 }
      },
    },
  }

  return { database, state, getUpdateCount: () => updateCount }
}

const event = (database, name, at = now, userId = 'candidate-1') =>
  recordVerificationEvent('verification-1', userId, name, database, at)

test('the event API accepts only documented names and no clipboard payload', () => {
  const events = [
    'CAMERA_INTERRUPTED',
    'CAMERA_RESTORED',
    'FOCUS_LOST',
    'PASTE_BLOCKED',
    'SELECT_ALL_BLOCKED',
    'COPY_BLOCKED',
    'DROP_BLOCKED',
    'ORAL_STARTED',
    'ORAL_COMPLETED',
    'ANSWERING_STARTED',
  ]
  for (const name of events) {
    assert.equal(verificationEventSchema.safeParse({ event: name }).success, true)
  }
  assert.equal(verificationEventSchema.safeParse({ event: 'KEYSTROKE' }).success, false)
  assert.equal(
    verificationEventSchema.safeParse({ event: 'PASTE_BLOCKED', clipboard: 'secret' }).success,
    false,
  )
})

test('foreign, expired, and completed sessions reject events without writes', async () => {
  const scenarios = [
    [{ ownerId: 'candidate-2' }, 'VERIFICATION_FORBIDDEN'],
    [{ expiresAt: new Date('2026-08-09T09:59:59.000Z') }, 'VERIFICATION_EXPIRED'],
    [{ status: 'READY' }, 'VERIFICATION_ALREADY_COMPLETED'],
  ]
  for (const [options, errorCode] of scenarios) {
    const session = createEventDatabase(options)
    await assert.rejects(
      event(session.database, 'FOCUS_LOST'),
      (error) => error?.errorCode === errorCode,
    )
    assert.equal(session.getUpdateCount(), 0)
  }
})

test('integrity counters increment atomically in the answering phase', async () => {
  const { database, state } = createEventDatabase({ status: 'ANSWERING' })
  for (const name of [
    'FOCUS_LOST',
    'PASTE_BLOCKED',
    'SELECT_ALL_BLOCKED',
    'COPY_BLOCKED',
    'DROP_BLOCKED',
  ]) {
    await event(database, name)
  }

  assert.equal(state.focusLossCount, 1)
  assert.equal(state.pasteBlockedCount, 1)
  assert.equal(state.selectAllBlockedCount, 1)
  assert.equal(state.copyBlockedCount, 1)
  assert.equal(state.dropBlockedCount, 1)
})

test('oral duration uses server time and never exceeds the selected limit', async () => {
  const { database, state } = createEventDatabase({ selectedOralDurationSeconds: 15 })
  await event(database, 'ORAL_STARTED')
  await event(database, 'ORAL_COMPLETED', new Date(now.getTime() + 45_000))

  assert.equal(state.status, 'CAMERA_ACTIVE')
  assert.equal(state.oralStartedAt.toISOString(), now.toISOString())
  assert.equal(state.oralCompletedAt.toISOString(), '2026-08-09T10:00:45.000Z')
  assert.equal(state.actualOralDurationSeconds, 15)
})

test('Camera interruption events are idempotent and use server duration', async () => {
  const { database, state } = createEventDatabase({ status: 'CAMERA_ACTIVE' })
  const interruptedAt = new Date(now.getTime() + 3_000)
  const restoredAt = new Date(now.getTime() + 8_000)

  await event(database, 'CAMERA_INTERRUPTED', interruptedAt)
  await event(database, 'CAMERA_INTERRUPTED', interruptedAt)
  await event(database, 'CAMERA_RESTORED', restoredAt)
  await event(database, 'CAMERA_RESTORED', restoredAt)

  assert.equal(state.cameraInterruptionCount, 1)
  assert.equal(state.cameraInterruptionDurationSeconds, 5)
  assert.equal(state.cameraInterruptedAt, null)
})
