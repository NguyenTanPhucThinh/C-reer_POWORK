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
import { queueScanJob } from '../jobs/scan.job.js'
import { sendSubmissionConfirmationEmail } from './notification.service.js'

// ─── POST /api/v1/assessment/submissions ──────────────────────────────────────
export const submitSolution = async ({ userId, challengeId, solutionUrl, challengeTitle }) => {
  // 1. Tìm hoặc tạo IdentityMapping — 1 cặp (user_id, challenge_id) chỉ có 1 hash_id duy nhất,
  //    dù ứng viên nộp lại nhiều lần (version tăng, hash_id giữ nguyên)
  let mapping = await submissionRepository.findIdentityMapping(userId, challengeId)

  if (!mapping) {
    const hashId = generateHashId(userId, challengeId)
    mapping = await submissionRepository.createIdentityMapping({
      hashId,
      userId,
      challengeId,
    })
  }

  // 2. Tính version tiếp theo — tăng dần nếu ứng viên đã nộp trước đó (TC versioning)
  const latestVersion = await submissionRepository.getLatestVersion(mapping.hashId)
  const nextVersion = latestVersion + 1

  // 3. Tạo Submission — KHÔNG có cột user_id, chỉ có hash_id
  const submission = await submissionRepository.createSubmission({
    challengeId,
    hashId: mapping.hashId,
    version: nextVersion,
    solutionUrl,
  })

  // 4. Đẩy Background Job quét virus — KHÔNG await, không block response
  queueScanJob(submission.id)

  // 5. Gửi email xác nhận — KHÔNG await trong luồng chính (fire-and-forget),
  //    lấy email qua IAM Interface, không lộ ra response cho FE
  userLookupService
    .getUserContactById(userId)
    .then(({ email }) =>
      sendSubmissionConfirmationEmail({
        toEmail: email,
        hashId: mapping.hashId,
        version: nextVersion,
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
    submittedAt: submission.submittedAt.toISOString(),
  }
}

// ─── GET /api/v1/assessment/challenges/:challenge_id/submissions ─────────────
export const getSubmissionsByChallenge = async (challengeId) => {
  const grouped = await submissionRepository.findSubmissionsByChallengeGroupedByHash(challengeId)

  // Mỗi danh tính ẩn danh có một mảng submissions.
  return grouped.map((g) => ({
    hashId: g.hashId,
    isUnlocked: g.isUnlocked,
    submissions: g.submissions.map((s) => ({
      submissionId: s.id,
      version: s.version,
      status: s.status,
      solutionUrl: s.solutionUrl,
      submittedAt: s.submittedAt.toISOString(),
    })),
  }))
}

// ─── POST /api/v1/assessment/submissions/:submission_id/unlock ──────────────
export const unlockCandidate = async (submissionId) => {
  const mappingResult = await prisma.$transaction(async (tx) => {
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

    // Bước 5: Lấy thông tin Challenge để làm Snapshot
    const challenge = await tx.challenge.findUnique({
      where: { id: mapping.challengeId },
    })
    if (!challenge) throw new AppError('Không tìm thấy challenge tương ứng', 404, 'CHAL_004')

    // Tính toán điểm tổng theo trọng số (weighted score) trên thang điểm 100
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
