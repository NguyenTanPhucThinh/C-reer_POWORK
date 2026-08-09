import { sendSuccess } from '../../shared/utils/response.js'
import {
  resumeCandidateVerification,
  recordVerificationEvent,
  startCandidateVerification,
} from '../services/verification.service.js'
import { getOrCreateVerificationQuestions } from '../services/verification-question.service.js'
import {
  completeVerification,
  createVerificationRecordingUpload,
  getVerificationDashboard,
  getVerificationRecording,
  getVerificationSummary,
} from '../services/verification-recording.service.js'
import * as companyService from '../../iam/services/company.service.js'

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

export const createVerificationRecordingUploadUrl = async (req, res) => {
  const upload = await createVerificationRecordingUpload(
    req.params.verification_id,
    req.user.userId,
  )
  return sendSuccess(res, {
    upload_url: upload.uploadUrl,
    object_key: upload.objectKey,
    expires_in: upload.expiresIn,
  })
}

export const completeCandidateVerification = async (req, res) => {
  const result = await completeVerification({
    verificationId: req.params.verification_id,
    userId: req.user.userId,
    objectKey: req.body.object_key,
    recordingMimeType: req.body.recording_mime_type,
    answers: req.body.answers.map((answer) => ({
      questionId: answer.question_id,
      answer: answer.answer,
    })),
  })
  return sendSuccess(res, {
    verification_id: result.verificationId,
    verification_status: verificationStatusToApi[result.status],
  })
}

const getEmployerCompanyId = async (userId) => {
  const company = await companyService.getCompanyByUserId(userId)
  return company.company_id
}

export const getEmployerVerificationSummary = async (req, res) => {
  const companyId = await getEmployerCompanyId(req.user.userId)
  const summary = await getVerificationSummary(req.params.submission_id, companyId)
  return sendSuccess(res, {
    verification_status: verificationStatusToApi[summary.status] ?? 'NotStarted',
    completed_at: summary.completedAt,
    question_count: summary.questionCount,
    scan_status: summary.scanStatus,
  })
}

export const getEmployerVerificationDashboard = async (req, res) => {
  const companyId = await getEmployerCompanyId(req.user.userId)
  const verification = await getVerificationDashboard(req.params.submission_id, companyId)
  return sendSuccess(res, {
    verification_id: verification.id,
    verification_status: verificationStatusToApi[verification.status],
    statistics: {
      question_count: verification.questions.length,
      selected_oral_duration_seconds: verification.selectedOralDurationSeconds,
      actual_oral_duration_seconds: verification.actualOralDurationSeconds,
      camera_interruption_count: verification.cameraInterruptionCount,
      camera_interruption_duration_seconds: verification.cameraInterruptionDurationSeconds,
      focus_loss_count: verification.focusLossCount,
      paste_blocked_count: verification.pasteBlockedCount,
      select_all_blocked_count: verification.selectAllBlockedCount,
      copy_blocked_count: verification.copyBlockedCount,
      drop_blocked_count: verification.dropBlockedCount,
    },
    timeline: {
      created_at: verification.createdAt,
      oral_started_at: verification.oralStartedAt,
      oral_completed_at: verification.oralCompletedAt,
      answering_started_at: verification.answeringStartedAt,
      answering_completed_at: verification.answeringCompletedAt,
      completed_at: verification.completedAt,
    },
    questions: verification.questions.map((question) => ({
      question_id: question.questionId,
      question: question.question,
      minimum_length: question.minimumLength,
      maximum_length: question.maximumLength,
    })),
    answers: verification.answers.map((answer) => ({
      question_id: answer.questionId,
      answer: answer.answer,
    })),
    video: {
      status: 'Ready',
      recording_mime_type: verification.recordingMimeType,
      recording_size: verification.recordingSize,
    },
  })
}

export const getEmployerVerificationRecording = async (req, res) => {
  const companyId = await getEmployerCompanyId(req.user.userId)
  const recording = await getVerificationRecording(req.params.submission_id, companyId)
  return sendSuccess(res, {
    recording_url: recording.recordingUrl,
    expires_in: recording.expiresIn,
  })
}
