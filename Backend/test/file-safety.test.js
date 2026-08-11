import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import { assertSubmissionReviewable } from '../src/assessment/services/ownership.service.js'
import { scanSubmission } from '../src/assessment/services/scan.service.js'
import { evaluateSubmission } from '../src/assessment/services/evaluation.service.js'
import { rejectSubmission, unlockCandidate } from '../src/assessment/services/submission.service.js'
import {
  createSubmission,
  findAwaitingUpload,
  markPendingScan,
} from '../src/assessment/repositories/submission.repository.js'

const submission = {
  id: 'submission-1',
  solutionUrl: 'submissions/challenge/file.pdf',
  fileStatus: 'PENDING_SCAN',
}

const runScan = async (scan) => {
  const writes = []
  const repository = {
    findSubmissionById: async () => submission,
    updateSubmissionScanResult: async (_id, data) => {
      writes.push(data)
      return { ...submission, ...data }
    },
  }

  await scanSubmission(submission.id, { repository, scan, notify: async () => {} })
  return writes
}

test('only an explicit clean ClamAV result marks a file SAFE', async () => {
  assert.deepEqual(await runScan(async () => ({ isInfected: false, viruses: [] })), [
    { fileStatus: 'SAFE' },
  ])
})

test('presign draft moves from AWAITING_UPLOAD to PENDING_SCAN only after confirmation', async () => {
  const calls = []
  const database = {
    submission: {
      create: async ({ data }) => {
        calls.push(data)
        return { id: 'draft-1', ...data }
      },
      findFirst: async ({ where }) => {
        calls.push(where)
        return { id: 'draft-1', fileStatus: 'AWAITING_UPLOAD' }
      },
      update: async ({ data }) => {
        calls.push(data)
        return { id: 'draft-1', ...data }
      },
    },
  }

  await createSubmission(
    { challengeId: 'challenge-1', hashId: 'Candidate_A', version: 1, solutionUrl: 'object-key' },
    database,
  )
  await findAwaitingUpload(
    { userId: 'candidate-1', challengeId: 'challenge-1', solutionUrl: 'object-key' },
    database,
  )
  await markPendingScan('draft-1', database)

  assert.equal(calls[0].fileStatus, 'AWAITING_UPLOAD')
  assert.equal(calls[1].identityMapping.userId, 'candidate-1')
  assert.equal(calls[2].fileStatus, 'PENDING_SCAN')
})

test('an infected file is rejected by both scan and review state', async () => {
  const writes = await runScan(async () => ({ isInfected: true, viruses: ['Eicar-Signature'] }))

  assert.equal(writes[0].fileStatus, 'REJECTED')
  assert.equal(writes[0].status, 'REJECTED')
  assert.match(writes[0].generalComment, /Eicar-Signature/)
})

test('ClamAV errors and indeterminate responses fail closed', async () => {
  const failed = await runScan(async () => {
    throw new Error('clamav unavailable')
  })
  const indeterminate = await runScan(async () => ({}))

  assert.deepEqual(failed, [{ fileStatus: 'SCAN_FAILED' }])
  assert.deepEqual(indeterminate, [{ fileStatus: 'SCAN_FAILED' }])
})

test('Candidate is notified only after the scan reaches a final accepted or rejected result', async () => {
  const notifications = []
  const repository = {
    findSubmissionById: async () => submission,
    updateSubmissionScanResult: async (_id, data) => ({ ...submission, ...data }),
  }
  const notify = async (...args) => notifications.push(args)

  await scanSubmission(submission.id, {
    repository,
    scan: async () => ({ isInfected: false, viruses: [] }),
    notify,
  })
  await scanSubmission(submission.id, {
    repository,
    scan: async () => ({ isInfected: true, viruses: ['Eicar-Signature'] }),
    notify,
  })

  assert.deepEqual(notifications[0], [submission.id, 'ACCEPTED', undefined])
  assert.equal(notifications[1][0], submission.id)
  assert.equal(notifications[1][1], 'REJECTED')
  assert.match(notifications[1][2], /Eicar-Signature/)
})

test('email failure cannot change a successfully scanned file into SCAN_FAILED', async () => {
  const writes = []
  const repository = {
    findSubmissionById: async () => submission,
    updateSubmissionScanResult: async (_id, data) => {
      writes.push(data)
      return { ...submission, ...data }
    },
  }

  const result = await scanSubmission(submission.id, {
    repository,
    scan: async () => ({ isInfected: false, viruses: [] }),
    notify: async () => {
      throw new Error('SMTP unavailable')
    },
  })

  assert.equal(result.fileStatus, 'SAFE')
  assert.deepEqual(writes, [{ fileStatus: 'SAFE' }])
})

test('Employer operations reject every file state except SAFE', async () => {
  for (const fileStatus of ['AWAITING_UPLOAD', 'PENDING_SCAN', 'REJECTED', 'SCAN_FAILED']) {
    assert.throws(
      () => assertSubmissionReviewable({ fileStatus }),
      (error) => error?.statusCode === 409 && error?.errorCode === 'ASSESS_009',
    )
  }
  assert.equal(assertSubmissionReviewable({ fileStatus: 'SAFE' }).fileStatus, 'SAFE')
})

test('unsafe submission IDs cannot create Employer-side effects', async () => {
  const writes = []
  const transaction = {
    submission: {
      findUnique: async () => ({
        id: 'submission-1',
        challengeId: 'challenge-1',
        fileStatus: 'PENDING_SCAN',
        identityMapping: { hashId: 'Candidate_A', userId: 'candidate-1', isUnlocked: false },
        evaluationResults: [],
      }),
      update: async () => writes.push('submission.update'),
    },
    challenge: {
      findUnique: async () => ({
        id: 'challenge-1',
        companyId: 'company-1',
        title: 'Challenge',
        companyName: 'Company',
        industry: 'IT',
      }),
    },
    rubricCriteria: { count: async () => writes.push('rubricCriteria.count') },
    evaluationResult: { createMany: async () => writes.push('evaluationResult.createMany') },
    identityMapping: { update: async () => writes.push('identityMapping.update') },
    verifiedEvidence: { create: async () => writes.push('verifiedEvidence.create') },
  }
  const database = { $transaction: async (work) => work(transaction) }
  const isUnsafe = (error) => error?.statusCode === 409 && error?.errorCode === 'ASSESS_009'

  await assert.rejects(
    evaluateSubmission(
      'submission-1',
      { evaluations: [{ criteriaId: 'criteria-1', score: 8 }] },
      'company-1',
      database,
    ),
    isUnsafe,
  )
  await assert.rejects(rejectSubmission('submission-1', 'company-1', database), isUnsafe)
  await assert.rejects(unlockCandidate('submission-1', 'company-1', database), isUnsafe)
  assert.deepEqual(writes, [])
})

test('Prisma stores all five file lifecycle states separately from review status', async () => {
  const schema = await readFile(new URL('../prisma/schema.prisma', import.meta.url), 'utf8')

  assert.match(schema, /fileStatus\s+FileScanStatus/)
  for (const state of ['AWAITING_UPLOAD', 'PENDING_SCAN', 'SAFE', 'REJECTED', 'SCAN_FAILED']) {
    assert.match(schema, new RegExp(`\\b${state}\\b`))
  }
})
