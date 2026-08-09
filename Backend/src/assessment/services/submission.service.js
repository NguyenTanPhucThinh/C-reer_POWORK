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
import { generateHashId } from '../../shared/utils/hashId.js'
import prisma from '../../shared/config/prisma.js'
import * as submissionRepository from '../repositories/submission.repository.js'
import * as userLookupService from '../../iam/services/user-lookup.service.js' // IAM Interface
import { assertChallengeOwnership, assertSubmissionFileSafe } from './ownership.service.js'
import {
  assertSubmissionObjectExists,
  generatePresignedUploadUrl,
  isSubmissionObjectKey,
} from './upload.service.js'
import { queueScanJob } from '../jobs/scan.job.js'
import { sendSubmissionConfirmationEmail } from './notification.service.js'

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
export const submitSolution = async ({ userId, challengeId, solutionUrl, challengeTitle }) => {
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

  // 5. Gửi email xác nhận — KHÔNG await trong luồng chính (fire-and-forget),
  //    lấy email qua IAM Interface, không lộ ra response cho FE
  userLookupService
    .getUserContactById(userId)
    .then(({ email }) =>
      sendSubmissionConfirmationEmail({
        toEmail: email,
        hashId: submission.hashId,
        version: submission.version,
        challengeTitle: challengeTitle ?? 'Challenge',
      }),
    )
    .catch((err) =>
      console.error('[SubmissionService] Không gửi được email xác nhận:', err.message),
    )

  // 6. Trả dữ liệu nội bộ cho controller — TUYỆT ĐỐI không có userId
  return {
    submissionId: submission.id,
    hashId: submission.hashId,
    version: submission.version,
    status: submission.status,
    fileStatus: submission.fileStatus,
    submittedAt: submission.submittedAt.toISOString(),
  }
}

// ─── GET /api/v1/assessment/challenges/:challenge_id/submissions ─────────────
export const getSubmissionsByChallenge = async (challengeId, companyId, database = prisma) => {
  const challenge = await database.challenge.findUnique({ where: { id: challengeId } })
  assertChallengeOwnership(challenge, companyId)

  const grouped = await submissionRepository.findSubmissionsByChallengeGroupedByHash(challengeId)

  // Mỗi danh tính ẩn danh có một mảng submissions.
  return grouped.map((g) => ({
    hashId: g.hashId,
    isUnlocked: g.isUnlocked,
    submissions: g.submissions.map((s) => ({
      submissionId: s.id,
      version: s.version,
      status: s.status,
      fileStatus: s.fileStatus,
      solutionUrl: s.solutionUrl,
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
    assertSubmissionFileSafe(submission)

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
export const unlockCandidate = async (submissionId, companyId, database = prisma) => {
  const mappingResult = await database.$transaction(async (tx) => {
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
    assertSubmissionFileSafe(submission)

    const mapping = submission.identityMapping
    if (!mapping) throw new AppError('Không tìm thấy identity mapping', 404, 'ASSESS_003')

    // Bước 2: KIỂM TRA CỜ isUnlocked (Chặn Race Condition - Click 2 lần)
    if (mapping.isUnlocked) {
      throw new AppError('Hồ sơ này đã được mở khóa từ trước, không thể mở lại!', 409, 'ASSESS_004')
    }

    // Bước 3: Cập nhật trạng thái bài nộp thành APPROVED
    await tx.submission.update({
      where: { id: submissionId },
      data: { status: 'APPROVED' },
    })

    // Bước 4: Bật cờ isUnlocked = true cho hồ sơ ẩn danh này
    await tx.identityMapping.update({
      where: { hashId: mapping.hashId },
      data: { isUnlocked: true },
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
        challengeName: challenge.title,
        companyName: challenge.companyName,
        industry: challenge.industry,
        totalScore: totalScore,
      },
    })

    // Transaction thành công, trả về mapping để dùng ở bước dưới
    return mapping
  })

  // Lấy thông tin thật qua IAM Interface
  const { email, fullName } = await userLookupService.getUserContactById(mappingResult.userId)

  return {
    message: 'Identity unlocked successfully.',
    unlockedCandidateProfile: {
      userId: mappingResult.userId,
      fullName,
      email,
    },
  }
}
