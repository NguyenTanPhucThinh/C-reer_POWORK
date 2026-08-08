/**
 * CHALLENGE MODULE — Challenge Controller
 * Prefix: /api/v1/challenges
 *
 * Controller chỉ đọc req, gọi service, trả response.
 * Logic nghiệp vụ (validate weight=100, deadline, trùng tên...) nằm ở
 * challenge.service.js — đối chiếu Test_Cases_Challenge.md
 */
import { sendSuccess, sendCreated } from '../../shared/utils/response.js'
import * as challengeService from '../services/challenge.service.js'
import * as companyService from '../../iam/services/company.service.js' // Internal Service Interface

// GET /api/v1/challenges?industry=...
export const getChallenges = async (req, res) => {
  const { industry } = req.query
  const challenges = await challengeService.getChallenges({ industry })
  return sendSuccess(
    res,
    challenges.map((challenge) => ({
      challenge_id: challenge.challengeId,
      title: challenge.title,
      company_name: challenge.companyName,
      industry: challenge.industry,
      deadline: challenge.deadline,
    })),
  )
}

// GET /api/v1/challenges/:challenge_id
export const getChallengeById = async (req, res) => {
  const { challenge_id: challengeId } = req.params
  const challenge = await challengeService.getChallengeById(challengeId)
  return sendSuccess(res, {
    challenge_id: challenge.challengeId,
    title: challenge.title,
    description: challenge.description,
    industry: challenge.industry,
    company_name: challenge.companyName,
    deadline: challenge.deadline,
    status: `${challenge.status[0]}${challenge.status.slice(1).toLowerCase()}`,
    rubrics: challenge.rubrics.map((rubric) => ({
      criteria_id: rubric.criteriaId,
      criteria_name: rubric.criteriaName,
      weight: rubric.weight,
      max_score: rubric.maxScore,
    })),
    created_at: challenge.createdAt,
    updated_at: challenge.updatedAt,
  })
}

// POST /api/v1/challenges
export const createChallenge = async (req, res) => {
  // companyId/companyName lấy qua IAM Internal Service Interface — KHÔNG tự
  // query bảng companies trực tiếp (đúng ranh giới module trong Coding Convention)
  const { company_id: companyId, company_name: companyName } =
    await companyService.getCompanyByUserId(req.user.userId)

  const challenge = await challengeService.createChallenge({
    companyId,
    companyName,
    title: req.body.title,
    description: req.body.description,
    industry: req.body.industry,
    deadline: req.body.deadline,
    rubrics: req.body.rubrics.map((rubric) => ({
      criteriaName: rubric.criteria_name,
      weight: rubric.weight,
      maxScore: rubric.max_score,
    })),
  })

  return sendCreated(res, {
    challenge_id: challenge.challengeId,
    title: challenge.title,
    description: challenge.description,
    industry: challenge.industry,
    company_name: challenge.companyName,
    deadline: challenge.deadline,
    status: `${challenge.status[0]}${challenge.status.slice(1).toLowerCase()}`,
    rubrics: challenge.rubrics.map((rubric) => ({
      criteria_id: rubric.criteriaId,
      criteria_name: rubric.criteriaName,
      weight: rubric.weight,
      max_score: rubric.maxScore,
    })),
    created_at: challenge.createdAt,
    updated_at: challenge.updatedAt,
  })
}

// PATCH /api/v1/challenges/:challenge_id/status
export const updateChallengeStatus = async (req, res) => {
  const { challenge_id: challengeId } = req.params
  const { status } = req.body
  const { company_id: companyId } = await companyService.getCompanyByUserId(req.user.userId)

  const updated = await challengeService.updateChallengeStatus(
    challengeId,
    companyId,
    status.toUpperCase(),
  )
  return sendSuccess(res, {
    challenge_id: updated.challengeId,
    status: `${updated.status[0]}${updated.status.slice(1).toLowerCase()}`,
    updated_at: updated.updatedAt,
  })
}
