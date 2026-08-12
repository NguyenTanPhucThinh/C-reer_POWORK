/**
 * ASSESSMENT MODULE — Submission Service
 *
 * Đây là service trung tâm của Task 4 Module 2 — gộp cả 3 nhiệm vụ:
 *   1. Tạo Submission có hỗ trợ versioning (tăng version nếu đã từng nộp)
 *   2. Đẩy job quét virus (ClamAV) chạy ngầm sau khi tạo Submission
 *   3. Gửi email xác nhận cho ứng viên (Nodemailer)
 *
 * Toàn bộ vẫn giữ đúng nguyên tắc Blind Audition — không bao giờ trả
 * user_id ra response của submitSolution/getSubmissionsByChallenge.
 */
import { AppError } from '../../shared/utils/AppError.js'
import sanitizeHtml from 'sanitize-html'
import { generateHashId } from '../../shared/utils/hashId.js'
import prisma from '../../shared/config/prisma.js'
import * as submissionRepository from '../repositories/submission.repository.js'
import * as userLookupService from '../../iam/services/user-lookup.service.js' // IAM Interface
import { assertChallengeOwnership, assertSubmissionReviewable } from './ownership.service.js'
import {
  assertSubmissionObjectExists,
  generatePresignedUploadUrl,
  isSubmissionObjectKey,
} from './upload.service.js'
import { queueScanJob } from '../jobs/scan.job.js'
import { sendSubmissionAcceptedEmail } from './notification.service.js'

export const prepareSubmissionUpload = async ({ userId, challengeId, filename }) => {
  const challenge = await prisma.challenge.findUnique({ where: { id: challengeId } })
  if (!challenge) throw new AppError('Không tìm thấy challenge tương ứng', 404, 'CHAL_004')

  const mapping = await submissionRepository.findOrCreateIdentityMapping({
    hashId: generateHashId(userId, challengeId),
    userId,
    challengeId,
  })
  const latestVersion = await submissionRepository.getLatestVersion(mapping.hashId)
  const nextVersion = latestVersion + 1
  const upload = await generatePresignedUploadUrl({ challengeId, filename })
  const submission = await submissionRepository.createSubmission({
    challengeId,
    hashId: mapping.hashId,
    version: nextVersion,
    solutionUrl: upload.objectKey,
  })

  return {
    ...upload,
    submissionId: submission.id,
    hashId: submission.hashId,
    version: submission.version,
    fileStatus: submission.fileStatus,
  }
}

// ─── POST /api/v1/assessment/submissions ──────────────────────────────────────
export const sanitizeSubmissionContent = (content, contentFormat) => {
  const sanitizedContent =
    contentFormat === 'RICH_TEXT'
      ? sanitizeHtml(content, {
          allowedTags: [
            'p',
            'br',
            'strong',
            'b',
            'em',
            'i',
            'u',
            's',
            'h1',
            'h2',
            'h3',
            'ul',
            'ol',
            'li',
            'blockquote',
            'pre',
            'code',
            'a',
          ],
          allowedAttributes: { a: ['href'] },
          allowedSchemes: ['http', 'https', 'mailto'],
        })
      : content
  const readableContent =
    contentFormat === 'RICH_TEXT'
      ? sanitizeHtml(sanitizedContent, { allowedTags: [], allowedAttributes: {} }).trim()
      : sanitizedContent.trim()
  if (readableContent.length < 50) {
    throw new AppError('Bài làm phải có ít nhất 50 ký tự nội dung.', 400, 'ASSESS_012')
  }
  return sanitizedContent
}

const sendConfirmation = ({ userId, submission, challengeTitle }) => {
  userLookupService
    .getUserById(userId)
    .then(({ email }) =>
      sendSubmissionAcceptedEmail({
        toEmail: email,
        hashId: submission.hashId,
        version: submission.version,
        challengeTitle: challengeTitle ?? 'Challenge',
      }),
    )
    .catch((err) =>
      console.error('[SubmissionService] Không gửi được email xác nhận:', err.message),
    )
}

export const submitSolution = async ({
  userId,
  challengeId,
  submissionMethod,
  solutionUrl,
  content,
  contentFormat,
  challengeTitle,
}) => {
  if (submissionMethod === 'TEXT') {
    const challenge = await prisma.challenge.findUnique({ where: { id: challengeId } })
    if (!challenge) throw new AppError('Không tìm thấy challenge tương ứng', 404, 'CHAL_004')

    const sanitizedContent = sanitizeSubmissionContent(content, contentFormat)

    const mapping = await submissionRepository.findOrCreateIdentityMapping({
      hashId: generateHashId(userId, challengeId),
      userId,
      challengeId,
    })
    const version = (await submissionRepository.getLatestVersion(mapping.hashId)) + 1
    const submission = await submissionRepository.createSubmission({
      challengeId,
      hashId: mapping.hashId,
      version,
      submissionMethod,
      content: sanitizedContent,
      contentFormat,
    })
    sendConfirmation({ userId, submission, challengeTitle })
    return {
      submissionId: submission.id,
      hashId: submission.hashId,
      version: submission.version,
      submissionMethod: submission.submissionMethod,
      contentFormat: submission.contentFormat,
      status: submission.status,
      fileStatus: null,
      submittedAt: submission.submittedAt.toISOString(),
    }
  }

  if (!isSubmissionObjectKey(solutionUrl, challengeId)) {
    throw new AppError('Object key của bài nộp không hợp lệ.', 400, 'ASSESS_008')
  }

  const awaitingUpload = await submissionRepository.findAwaitingUpload({
    userId,
    challengeId,
    solutionUrl,
  })
  if (!awaitingUpload) {
    throw new AppError('Không tìm thấy lượt upload đang chờ xác nhận.', 409, 'ASSESS_010')
  }

  try {
    await assertSubmissionObjectExists(solutionUrl)
  } catch {
    throw new AppError('File chưa được upload hoàn tất.', 409, 'ASSESS_010')
  }

  const submission = await submissionRepository.markPendingScan(awaitingUpload.id)

  queueScanJob(submission.id)

  // File chỉ được xác nhận qua email sau khi quét an toàn hoàn tất.

  // Trả dữ liệu nội bộ cho controller — TUYỆT ĐỐI không có userId
  return {
    submissionId: submission.id,
    hashId: submission.hashId,
    version: submission.version,
    submissionMethod: submission.submissionMethod,
    contentFormat: null,
    status: submission.status,
    fileStatus: submission.fileStatus,
    submittedAt: submission.submittedAt.toISOString(),
  }
}

// ─── GET /api/v1/assessment/challenges/:challenge_id/submissions ─────────────
export const getSubmissionsByChallenge = async (challengeId, companyId, database = prisma) => {
  const challenge = await database.challenge.findUnique({ where: { id: challengeId } })
  assertChallengeOwnership(challenge, companyId)

  const grouped = await submissionRepository.findSubmissionsByChallengeGroupedByHash(
    challengeId,
    database,
  )

  // Mỗi danh tính ẩn danh có một mảng submissions.
  return grouped.map((g) => ({
    hashId: g.hashId,
    isUnlocked: g.isUnlocked,
    submissions: g.submissions.map((s) => ({
      submissionId: s.id,
      version: s.version,
      status: s.status,
      submissionMethod: s.submissionMethod,
      fileStatus: s.fileStatus,
      solutionUrl: s.solutionUrl,
      content: s.content,
      contentFormat: s.contentFormat,
      generalComment: s.generalComment,
      evaluations: (s.evaluationResults ?? []).map((evaluation) => ({
        criteriaId: evaluation.criteriaId,
        score: evaluation.score,
        comment: evaluation.comment,
        evaluatedAt: evaluation.evaluatedAt.toISOString(),
      })),
      submittedAt: s.submittedAt.toISOString(),
    })),
  }))
}

// ─── POST /api/v1/assessment/submissions/:submission_id/reject ──────────────
export const rejectSubmission = async (submissionId, companyId, database = prisma) => {
  return database.$transaction(async (tx) => {
    const submission = await tx.submission.findUnique({
      where: { id: submissionId },
      include: { identityMapping: true },
    })
    if (!submission) throw new AppError('Không tìm thấy submission', 404, 'ASSESS_002')

    const challenge = await tx.challenge.findUnique({ where: { id: submission.challengeId } })
    assertChallengeOwnership(challenge, companyId)
    assertSubmissionReviewable(submission)

    if (!submission.identityMapping) {
      throw new AppError('Không tìm thấy identity mapping', 404, 'ASSESS_003')
    }
    if (submission.identityMapping.isUnlocked) {
      throw new AppError(
        'Cannot reject. This submission has already been unlocked and frozen.',
        403,
        'ASSESS_006',
      )
    }

    const rejected = await tx.submission.update({
      where: { id: submissionId },
      data: { status: 'REJECTED' },
    })
    return { submissionId: rejected.id, status: rejected.status }
  })
}

// ─── POST /api/v1/assessment/submissions/:submission_id/unlock ──────────────
export const unlockCandidate = async (
  submissionId,
  companyId,
  database = prisma,
  getUserById = userLookupService.getUserById,
) => {
  const unlockResult = await database.$transaction(async (tx) => {
    // Bước 1: Lấy bài nộp, kèm theo bảng IdentityMapping (để lấy cờ isUnlocked)
    // và bảng Điểm (EvaluationResult) kèm tiêu chí (Criteria) để chuẩn bị copy dữ liệu
    const submission = await tx.submission.findUnique({
      where: { id: submissionId },
      include: {
        identityMapping: true,
        evaluationResults: {
          include: {
            criteria: true,
          },
        },
      },
    })

    if (!submission) throw new AppError('Không tìm thấy submission', 404, 'ASSESS_002')

    const challenge = await tx.challenge.findUnique({ where: { id: submission.challengeId } })
    assertChallengeOwnership(challenge, companyId)
    assertSubmissionReviewable(submission)

    const mapping = submission.identityMapping
    if (!mapping) throw new AppError('Không tìm thấy identity mapping', 404, 'ASSESS_003')

    // Bước 2: KIỂM TRA CỜ isUnlocked (Chặn Race Condition - Click 2 lần)
    if (mapping.isUnlocked) {
      throw new AppError('Hồ sơ này đã được mở khóa từ trước, không thể mở lại!', 409, 'ASSESS_004')
    }

    if (submission.status !== 'EVALUATED' || submission.evaluationResults.length === 0) {
      throw new AppError('Submission phải được chấm hợp lệ trước khi unlock.', 409, 'ASSESS_011')
    }

    // Claim quyền tạo snapshot bằng compare-and-set để hai request đồng thời không cùng thắng.
    const claimed = await tx.identityMapping.updateMany({
      where: { hashId: mapping.hashId, isUnlocked: false },
      data: { isUnlocked: true },
    })
    if (claimed.count !== 1) {
      throw new AppError('Hồ sơ này đã được mở khóa từ trước, không thể mở lại!', 409, 'ASSESS_004')
    }

    // Bước 3: Cập nhật trạng thái bài nộp thành APPROVED
    await tx.submission.update({
      where: { id: submissionId },
      data: { status: 'APPROVED' },
    })

    // Bước 5: Tính toán điểm tổng theo trọng số (weighted score) trên thang điểm 100
    let totalScore = 0
    if (submission.evaluationResults && submission.evaluationResults.length > 0) {
      const weightedSum = submission.evaluationResults.reduce((sum, er) => {
        const maxScore = er.criteria?.maxScore || 10
        const weight = er.criteria?.weight || 0
        const ratio = maxScore > 0 ? er.score / maxScore : 0
        return sum + ratio * weight
      }, 0)
      totalScore = weightedSum
    }

    // Bước 6: COPY DỮ LIỆU SANG BẢNG VerifiedEvidence (Chốt sổ điểm số dạng Snapshot)
    await tx.verifiedEvidence.create({
      data: {
        userId: mapping.userId,
        sourceHashId: mapping.hashId,
        challengeName: challenge.title,
        companyName: challenge.companyName,
        industry: challenge.industry,
        totalScore: totalScore,
      },
    })

    // Lookup cũng phải thành công trước khi commit để API không báo lỗi sau khi DB đã unlock.
    const { email, full_name: fullName } = await getUserById(mapping.userId)
    return { mapping, email, fullName }
  })

  return {
    message: 'Identity unlocked successfully.',
    unlockedCandidateProfile: {
      userId: unlockResult.mapping.userId,
      fullName: unlockResult.fullName,
      email: unlockResult.email,
    },
  }
}
