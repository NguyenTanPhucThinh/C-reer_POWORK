import { randomUUID } from 'node:crypto'

import r2Client from '../../shared/config/r2.js'
import { config } from '../../shared/config/index.js'
import prisma from '../../shared/config/prisma.js'
import { AppError } from '../../shared/utils/AppError.js'
import { assertChallengeOwnership } from './ownership.service.js'
import { scanObjectForVirus } from './scan.service.js'

const FINAL_STATUSES = new Set(['READY', 'REJECTED', 'SCAN_FAILED', 'EXPIRED'])
const RECORDING_MIME_TYPE = 'video/webm'
const SUMMARY_SELECT = { submissionId: true, status: true, completedAt: true, questions: true }
const DASHBOARD_SELECT = {
  id: true,
  submissionId: true,
  status: true,
  questions: true,
  answers: true,
  selectedOralDurationSeconds: true,
  actualOralDurationSeconds: true,
  recordingMimeType: true,
  recordingSize: true,
  oralStartedAt: true,
  oralCompletedAt: true,
  answeringStartedAt: true,
  answeringCompletedAt: true,
  completedAt: true,
  createdAt: true,
  cameraInterruptionCount: true,
  cameraInterruptionDurationSeconds: true,
  focusLossCount: true,
  pasteBlockedCount: true,
  selectAllBlockedCount: true,
  copyBlockedCount: true,
  dropBlockedCount: true,
}

export const createVerificationRecordingObjectKey = () => `verifications/${randomUUID()}.webm`

const createPresignedUrl = (objectKey) =>
  r2Client.presignedPutObject(config.r2.bucket, objectKey, config.r2.presignedExpirySeconds)

const loadVerification = (verificationId, database) =>
  database.submissionVerification.findUnique({
    where: { id: verificationId },
    select: {
      id: true,
      status: true,
      expiresAt: true,
      questions: true,
      answers: true,
      recordingObjectKey: true,
      recordingMimeType: true,
      recordingSize: true,
      submission: { select: { identityMapping: { select: { userId: true } } } },
    },
  })

const assertAccess = (verification, userId, now) => {
  if (!verification) {
    throw new AppError('Không tìm thấy phiên xác thực.', 404, 'VERIFICATION_NOT_FOUND')
  }
  if (verification.submission.identityMapping?.userId !== userId) {
    throw new AppError(
      'Bạn không có quyền cập nhật phiên xác thực này.',
      403,
      'VERIFICATION_FORBIDDEN',
    )
  }
  if (verification.status === 'EXPIRED' || verification.expiresAt <= now) {
    throw new AppError('Phiên xác thực đã hết hạn.', 410, 'VERIFICATION_EXPIRED')
  }
  if (FINAL_STATUSES.has(verification.status) || verification.status === 'PENDING_SCAN') {
    throw new AppError('Phiên xác thực đã được hoàn tất.', 409, 'VERIFICATION_ALREADY_COMPLETED')
  }
}

const toUpload = async (objectKey, presign) => ({
  uploadUrl: await presign(objectKey),
  objectKey,
  expiresIn: config.r2.presignedExpirySeconds,
})

export const createVerificationRecordingUpload = async (
  verificationId,
  userId,
  { database = prisma, presign = createPresignedUrl, now = new Date() } = {},
) => {
  const verification = await loadVerification(verificationId, database)
  assertAccess(verification, userId, now)
  if (verification.status === 'PENDING_UPLOAD' && verification.recordingObjectKey) {
    return toUpload(verification.recordingObjectKey, presign)
  }
  if (verification.status !== 'ANSWERING') {
    throw new AppError(
      'Phiên xác thực chưa sẵn sàng để upload video.',
      409,
      'VERIFICATION_INVALID_STATE',
    )
  }

  const objectKey = createVerificationRecordingObjectKey()
  const claimed = await database.submissionVerification.updateMany({
    where: { id: verificationId, status: 'ANSWERING', recordingObjectKey: null },
    data: { status: 'PENDING_UPLOAD', recordingObjectKey: objectKey },
  })
  if (claimed.count === 1) return toUpload(objectKey, presign)

  const current = await loadVerification(verificationId, database)
  assertAccess(current, userId, now)
  if (current.status === 'PENDING_UPLOAD' && current.recordingObjectKey) {
    return toUpload(current.recordingObjectKey, presign)
  }
  throw new AppError('Không thể cấp URL upload video.', 409, 'VERIFICATION_INVALID_STATE')
}

const validateAnswers = (questions, answers) => {
  if (!Array.isArray(questions) || questions.length !== answers.length) {
    throw new AppError('Phải trả lời đầy đủ tất cả câu hỏi.', 400, 'VERIFICATION_ANSWER_INVALID')
  }
  const answerByQuestion = new Map(answers.map((answer) => [answer.questionId, answer.answer]))
  if (answerByQuestion.size !== answers.length) {
    throw new AppError('Không được gửi trùng câu hỏi.', 400, 'VERIFICATION_ANSWER_INVALID')
  }
  for (const question of questions) {
    const answer = answerByQuestion.get(question.questionId)
    if (
      !answer ||
      answer.length < question.minimumLength ||
      answer.length > question.maximumLength
    ) {
      throw new AppError(
        'Câu trả lời không đáp ứng độ dài yêu cầu.',
        400,
        'VERIFICATION_ANSWER_INVALID',
      )
    }
  }
}

const statRecording = async (objectKey, statObject) => {
  try {
    return await statObject(objectKey)
  } catch (error) {
    if (error?.code === 'NoSuchKey' || error?.statusCode === 404) {
      throw new AppError('Không tìm thấy video đã upload.', 400, 'VERIFICATION_RECORDING_NOT_FOUND')
    }
    throw new AppError(
      'Không thể kiểm tra video đã upload.',
      503,
      'VERIFICATION_RECORDING_UNAVAILABLE',
    )
  }
}

const defaultStatObject = (objectKey) => r2Client.statObject(config.r2.bucket, objectKey)

export const scanVerificationRecording = async (
  verificationId,
  { database = prisma, scan = scanObjectForVirus, now = new Date() } = {},
) => {
  const verification = await database.submissionVerification.findUnique({
    where: { id: verificationId },
    select: { id: true, status: true, recordingObjectKey: true },
  })
  if (!verification || verification.status !== 'PENDING_SCAN') return verification

  let status
  try {
    const result = await scan(verification.recordingObjectKey)
    if (result.isInfected === true) status = 'REJECTED'
    else if (result.isInfected === false) status = 'READY'
    else throw new Error('ClamAV returned an indeterminate result')
  } catch (error) {
    console.error(`[Verification Scan] ${verificationId}:`, error.message)
    status = 'SCAN_FAILED'
  }

  const updated = await database.submissionVerification.updateMany({
    where: { id: verificationId, status: 'PENDING_SCAN' },
    data: { status, completedAt: now },
  })
  return updated.count === 1 ? { ...verification, status, completedAt: now } : verification
}

export const queueVerificationRecordingScan = (verificationId) => {
  // ponytail: in-process job is MVP-only; use a durable queue when restart/retry guarantees matter.
  setImmediate(() => {
    scanVerificationRecording(verificationId).catch((error) => {
      console.error(`[Verification Scan Job] ${verificationId}:`, error.message)
    })
  })
}

const loadEmployerSubmission = async (submissionId, companyId, verificationSelect, database) => {
  const submission = await database.submission.findUnique({
    where: { id: submissionId },
    select: {
      id: true,
      challengeId: true,
      status: true,
      identityMapping: { select: { isUnlocked: true } },
      verification: { select: verificationSelect },
    },
  })
  if (!submission) {
    throw new AppError('Không tìm thấy Submission.', 404, 'VERIFICATION_NOT_FOUND')
  }
  const challenge = await database.challenge.findUnique({
    where: { id: submission.challengeId },
    select: { id: true, companyId: true },
  })
  assertChallengeOwnership(challenge, companyId)
  if (
    submission.verification?.submissionId !== undefined &&
    submission.verification.submissionId !== submission.id
  ) {
    throw new AppError(
      'Verification không thuộc Submission này.',
      409,
      'VERIFICATION_INVALID_STATE',
    )
  }
  return submission
}

const scanStatus = (status) => {
  if (status === 'PENDING_SCAN') return 'PENDING'
  if (status === 'READY') return 'SAFE'
  if (status === 'REJECTED') return 'REJECTED'
  if (status === 'SCAN_FAILED') return 'SCAN_FAILED'
  return 'NOT_STARTED'
}

export const getVerificationSummary = async (submissionId, companyId, database = prisma) => {
  const submission = await loadEmployerSubmission(submissionId, companyId, SUMMARY_SELECT, database)
  const verification = submission.verification
  return {
    status: verification?.status ?? 'NOT_STARTED',
    completedAt: verification?.completedAt ?? null,
    questionCount: Array.isArray(verification?.questions) ? verification.questions.length : 0,
    scanStatus: scanStatus(verification?.status),
  }
}

const assertUnlockedReady = (submission) => {
  if (!submission.identityMapping?.isUnlocked || submission.status !== 'APPROVED') {
    throw new AppError(
      'Verification chỉ được xem sau khi Submission đã unlock.',
      403,
      'VERIFICATION_LOCKED',
    )
  }
  if (!submission.verification) {
    throw new AppError('Không tìm thấy Verification.', 404, 'VERIFICATION_NOT_FOUND')
  }
  if (submission.verification.status !== 'READY') {
    throw new AppError(
      'Verification chưa hoàn tất kiểm tra an toàn.',
      409,
      'VERIFICATION_NOT_READY',
    )
  }
  return submission.verification
}

export const getVerificationDashboard = async (submissionId, companyId, database = prisma) => {
  const submission = await loadEmployerSubmission(
    submissionId,
    companyId,
    DASHBOARD_SELECT,
    database,
  )
  return assertUnlockedReady(submission)
}

const createRecordingDownloadUrl = (objectKey) =>
  r2Client.presignedGetObject(config.r2.bucket, objectKey, config.r2.presignedExpirySeconds)

export const getVerificationRecording = async (
  submissionId,
  companyId,
  { database = prisma, presign = createRecordingDownloadUrl } = {},
) => {
  const submission = await loadEmployerSubmission(
    submissionId,
    companyId,
    { submissionId: true, status: true, recordingObjectKey: true },
    database,
  )
  const verification = assertUnlockedReady(submission)
  if (!verification.recordingObjectKey) {
    throw new AppError('Không tìm thấy video xác thực.', 404, 'VERIFICATION_RECORDING_NOT_FOUND')
  }
  return {
    recordingUrl: await presign(verification.recordingObjectKey),
    expiresIn: config.r2.presignedExpirySeconds,
  }
}

export const completeVerification = async (
  { verificationId, userId, objectKey, recordingMimeType, answers },
  {
    database = prisma,
    statObject = defaultStatObject,
    queueScan = queueVerificationRecordingScan,
    now = new Date(),
  } = {},
) => {
  const verification = await loadVerification(verificationId, database)
  assertAccess(verification, userId, now)
  if (
    verification.status !== 'PENDING_UPLOAD' ||
    !verification.recordingObjectKey ||
    verification.recordingObjectKey !== objectKey
  ) {
    throw new AppError('Object key không thuộc phiên này.', 400, 'VERIFICATION_RECORDING_INVALID')
  }

  validateAnswers(verification.questions, answers)
  const object = await statRecording(objectKey, statObject)
  const storedMimeType = object.metaData?.['content-type']
  const maxBytes = config.upload.maxFileSizeMB * 1024 * 1024
  if (
    recordingMimeType !== RECORDING_MIME_TYPE ||
    storedMimeType?.split(';')[0].trim().toLowerCase() !== RECORDING_MIME_TYPE ||
    !Number.isInteger(object.size) ||
    object.size <= 0 ||
    object.size > maxBytes
  ) {
    throw new AppError('Video upload không hợp lệ.', 400, 'VERIFICATION_RECORDING_INVALID')
  }

  const normalizedAnswers = answers.map(({ questionId, answer }) => ({ questionId, answer }))
  await database.$transaction(async (transaction) => {
    const updated = await transaction.submissionVerification.updateMany({
      where: {
        id: verificationId,
        status: 'PENDING_UPLOAD',
        recordingObjectKey: objectKey,
        expiresAt: { gt: now },
      },
      data: {
        status: 'PENDING_SCAN',
        answers: normalizedAnswers,
        recordingMimeType,
        recordingSize: object.size,
        answeringCompletedAt: now,
      },
    })
    if (updated.count !== 1) {
      throw new AppError(
        'Phiên xác thực đã được hoàn tất bởi request khác.',
        409,
        'VERIFICATION_ALREADY_COMPLETED',
      )
    }
  })

  queueScan(verificationId)
  return { verificationId, status: 'PENDING_SCAN' }
}
