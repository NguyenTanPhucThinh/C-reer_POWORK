import { randomInt } from 'node:crypto'

import prisma from '../../shared/config/prisma.js'
import { AppError } from '../../shared/utils/AppError.js'

const FINAL_STATUSES = new Set(['READY', 'REJECTED', 'SCAN_FAILED', 'EXPIRED'])
const EXPIRABLE_STATUSES = new Set([
  'PENDING_CAMERA',
  'CAMERA_ACTIVE',
  'GENERATING_QUESTIONS',
  'ANSWERING',
  'PENDING_UPLOAD',
])
const SUBMITTED_FILE_STATUSES = new Set(['PENDING_SCAN', 'SAFE'])
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const CAMERA_ACTIVE_STATUSES = ['CAMERA_ACTIVE', 'GENERATING_QUESTIONS', 'ANSWERING']
const COUNTER_EVENTS = {
  FOCUS_LOST: { field: 'focusLossCount', statuses: CAMERA_ACTIVE_STATUSES },
  PASTE_BLOCKED: { field: 'pasteBlockedCount', statuses: ['ANSWERING'] },
  SELECT_ALL_BLOCKED: { field: 'selectAllBlockedCount', statuses: ['ANSWERING'] },
  COPY_BLOCKED: { field: 'copyBlockedCount', statuses: ['ANSWERING'] },
  DROP_BLOCKED: { field: 'dropBlockedCount', statuses: ['ANSWERING'] },
}
const SESSION_SELECT = {
  id: true,
  submissionId: true,
  status: true,
  verificationCode: true,
  selectedOralDurationSeconds: true,
  actualOralDurationSeconds: true,
  expiresAt: true,
  completedAt: true,
}

const generateVerificationCode = () => {
  let code = ''
  for (let index = 0; index < 4; index += 1) {
    code += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]
  }
  return `${code}-${randomInt(10, 100)}`
}

const toSession = (verification) => ({
  verificationId: verification.id,
  submissionId: verification.submissionId,
  status: verification.status,
  verificationCode: verification.verificationCode,
  oralDurationSeconds: verification.selectedOralDurationSeconds,
  actualOralDurationSeconds: verification.actualOralDurationSeconds,
  expiresAt: verification.expiresAt,
  completedAt: verification.completedAt,
})

const assertReusable = (verification, oralDurationSeconds, now) => {
  if (
    verification.status === 'EXPIRED' ||
    (EXPIRABLE_STATUSES.has(verification.status) && verification.expiresAt <= now)
  ) {
    throw new AppError('Phiên xác thực đã hết hạn.', 410, 'VERIFICATION_EXPIRED')
  }
  if (FINAL_STATUSES.has(verification.status)) {
    throw new AppError(
      'Phiên xác thực đã hoàn tất và không thể bắt đầu lại.',
      409,
      'VERIFICATION_ALREADY_COMPLETED',
    )
  }
  if (verification.selectedOralDurationSeconds !== oralDurationSeconds) {
    throw new AppError(
      'Không thể đổi thời lượng sau khi phiên đã được tạo.',
      409,
      'VERIFICATION_DURATION_LOCKED',
    )
  }
  return toSession(verification)
}

const findOwnedSubmission = async (submissionId, userId, database) => {
  const submission = await database.submission.findUnique({
    where: { id: submissionId },
    select: {
      id: true,
      fileStatus: true,
      identityMapping: { select: { userId: true } },
      verification: { select: SESSION_SELECT },
    },
  })
  if (!submission) {
    throw new AppError('Không tìm thấy Submission.', 404, 'VERIFICATION_NOT_FOUND')
  }
  if (submission.identityMapping?.userId !== userId) {
    throw new AppError('Bạn không có quyền xác thực Submission này.', 403, 'VERIFICATION_FORBIDDEN')
  }
  if (!SUBMITTED_FILE_STATUSES.has(submission.fileStatus)) {
    throw new AppError(
      'Submission chưa ở trạng thái có thể xác thực.',
      409,
      'VERIFICATION_INVALID_STATE',
    )
  }
  return submission
}

export const startCandidateVerification = async (
  { submissionId, userId, oralDurationSeconds },
  database = prisma,
  now = new Date(),
) => {
  const submission = await findOwnedSubmission(submissionId, userId, database)
  if (submission.verification) {
    return assertReusable(submission.verification, oralDurationSeconds, now)
  }

  try {
    const verification = await database.submissionVerification.create({
      data: {
        submissionId,
        verificationCode: generateVerificationCode(),
        selectedOralDurationSeconds: oralDurationSeconds,
        expiresAt: new Date(now.getTime() + 15 * 60 * 1000),
      },
    })
    return toSession(verification)
  } catch (error) {
    if (error?.code !== 'P2002') throw error
    const existing = await database.submissionVerification.findUnique({
      where: { submissionId },
      select: SESSION_SELECT,
    })
    if (!existing) throw error
    return assertReusable(existing, oralDurationSeconds, now)
  }
}

export const resumeCandidateVerification = async (
  verificationId,
  userId,
  database = prisma,
  now = new Date(),
) => {
  const verification = await database.submissionVerification.findUnique({
    where: { id: verificationId },
    select: {
      ...SESSION_SELECT,
      submission: { select: { identityMapping: { select: { userId: true } } } },
    },
  })
  if (!verification) {
    throw new AppError('Không tìm thấy phiên xác thực.', 404, 'VERIFICATION_NOT_FOUND')
  }
  if (verification.submission.identityMapping?.userId !== userId) {
    throw new AppError(
      'Bạn không có quyền truy cập phiên xác thực này.',
      403,
      'VERIFICATION_FORBIDDEN',
    )
  }
  if (
    verification.status === 'EXPIRED' ||
    (EXPIRABLE_STATUSES.has(verification.status) && verification.expiresAt <= now)
  ) {
    throw new AppError('Phiên xác thực đã hết hạn.', 410, 'VERIFICATION_EXPIRED')
  }
  return toSession(verification)
}

const invalidEventState = () =>
  new AppError(
    'Sự kiện không hợp lệ với trạng thái phiên hiện tại.',
    409,
    'VERIFICATION_INVALID_STATE',
  )

const loadEventSession = (verificationId, database) =>
  database.submissionVerification.findUnique({
    where: { id: verificationId },
    select: {
      id: true,
      status: true,
      expiresAt: true,
      selectedOralDurationSeconds: true,
      oralStartedAt: true,
      oralCompletedAt: true,
      answeringStartedAt: true,
      cameraInterruptedAt: true,
      submission: { select: { identityMapping: { select: { userId: true } } } },
    },
  })

const assertEventAccess = (verification, userId, now) => {
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
  if (verification.status === 'EXPIRED') {
    throw new AppError('Phiên xác thực đã hết hạn.', 410, 'VERIFICATION_EXPIRED')
  }
  if (FINAL_STATUSES.has(verification.status)) {
    throw new AppError(
      'Phiên xác thực đã hoàn tất và không nhận thêm sự kiện.',
      409,
      'VERIFICATION_ALREADY_COMPLETED',
    )
  }
  if (verification.expiresAt <= now) {
    throw new AppError('Phiên xác thực đã hết hạn.', 410, 'VERIFICATION_EXPIRED')
  }
}

const updatePhase = async (verificationId, database, where, data) => {
  const updated = await database.submissionVerification.updateMany({
    where: { id: verificationId, ...where },
    data,
  })
  if (updated.count !== 1) throw invalidEventState()
}

export const recordVerificationEvent = async (
  verificationId,
  userId,
  event,
  database = prisma,
  now = new Date(),
) => {
  const verification = await loadEventSession(verificationId, database)
  assertEventAccess(verification, userId, now)

  const counter = COUNTER_EVENTS[event]
  if (counter) {
    return updatePhase(
      verificationId,
      database,
      { status: { in: counter.statuses } },
      { [counter.field]: { increment: 1 } },
    )
  }

  if (event === 'ORAL_STARTED') {
    if (verification.oralStartedAt) return
    return updatePhase(
      verificationId,
      database,
      { status: 'PENDING_CAMERA', oralStartedAt: null },
      { status: 'CAMERA_ACTIVE', oralStartedAt: now },
    )
  }

  if (event === 'ORAL_COMPLETED') {
    if (verification.oralCompletedAt) return
    if (!verification.oralStartedAt || verification.cameraInterruptedAt) {
      throw invalidEventState()
    }
    const elapsedSeconds = Math.max(
      0,
      Math.ceil((now.getTime() - verification.oralStartedAt.getTime()) / 1000),
    )
    return updatePhase(
      verificationId,
      database,
      { status: 'CAMERA_ACTIVE', oralCompletedAt: null, cameraInterruptedAt: null },
      {
        oralCompletedAt: now,
        actualOralDurationSeconds: Math.min(
          elapsedSeconds,
          verification.selectedOralDurationSeconds,
        ),
      },
    )
  }

  if (event === 'ANSWERING_STARTED') {
    if (verification.answeringStartedAt) return
    return updatePhase(
      verificationId,
      database,
      { status: 'ANSWERING', answeringStartedAt: null },
      { answeringStartedAt: now },
    )
  }

  if (event === 'CAMERA_INTERRUPTED') {
    if (verification.cameraInterruptedAt) return
    return updatePhase(
      verificationId,
      database,
      { status: { in: CAMERA_ACTIVE_STATUSES }, cameraInterruptedAt: null },
      { cameraInterruptedAt: now, cameraInterruptionCount: { increment: 1 } },
    )
  }

  if (event === 'CAMERA_RESTORED') {
    if (!verification.cameraInterruptedAt) return
    const duration = Math.max(
      0,
      Math.ceil((now.getTime() - verification.cameraInterruptedAt.getTime()) / 1000),
    )
    return updatePhase(
      verificationId,
      database,
      {
        status: { in: CAMERA_ACTIVE_STATUSES },
        cameraInterruptedAt: verification.cameraInterruptedAt,
      },
      {
        cameraInterruptedAt: null,
        cameraInterruptionDurationSeconds: { increment: duration },
      },
    )
  }

  throw new AppError('Sự kiện xác thực không hợp lệ.', 400, 'VERIFICATION_VALIDATION')
}
