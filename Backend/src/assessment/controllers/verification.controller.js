import { sendSuccess } from '../../shared/utils/response.js'
import {
  resumeCandidateVerification,
  recordVerificationEvent,
  startCandidateVerification,
} from '../services/verification.service.js'
import { getOrCreateVerificationQuestions } from '../services/verification-question.service.js'

const verificationStatusToApi = {
  PENDING_CAMERA: 'PendingCamera',
  CAMERA_ACTIVE: 'CameraActive',
  GENERATING_QUESTIONS: 'GeneratingQuestions',
  ANSWERING: 'Answering',
  PENDING_UPLOAD: 'PendingUpload',
  PENDING_SCAN: 'PendingScan',
  READY: 'Ready',
  REJECTED: 'Rejected',
  SCAN_FAILED: 'ScanFailed',
  EXPIRED: 'Expired',
}

const sendSession = (res, session) =>
  sendSuccess(res, {
    verification_id: session.verificationId,
    submission_id: session.submissionId,
    verification_status: verificationStatusToApi[session.status],
    verification_code: session.verificationCode,
    oral_duration_seconds: session.oralDurationSeconds,
    expires_at: session.expiresAt,
  })

export const startVerification = async (req, res) => {
  const session = await startCandidateVerification({
    submissionId: req.params.submission_id,
    userId: req.user.userId,
    oralDurationSeconds: req.body.oral_duration_seconds,
  })
  return sendSession(res, session)
}

export const resumeVerification = async (req, res) => {
  const session = await resumeCandidateVerification(req.params.verification_id, req.user.userId)
  return sendSession(res, session)
}

export const createVerificationQuestions = async (req, res) => {
  const result = await getOrCreateVerificationQuestions(req.params.verification_id, req.user.userId)
  return sendSuccess(res, {
    verification_id: result.verificationId,
    verification_status: verificationStatusToApi[result.status],
    questions: result.questions.map((question) => ({
      question_id: question.questionId,
      question: question.question,
      minimum_length: question.minimumLength,
      maximum_length: question.maximumLength,
    })),
  })
}

export const createVerificationEvent = async (req, res) => {
  await recordVerificationEvent(req.params.verification_id, req.user.userId, req.body.event)
  return res.status(204).send()
}
