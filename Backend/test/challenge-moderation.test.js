import assert from 'node:assert/strict'
import test from 'node:test'

import { createChallenge } from '../src/challenge/services/challenge.service.js'
import { moderateChallenge } from '../src/challenge/services/moderation.service.js'
import { errorHandler } from '../src/shared/middlewares/error.middleware.js'

const approved = {
  decision: 'APPROVED',
  summary: 'Challenge có phạm vi phù hợp để đánh giá năng lực.',
  issues: [],
}

const needsRevision = {
  decision: 'NEEDS_REVISION',
  summary: 'Challenge yêu cầu một sản phẩm hoàn chỉnh.',
  issues: [
    {
      category: 'COMPLETE_DELIVERABLE',
      message: 'Đề bài yêu cầu xây dựng toàn bộ sản phẩm.',
      suggestion: 'Chỉ yêu cầu thiết kế tổng quan một module nhỏ.',
    },
  ],
}

const validChallenge = {
  companyId: 'company-1',
  companyName: 'POWORK',
  title: 'Thiết kế cache tổng quan',
  description: 'Dùng dữ liệu mẫu để đề xuất thiết kế cache cho một API giả định.',
  industry: 'Backend Engineering',
  deadline: new Date(Date.now() + 86_400_000).toISOString(),
  rubrics: [{ criteriaName: 'Tính hợp lý', weight: 100, maxScore: 10 }],
}

const geminiResponse = (result) => ({
  ok: true,
  json: async () => ({
    candidates: [{ content: { parts: [{ text: JSON.stringify(result) }] } }],
  }),
})

test('Gemini request keeps the API key out of the URL and accepts a valid decision', async () => {
  let request
  const result = await moderateChallenge(validChallenge, {
    apiKey: 'secret-key',
    model: 'test-model',
    fetchImpl: async (url, options) => {
      request = { url, options }
      return geminiResponse(approved)
    },
  })

  assert.deepEqual(result, approved)
  assert.doesNotMatch(request.url, /secret-key/)
  assert.equal(request.options.headers['x-goog-api-key'], 'secret-key')
  assert.equal(
    JSON.parse(request.options.body).generationConfig.responseMimeType,
    'application/json',
  )
})

test('invalid, empty, or failed Gemini responses fail closed', async () => {
  const responses = [
    async () => ({ ok: false, status: 429 }),
    async () =>
      geminiResponse({ decision: 'APPROVED', summary: 'Sai', issues: needsRevision.issues }),
    async () => ({ ok: true, json: async () => ({ candidates: [] }) }),
  ]

  for (const fetchImpl of responses) {
    await assert.rejects(
      moderateChallenge(validChallenge, { apiKey: 'key', fetchImpl }),
      (error) => error?.statusCode === 503 && error?.errorCode === 'CHAL_MODERATION_UNAVAILABLE',
    )
  }
})

test('an approved Challenge is persisted only after moderation', async () => {
  const calls = []
  const repository = {
    createChallengeWithRubrics: async (input) => {
      calls.push(['write', input])
      return {
        id: 'challenge-1',
        ...input,
        deadline: new Date(input.deadline),
        status: 'OPEN',
        rubricCriteria: [
          { id: 'criteria-1', criteriaName: 'Tính hợp lý', weight: 100, maxScore: 10 },
        ],
        createdAt: new Date('2026-08-09T10:00:00.000Z'),
        updatedAt: new Date('2026-08-09T10:00:00.000Z'),
      }
    },
  }

  const result = await createChallenge(validChallenge, {
    moderate: async (input) => {
      calls.push(['moderate', input])
      return approved
    },
    repository,
  })

  assert.deepEqual(
    calls.map(([name]) => name),
    ['moderate', 'write'],
  )
  assert.equal(result.challengeId, 'challenge-1')
})

test('a Challenge needing revision returns actionable details and creates no data', async () => {
  let writes = 0
  let moderationError

  await assert.rejects(
    createChallenge(validChallenge, {
      moderate: async () => needsRevision,
      repository: { createChallengeWithRubrics: async () => writes++ },
    }),
    (error) => {
      moderationError = error
      assert.equal(error.statusCode, 422)
      assert.equal(error.errorCode, 'CHAL_MODERATION_REQUIRED')
      assert.deepEqual(error.details, needsRevision)
      return true
    },
  )
  assert.equal(writes, 0)

  let responseBody
  errorHandler(
    moderationError,
    {},
    {
      status: (statusCode) => {
        assert.equal(statusCode, 422)
        return { json: (body) => (responseBody = body) }
      },
    },
  )
  assert.equal(responseBody.error_code, 'CHAL_MODERATION_REQUIRED')
  assert.deepEqual(responseBody.details, needsRevision)
})

test('validation and moderation failures create no Challenge or rubric', async () => {
  let moderationCalls = 0
  let writes = 0
  const dependencies = {
    moderate: async () => {
      moderationCalls++
      throw Object.assign(new Error('unavailable'), {
        statusCode: 503,
        errorCode: 'CHAL_MODERATION_UNAVAILABLE',
      })
    },
    repository: { createChallengeWithRubrics: async () => writes++ },
  }

  await assert.rejects(createChallenge(validChallenge, dependencies), /unavailable/)
  assert.equal(writes, 0)

  await assert.rejects(
    createChallenge({ ...validChallenge, deadline: '2020-01-01T00:00:00.000Z' }, dependencies),
    (error) => error?.statusCode === 400,
  )
  assert.equal(moderationCalls, 1)
  assert.equal(writes, 0)
})
