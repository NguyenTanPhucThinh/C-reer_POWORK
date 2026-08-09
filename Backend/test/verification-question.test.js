import assert from 'node:assert/strict'
import test from 'node:test'

import { AppError } from '../src/shared/utils/AppError.js'
import {
  generateEssayQuestions,
  getOrCreateVerificationQuestions,
} from '../src/assessment/services/verification-question.service.js'

const now = new Date('2026-08-09T10:00:00.000Z')
const challenge = {
  title: 'Thiết kế cache tổng quan',
  description: 'Đề xuất thiết kế cache cho một API giả định.',
  industry: 'Backend Engineering',
  rubricCriteria: [{ criteriaName: 'Tính hợp lý', weight: 100, maxScore: 10 }],
}
const validQuestions = [
  { question: 'Vì sao bạn lựa chọn chiến lược cache này thay vì một phương án khác?' },
  { question: 'Giới hạn quan trọng nhất trong cách tiếp cận của bạn là gì?' },
  { question: 'Bạn sẽ thay đổi thiết kế thế nào nếu lượng truy cập tăng gấp mười lần?' },
]

const geminiResponse = (content) => ({
  ok: true,
  json: async () => ({
    candidates: [{ content: { parts: [{ text: content }] } }],
  }),
})

const callGemini = (content, overrides = {}) =>
  generateEssayQuestions(challenge, {
    apiKey: 'test-key',
    model: 'test-model',
    fetchImpl: async () => geminiResponse(content),
    ...overrides,
  })

const createDatabase = ({
  ownerId = 'candidate-1',
  status = 'CAMERA_ACTIVE',
  expiresAt = new Date('2026-08-09T10:15:00.000Z'),
  questions = null,
  oralCompletedAt = now,
} = {}) => {
  const state = {
    id: 'verification-1',
    status,
    expiresAt,
    questions,
    oralCompletedAt,
    cameraInterruptedAt: null,
    answeringStartedAt: null,
    submission: {
      challengeId: 'challenge-1',
      identityMapping: { userId: ownerId },
    },
  }

  const database = {
    submissionVerification: {
      findUnique: async ({ where }) => (where.id === state.id ? structuredClone(state) : null),
      updateMany: async ({ where, data }) => {
        if (where.id !== state.id || (where.status && where.status !== state.status)) {
          return { count: 0 }
        }
        Object.assign(state, structuredClone(data))
        return { count: 1 }
      },
    },
    challenge: {
      findUnique: async ({ where }) => (where.id === 'challenge-1' ? challenge : null),
    },
  }

  return { database, state }
}

test('Gemini accepts one or three valid essay questions with the API key only in headers', async () => {
  let request
  for (const questions of [validQuestions.slice(0, 1), validQuestions]) {
    const result = await generateEssayQuestions(challenge, {
      apiKey: 'secret-key',
      model: 'test-model',
      fetchImpl: async (url, options) => {
        request = { url, options }
        return geminiResponse(JSON.stringify({ questions }))
      },
    })
    assert.deepEqual(result, questions)
  }

  assert.doesNotMatch(request.url, /secret-key/)
  assert.equal(request.options.headers['x-goog-api-key'], 'secret-key')
  const body = JSON.parse(request.options.body)
  assert.equal(body.generationConfig.responseMimeType, 'application/json')
  assert.deepEqual(JSON.parse(body.contents[0].parts[0].text), challenge)
})

test('empty, malformed, oversized, and duplicate Gemini outputs are rejected separately', async () => {
  const invalidOutputs = [
    JSON.stringify({ questions: [] }),
    '{not-json',
    JSON.stringify({
      questions: [...validQuestions, { question: 'Câu hỏi thứ tư không hợp lệ vì vượt giới hạn.' }],
    }),
    JSON.stringify({ questions: [validQuestions[0], validQuestions[0]] }),
  ]

  for (const output of invalidOutputs) {
    await assert.rejects(
      callGemini(output),
      (error) =>
        error?.statusCode === 502 && error?.errorCode === 'VERIFICATION_QUESTION_INVALID_RESPONSE',
    )
  }
})

test('Gemini timeout fails as unavailable', async () => {
  await assert.rejects(
    callGemini('', {
      fetchImpl: async () => {
        throw new Error('timeout')
      },
    }),
    (error) =>
      error?.statusCode === 503 && error?.errorCode === 'VERIFICATION_QUESTION_UNAVAILABLE',
  )
})

test('questions are saved once and repeated calls return the immutable set', async () => {
  const { database, state } = createDatabase()
  let generationCalls = 0
  const generate = async () => {
    generationCalls += 1
    return validQuestions.slice(0, 1)
  }

  const first = await getOrCreateVerificationQuestions('verification-1', 'candidate-1', {
    database,
    generate,
    now,
  })
  const repeated = await getOrCreateVerificationQuestions('verification-1', 'candidate-1', {
    database,
    generate,
    now,
  })

  assert.equal(generationCalls, 1)
  assert.equal(state.status, 'ANSWERING')
  assert.equal(state.answeringStartedAt.toISOString(), now.toISOString())
  assert.deepEqual(repeated, first)
  assert.match(first.questions[0].questionId, /^[0-9a-f-]{36}$/i)
  assert.equal(first.questions[0].minimumLength, 80)
  assert.equal(first.questions[0].maximumLength, 4000)
})

test('concurrent requests allow only one Gemini call', async () => {
  const { database } = createDatabase()
  let generationCalls = 0
  let release
  const gate = new Promise((resolve) => {
    release = resolve
  })
  const generate = async () => {
    generationCalls += 1
    await gate
    return validQuestions.slice(0, 1)
  }

  const first = getOrCreateVerificationQuestions('verification-1', 'candidate-1', {
    database,
    generate,
    now,
  })
  await new Promise((resolve) => setImmediate(resolve))
  await assert.rejects(
    getOrCreateVerificationQuestions('verification-1', 'candidate-1', {
      database,
      generate,
      now,
    }),
    (error) => error?.errorCode === 'VERIFICATION_INVALID_STATE',
  )
  release()
  await first

  assert.equal(generationCalls, 1)
})

test('Gemini failure releases the claim without partial question data', async () => {
  const { database, state } = createDatabase()

  await assert.rejects(
    getOrCreateVerificationQuestions('verification-1', 'candidate-1', {
      database,
      generate: async () => {
        throw new AppError('unavailable', 503, 'VERIFICATION_QUESTION_UNAVAILABLE')
      },
      now,
    }),
    (error) => error?.errorCode === 'VERIFICATION_QUESTION_UNAVAILABLE',
  )

  assert.equal(state.status, 'CAMERA_ACTIVE')
  assert.equal(state.questions, null)
  assert.equal(state.answeringStartedAt, null)
})

test('foreign, expired, and completed sessions never call Gemini', async () => {
  const scenarios = [
    [{ ownerId: 'candidate-2' }, 'VERIFICATION_FORBIDDEN'],
    [{ expiresAt: new Date('2026-08-09T09:59:59.000Z') }, 'VERIFICATION_EXPIRED'],
    [{ status: 'READY' }, 'VERIFICATION_ALREADY_COMPLETED'],
    [{ oralCompletedAt: null }, 'VERIFICATION_INVALID_STATE'],
  ]

  for (const [options, errorCode] of scenarios) {
    const { database } = createDatabase(options)
    let generationCalls = 0
    await assert.rejects(
      getOrCreateVerificationQuestions('verification-1', 'candidate-1', {
        database,
        generate: async () => {
          generationCalls += 1
          return validQuestions
        },
        now,
      }),
      (error) => error?.errorCode === errorCode,
    )
    assert.equal(generationCalls, 0)
  }
})
