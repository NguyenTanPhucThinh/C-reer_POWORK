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

// Database giữ duy nhất một IdentityMapping cho mỗi cặp user_id + challenge_id.
export const findOrCreateIdentityMapping = ({ hashId, userId, challengeId }, database = prisma) => {
  return database.identityMapping.upsert({
    where: { userId_challengeId: { userId, challengeId } },
    update: {},
    create: { hashId, userId, challengeId, isUnlocked: false },
  })
}

// Lấy version cao nhất hiện tại của 1 hash_id — để tự tăng version tiếp theo
export const getLatestVersion = async (hashId, database = prisma) => {
  const latest = await database.submission.findFirst({
    where: { hashId },
    orderBy: { version: 'desc' },
  })
  return latest?.version ?? 0
}

// Tạo Submission mới với version đã tính — KHÔNG có cột user_id
export const createSubmission = (
  {
    challengeId,
    hashId,
    version,
    submissionMethod = 'FILE',
    solutionUrl = null,
    content = null,
    contentFormat = null,
    fileStatus = submissionMethod === 'FILE' ? 'AWAITING_UPLOAD' : null,
  },
  database = prisma,
) => {
  return database.submission.create({
    data: {
      challengeId,
      hashId,
      version,
      submissionMethod,
      solutionUrl,
      content,
      contentFormat,
      status: 'PENDING',
      fileStatus,
    },
  })
}

export const findAwaitingUpload = ({ userId, challengeId, solutionUrl }, database = prisma) =>
  database.submission.findFirst({
    where: {
      challengeId,
      solutionUrl,
      fileStatus: 'AWAITING_UPLOAD',
      identityMapping: { userId },
    },
  })

export const markPendingScan = (submissionId, database = prisma) =>
  database.submission.update({
    where: { id: submissionId },
    data: { fileStatus: 'PENDING_SCAN', submittedAt: new Date() },
  })

// Employer xem danh sách bài nộp — group theo hash_id, mỗi hash_id có nhiều version
export const findSubmissionsByChallengeGroupedByHash = async (challengeId, database = prisma) => {
  const mappings = await database.identityMapping.findMany({
    where: { challengeId },
    select: {
      hashId: true,
      isUnlocked: true,
      submissions: {
        where: {
          OR: [{ submissionMethod: 'TEXT' }, { submissionMethod: 'FILE', fileStatus: 'SAFE' }],
        },
        orderBy: { version: 'desc' },
        select: {
          id: true,
          version: true,
          status: true,
          submissionMethod: true,
          fileStatus: true,
          solutionUrl: true,
          content: true,
          contentFormat: true,
          generalComment: true,
          submittedAt: true,
          evaluationResults: {
            orderBy: { evaluatedAt: 'asc' },
            select: {
              criteriaId: true,
              score: true,
              comment: true,
              evaluatedAt: true,
            },
          },
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

export const findSubmissionById = (submissionId, database = prisma) => {
  return database.submission.findUnique({
    where: { id: submissionId },
  })
}

export const updateSubmissionScanResult = (
  submissionId,
  { fileStatus, status, generalComment },
  database = prisma,
) =>
  database.submission.update({
    where: { id: submissionId },
    data: {
      fileStatus,
      ...(status ? { status } : {}),
      ...(generalComment ? { generalComment } : {}),
    },
  })

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
