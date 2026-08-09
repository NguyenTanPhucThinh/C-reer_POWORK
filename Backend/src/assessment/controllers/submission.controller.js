/**
 * ASSESSMENT MODULE — Submission Controller
 * Prefix: /api/v1/assessment
 */
import { sendSuccess, sendCreated } from '../../shared/utils/response.js'
import * as submissionService from '../services/submission.service.js'
import * as evaluationService from '../services/evaluation.service.js'
import * as companyService from '../../iam/services/company.service.js'
import prisma from '../../shared/config/prisma.js'

const fileStatusToApi = {
  AWAITING_UPLOAD: 'AwaitingUpload',
  PENDING_SCAN: 'PendingScan',
  SAFE: 'Safe',
  REJECTED: 'Rejected',
  SCAN_FAILED: 'ScanFailed',
}

// POST /api/v1/assessment/submissions
export const submitSolution = async (req, res) => {
  const { challenge_id: challengeId, solution_url: solutionUrl } = req.body
  const userId = req.user.userId // chỉ lấy từ JWT — blindAuditionGuard đã chặn FE gửi lên

  // Lấy title để đưa vào nội dung email xác nhận (không bắt buộc, chỉ làm đẹp email)
  const challenge = await prisma.challenge.findUnique({ where: { id: challengeId } })

  const result = await submissionService.submitSolution({
    userId,
    challengeId,
    solutionUrl,
    challengeTitle: challenge?.title,
  })

  return sendCreated(res, {
    submission_id: result.submissionId,
    hash_id: result.hashId,
    version: result.version,
    status: `${result.status[0]}${result.status.slice(1).toLowerCase()}`,
    file_status: fileStatusToApi[result.fileStatus],
    submitted_at: result.submittedAt,
  })
}

// GET /api/v1/assessment/challenges/:challenge_id/submissions
export const getSubmissionsByChallenge = async (req, res) => {
  const { challenge_id: challengeId } = req.params
  const { company_id: companyId } = await companyService.getCompanyByUserId(req.user.userId)
  const result = await submissionService.getSubmissionsByChallenge(challengeId, companyId)
  return sendSuccess(
    res,
    result.map((group) => ({
      hash_id: group.hashId,
      is_unlocked: group.isUnlocked,
      submissions: group.submissions.map((submission) => ({
        submission_id: submission.submissionId,
        version: submission.version,
        status: `${submission.status[0]}${submission.status.slice(1).toLowerCase()}`,
        file_status: fileStatusToApi[submission.fileStatus],
        solution_url: submission.solutionUrl,
        submitted_at: submission.submittedAt,
      })),
    })),
  )
}

// POST /api/v1/assessment/submissions/:submission_id/evaluate
export const evaluateSubmission = async (req, res) => {
  const { submission_id: submissionId } = req.params
  const { company_id: companyId } = await companyService.getCompanyByUserId(req.user.userId)
  const result = await evaluationService.evaluateSubmission(
    submissionId,
    {
      evaluations: req.body.evaluations.map((evaluation) => ({
        criteriaId: evaluation.criteria_id,
        score: evaluation.score,
        comment: evaluation.comment,
      })),
      generalComment: req.body.general_comment,
    },
    companyId,
  )
  return sendCreated(res, {
    submission_id: result.submissionId,
    evaluations: result.evaluations.map((evaluation) => ({
      criteria_id: evaluation.criteriaId,
      score: evaluation.score,
      comment: evaluation.comment,
    })),
    general_comment: result.generalComment,
    total_score: result.totalScore,
    evaluated_at: result.evaluatedAt,
  })
}

// POST /api/v1/assessment/submissions/:submission_id/reject
export const rejectSubmission = async (req, res) => {
  const { submission_id: submissionId } = req.params
  const { company_id: companyId } = await companyService.getCompanyByUserId(req.user.userId)
  const result = await submissionService.rejectSubmission(submissionId, companyId)
  return sendSuccess(res, {
    submission_id: result.submissionId,
    status: `${result.status[0]}${result.status.slice(1).toLowerCase()}`,
  })
}

// POST /api/v1/assessment/submissions/:submission_id/unlock
export const unlockCandidate = async (req, res) => {
  const { submission_id: submissionId } = req.params
  const { company_id: companyId } = await companyService.getCompanyByUserId(req.user.userId)
  const result = await submissionService.unlockCandidate(submissionId, companyId)
  return sendSuccess(res, {
    message: result.message,
    unlocked_candidate_profile: {
      user_id: result.unlockedCandidateProfile.userId,
      full_name: result.unlockedCandidateProfile.fullName,
      email: result.unlockedCandidateProfile.email,
    },
  })
}
