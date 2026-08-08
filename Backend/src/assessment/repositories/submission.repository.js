/**
 * ASSESSMENT MODULE — Submission Repository
 *
 * Chỉ chứa Prisma query thuần. KHÔNG chứa logic nghiệp vụ.
 *
 * Schema mới (TL cập nhật):
 *   - IdentityMapping 1-N Submission (trước là 1-1) — 1 hash_id có nhiều version
 *   - Submission.version tăng dần, @@unique([hashId, version])
 */
import prisma from '../../shared/config/prisma.js'

// Tìm IdentityMapping theo user_id + challenge_id — để biết hash_id đã tồn tại chưa
export const findIdentityMapping = (userId, challengeId) => {
  return prisma.identityMapping.findFirst({
    where: { userId, challengeId },
  })
}

// Tạo IdentityMapping mới (lần đầu ứng viên nộp bài cho challenge này)
export const createIdentityMapping = ({ hashId, userId, challengeId }) => {
  return prisma.identityMapping.create({
    data: { hashId, userId, challengeId, isUnlocked: false },
  })
}

// Lấy version cao nhất hiện tại của 1 hash_id — để tự tăng version tiếp theo
export const getLatestVersion = async (hashId) => {
  const latest = await prisma.submission.findFirst({
    where: { hashId },
    orderBy: { version: 'desc' },
  })
  return latest?.version ?? 0
}

// Tạo Submission mới với version đã tính — KHÔNG có cột user_id
export const createSubmission = ({ challengeId, hashId, version, solutionUrl }) => {
  return prisma.submission.create({
    data: {
      challengeId,
      hashId,
      version,
      solutionUrl,
      status: 'PENDING',
    },
  })
}

// Employer xem danh sách bài nộp — group theo hash_id, mỗi hash_id có nhiều version
export const findSubmissionsByChallengeGroupedByHash = async (challengeId) => {
  const mappings = await prisma.identityMapping.findMany({
    where: { challengeId },
    include: {
      submissions: {
        orderBy: { version: 'desc' },
        select: {
          id: true,
          version: true,
          status: true,
          solutionUrl: true,
          submittedAt: true,
        },
      },
    },
  })

  // Chỉ trả mã ẩn danh, trạng thái mở khóa và submissions — KHÔNG có userId
  return mappings
    .filter((m) => m.submissions.length > 0)
    .map((m) => ({
      hashId: m.hashId,
      isUnlocked: m.isUnlocked,
      submissions: m.submissions,
    }))
}

export const findSubmissionById = (submissionId) => {
  return prisma.submission.findUnique({
    where: { id: submissionId },
  })
}

export const updateSubmissionStatus = (submissionId, status, generalComment) => {
  return prisma.submission.update({
    where: { id: submissionId },
    data: { status, ...(generalComment ? { generalComment } : {}) },
  })
}

// Lấy IdentityMapping theo hash_id (dùng khi unlock)
export const findIdentityMappingByHashId = (hashId) => {
  return prisma.identityMapping.findUnique({ where: { hashId } })
}

export const markIdentityMappingUnlocked = (hashId) => {
  return prisma.identityMapping.update({
    where: { hashId },
    data: { isUnlocked: true },
  })
}
