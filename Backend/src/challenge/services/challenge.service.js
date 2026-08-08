/**
 * CHALLENGE MODULE — Challenge Service
 *
 * Toàn bộ logic nghiệp vụ Task 4 nằm ở đây, đối chiếu trực tiếp với
 * Test_Cases_Challenge.md. Service không biết Express là gì.
 *
 * Bảng đối chiếu:
 *   TC_CHAL_001 — happy path                    → createChallenge() thành công
 *   TC_CHAL_002 — Candidate tạo Challenge        → xử lý ở route (authorize middleware)
 *   TC_CHAL_003 — thiếu/hỏng token               → xử lý ở route (authenticate middleware)
 *   TC_CHAL_004 — tổng weight < 100              → validateRubricWeight()
 *   TC_CHAL_005 — tổng weight > 100              → validateRubricWeight()
 *   TC_CHAL_006 — rubrics rỗng                   → Zod schema (createChallengeSchema)
 *   TC_CHAL_007 — thiếu title/deadline           → Zod schema (createChallengeSchema)
 *   TC_CHAL_008 — deadline ở quá khứ             → validateDeadline()
 *   TC_CHAL_009 — criteriaName trùng lặp         → validateNoDuplicateCriteria()
 *   TC_CHAL_010 — weight/maxScore <= 0           → Zod schema (z.number().positive())
 */
import { AppError } from '../../shared/utils/AppError.js'
import * as challengeRepository from '../repositories/challenge.repository.js'

// ─── TC_CHAL_004 / TC_CHAL_005: Tổng weight phải đúng = 100 ──────────────────
const validateRubricWeight = (rubrics) => {
  const totalWeight = rubrics.reduce((sum, r) => sum + r.weight, 0)
  if (totalWeight !== 100) {
    throw new AppError('Tổng trọng số (weight) của bộ tiêu chí phải bằng 100.', 400, 'CHAL_001')
  }
}

// ─── TC_CHAL_008: Deadline phải ở tương lai ───────────────────────────────────
const validateDeadline = (deadline) => {
  const deadlineDate = new Date(deadline)
  if (deadlineDate.getTime() <= Date.now()) {
    throw new AppError('Hạn chót không hợp lệ hoặc đã qua thời hạn.', 400, 'CHAL_002')
  }
}

// ─── TC_CHAL_009: criteriaName không được trùng lặp ──────────────────────────
const validateNoDuplicateCriteria = (rubrics) => {
  const names = rubrics.map((r) => r.criteriaName.trim().toLowerCase())
  const uniqueNames = new Set(names)
  if (uniqueNames.size !== names.length) {
    throw new AppError('Tên tiêu chí không được phép trùng lặp.', 400, 'CHAL_003')
  }
}

// ─── POST /api/v1/challenges ───────────────────────────────────────────────────
export const createChallenge = async ({
  companyId,
  companyName,
  title,
  description,
  industry,
  deadline,
  rubrics,
}) => {
  // Validate nghiệp vụ — chạy theo đúng thứ tự test case của TL
  validateDeadline(deadline) // TC_008
  validateNoDuplicateCriteria(rubrics) // TC_009
  validateRubricWeight(rubrics) // TC_004 / TC_005

  // Nested Write — Challenge + RubricCriteria trong 1 transaction
  const challenge = await challengeRepository.createChallengeWithRubrics({
    companyId,
    companyName,
    title,
    description,
    industry,
    deadline,
    rubrics,
  })

  // Trả dữ liệu nội bộ camelCase; controller chịu trách nhiệm contract HTTP.
  return {
    challengeId: challenge.id,
    title: challenge.title,
    description: challenge.description,
    industry: challenge.industry,
    companyName: challenge.companyName,
    deadline: challenge.deadline.toISOString(),
    status: challenge.status,
    rubrics: challenge.rubricCriteria.map((r) => ({
      criteriaId: r.id,
      criteriaName: r.criteriaName,
      weight: r.weight,
      maxScore: r.maxScore,
    })),
    createdAt: challenge.createdAt.toISOString(),
    updatedAt: challenge.updatedAt.toISOString(),
  }
}

// ─── GET /api/v1/challenges?industry=... ──────────────────────────────────────
export const getChallenges = async ({ industry }) => {
  const challenges = await challengeRepository.findManyChallenges({ industry })
  return challenges.map((c) => ({
    challengeId: c.id,
    title: c.title,
    companyName: c.companyName,
    industry: c.industry,
    deadline: c.deadline.toISOString(),
  }))
}

// ─── GET /api/v1/challenges/:challenge_id ─────────────────────────────────────
export const getChallengeById = async (challengeId) => {
  const challenge = await challengeRepository.findChallengeById(challengeId)
  if (!challenge) throw new AppError('Không tìm thấy challenge', 404, 'CHAL_004')

  return {
    challengeId: challenge.id,
    title: challenge.title,
    description: challenge.description,
    industry: challenge.industry,
    companyName: challenge.companyName,
    deadline: challenge.deadline.toISOString(),
    status: challenge.status,
    rubrics: challenge.rubricCriteria.map((r) => ({
      criteriaId: r.id,
      criteriaName: r.criteriaName,
      weight: r.weight,
      maxScore: r.maxScore,
    })),
    createdAt: challenge.createdAt.toISOString(),
    updatedAt: challenge.updatedAt.toISOString(),
  }
}

// ─── PATCH /api/v1/challenges/:challenge_id/status ────────────────────────────
export const updateChallengeStatus = async (challengeId, companyId, status) => {
  const challenge = await challengeRepository.updateChallengeStatusById(
    challengeId,
    companyId,
    status,
  )
  return {
    challengeId: challenge.id,
    status: challenge.status,
    updatedAt: challenge.updatedAt.toISOString(),
  }
}
