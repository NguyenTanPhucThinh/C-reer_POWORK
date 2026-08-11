import assert from 'node:assert/strict'
import test from 'node:test'

import { createChallenge } from '../src/challenge/services/challenge.service.js'
import { moderateChallenge } from '../src/challenge/services/moderation.service.js'
import { createChallengeSchema } from '../src/challenge/models/challenge.schema.js'
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

const moderationIssue = (category) => ({
  decision: 'NEEDS_REVISION',
  summary: 'Challenge cần thu hẹp phạm vi trước khi phát hành.',
  issues: [
    {
      category,
      message: 'Nội dung không phù hợp với phạm vi một bài đánh giá tuyển dụng.',
      suggestion: 'Chuyển sang tình huống giả định và chỉ yêu cầu một phần nhỏ.',
    },
  ],
})

const parsedModeration = (result) => (input) =>
  moderateChallenge(input, {
    apiKey: 'test-key',
    model: 'test-model',
    fetchImpl: async () => geminiResponse(result),
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

test('AI failures and malformed responses create no Challenge', async () => {
  const responses = [
    async () => ({ ok: false, status: 429 }),
    async () =>
      geminiResponse({ decision: 'APPROVED', summary: 'Sai', issues: needsRevision.issues }),
    async () => ({ ok: true, json: async () => ({ candidates: [] }) }),
  ]
  let writes = 0

  for (const fetchImpl of responses) {
    await assert.rejects(
      createChallenge(validChallenge, {
        moderate: (input) => moderateChallenge(input, { apiKey: 'key', fetchImpl }),
        repository: { createChallengeWithRubrics: async () => writes++ },
      }),
      (error) => error?.statusCode === 503 && error?.errorCode === 'CHAL_MODERATION_UNAVAILABLE',
    )
  }
  assert.equal(writes, 0)
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

test('the frozen contract blocks oversized, real-data, and complete-product Challenges', async (t) => {
  const scenarios = [
    ['oversized Challenge', 'SCOPE_TOO_LARGE'],
    ['real company data', 'REAL_COMPANY_DATA'],
    ['complete product', 'COMPLETE_DELIVERABLE'],
  ]

  for (const [name, category] of scenarios) {
    await t.test(name, async () => {
      let writes = 0

      await assert.rejects(
        createChallenge(validChallenge, {
          moderate: parsedModeration(moderationIssue(category)),
          repository: { createChallengeWithRubrics: async () => writes++ },
        }),
        (error) =>
          error?.statusCode === 422 &&
          error?.errorCode === 'CHAL_MODERATION_REQUIRED' &&
          error?.details?.issues?.[0]?.category === category,
      )
      assert.equal(writes, 0)
    })
  }
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

test('invalid HTTP requests are rejected at the API boundary before side effects', () => {
  const invalidRequests = [
    {},
    { title: '', description: 'Mô tả', industry: 'IT', deadline: validChallenge.deadline },
    {
      title: 'Challenge',
      description: 'Mô tả',
      industry: 'IT',
      deadline: 'not-a-date',
      rubrics: [],
    },
    {
      title: 'Challenge',
      description: 'Mô tả',
      industry: 'IT',
      deadline: validChallenge.deadline,
      rubrics: [{ criteria_name: 'Đúng', weight: 100, max_score: 0 }],
    },
  ]

  for (const request of invalidRequests) {
    assert.equal(createChallengeSchema.safeParse(request).success, false)
  }
})

test(
  'live Gemini classifies the frozen acceptance examples',
  { skip: process.env.GEMINI_LIVE_TEST !== '1', timeout: 120_000 },
  async (t) => {
    const examples = [
      {
        name: 'valid Challenge',
        expectedDecision: 'APPROVED',
        challenge: {
          title: 'Thiết kế cache tổng quan',
          description:
            'Trong tình huống giả định dùng dữ liệu mẫu, hãy trình bày thiết kế cache tổng quan cho một API. Không cần viết sản phẩm hoặc mã nguồn production.',
          industry: 'Backend Engineering',
          rubricCriteria: ['Tính hợp lý của thiết kế'],
        },
      },
      {
        name: 'oversized Challenge',
        expectedCategory: 'SCOPE_TOO_LARGE',
        challenge: {
          title: 'Xây dựng toàn bộ nền tảng trong sáu tháng',
          description:
            'Hãy thiết kế và triển khai frontend, backend, ứng dụng di động, hệ thống thanh toán, vận hành production và kế hoạch phát triển trong sáu tháng.',
          industry: 'Software Engineering',
          rubricCriteria: ['Mức độ hoàn thiện'],
        },
      },
      {
        name: 'real-data Challenge',
        expectedCategory: 'REAL_COMPANY_DATA',
        challenge: {
          title: 'Phân tích dữ liệu khách hàng hiện tại',
          description:
            'Hãy sử dụng dữ liệu khách hàng thật, doanh thu nội bộ và các báo cáo chưa công bố của công ty để đưa ra giải pháp.',
          industry: 'Data Analytics',
          rubricCriteria: ['Giá trị phân tích'],
        },
      },
      {
        name: 'complete-product Challenge',
        expectedCategory: 'COMPLETE_DELIVERABLE',
        challenge: {
          title: 'Bàn giao website thương mại điện tử hoàn chỉnh',
          description:
            'Hãy xây dựng và bàn giao website production-ready đầy đủ frontend, backend, thanh toán, triển khai và tài liệu vận hành để công ty sử dụng ngay.',
          industry: 'Software Engineering',
          rubricCriteria: ['Mức độ hoàn thiện'],
        },
      },
    ]

    for (const example of examples) {
      await t.test(example.name, async () => {
        const result = await moderateChallenge(example.challenge)

        if (example.expectedDecision) {
          assert.equal(result.decision, example.expectedDecision)
          return
        }

        assert.equal(result.decision, 'NEEDS_REVISION')
        assert.ok(result.issues.some((issue) => issue.category === example.expectedCategory))
      })
    }
  },
)
