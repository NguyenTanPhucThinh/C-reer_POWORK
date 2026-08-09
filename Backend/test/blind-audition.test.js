import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import {
  createSubmissionObjectKey,
  isSubmissionObjectKey,
} from '../src/assessment/services/upload.service.js'
import {
  findOrCreateIdentityMapping,
  findSubmissionsByChallengeGroupedByHash,
} from '../src/assessment/repositories/submission.repository.js'
import { generateHashId } from '../src/shared/utils/hashId.js'

const challengeId = '403bf47b-231a-4d22-9214-722a4669812a'
const otherChallengeId = '513bf47b-231a-4d22-9214-722a4669812b'
const userId = 'de305d54-75b4-431b-adb2-eb6b9e546014'

test('upload object key contains neither user ID nor original filename', () => {
  const objectKey = createSubmissionObjectKey(challengeId, 'Nguyen-Van-A_CV.pdf')

  assert.equal(objectKey.includes(userId), false)
  assert.equal(objectKey.includes('Nguyen-Van-A'), false)
  assert.match(objectKey, new RegExp(`^submissions/${challengeId}/[0-9a-f-]+\\.pdf$`, 'i'))
  assert.equal(isSubmissionObjectKey(objectKey, challengeId), true)
  assert.equal(isSubmissionObjectKey(objectKey, otherChallengeId), false)
  assert.equal(
    isSubmissionObjectKey(`submissions/${challengeId}/${userId}/Nguyen-Van-A_CV.pdf`, challengeId),
    false,
  )
})

test('anonymous ID is stable per Candidate and Challenge with 128-bit space', () => {
  const first = generateHashId(userId, challengeId)
  const repeated = generateHashId(userId, challengeId)

  assert.equal(first, repeated)
  assert.notEqual(first, generateHashId(userId, otherChallengeId))
  assert.match(first, /^Candidate_[0-9A-F]{32}$/)
})

test('identity upsert and Employer projection enforce the blind boundary', async () => {
  let storedMapping
  const database = {
    identityMapping: {
      upsert: async ({ where, create }) => {
        assert.deepEqual(where, { userId_challengeId: { userId, challengeId } })
        storedMapping ??= create
        return storedMapping
      },
      findMany: async ({ select }) => {
        assert.equal(select.userId, undefined)
        assert.equal(select.hashId, true)
        return [
          {
            hashId: generateHashId(userId, challengeId),
            isUnlocked: false,
            submissions: [{ id: 'submission-1' }],
          },
        ]
      },
    },
  }

  const input = { hashId: generateHashId(userId, challengeId), userId, challengeId }
  assert.equal(
    (await findOrCreateIdentityMapping(input, database)).hashId,
    (await findOrCreateIdentityMapping(input, database)).hashId,
  )

  const groups = await findSubmissionsByChallengeGroupedByHash(challengeId, database)
  assert.equal('userId' in groups[0], false)

  const schema = await readFile(new URL('../prisma/schema.prisma', import.meta.url), 'utf8')
  assert.match(schema, /@@unique\(\[userId, challengeId\]\)/)
})
