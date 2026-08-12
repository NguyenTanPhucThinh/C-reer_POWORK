/**
 * TALENT POOL MODULE — Talent Pool Service
 *
 * Theo yêu cầu TL (Quang_Module5.md):
 *   - TUYỆT ĐỐI không JOIN 3 bảng bằng SQL thuần
 *   - Tách biệt các tầng Service gọi chéo nhau qua Interface
 *
 * Cách gọi chéo đúng chuẩn:
 *   talent-pool.service.js
 *     → assessment/services/unlock-lookup.service.js (xác minh công ty đã unlock)
 *     → iam/services/user-lookup.service.js       (lấy fullName)
 *     → profile/services/evidence-lookup.service.js (lấy highest_score, challenges_taken)
 */
import prisma from '../../shared/config/prisma.js'
import { AppError } from '../../shared/utils/AppError.js'
import * as userLookupService from '../../iam/services/user-lookup.service.js'
import * as evidenceLookupService from '../../profile/services/evidence-lookup.service.js'
import * as unlockLookupService from '../../assessment/services/unlock-lookup.service.js'
import * as companyService from '../../iam/services/company.service.js'
import { sendInterviewInvitationEmail } from './notification.service.js'

// ─── POST /api/v1/talent-pool ─────────────────────────────────────────────────
// companyId lấy từ JWT (token Employer), không nhận từ FE
export const addToTalentPool = async (
  { companyId, userId },
  {
    database = prisma,
    getUserById = userLookupService.getUserById,
    hasCompanyUnlockedCandidate = unlockLookupService.hasCompanyUnlockedCandidate,
  } = {},
) => {
  const wasUnlockedByCompany = await hasCompanyUnlockedCandidate({ companyId, userId }, database)
  if (!wasUnlockedByCompany) {
    throw new AppError('Candidate chưa được công ty của bạn unlock.', 403, 'POOL_007')
  }

  // Kiểm tra ứng viên vẫn tồn tại — qua IAM Interface
  await getUserById(userId)

  // Kiểm tra đã có trong pool chưa — tránh trùng lặp
  const existing = await database.talentPool.findUnique({
    where: { companyId_userId: { companyId, userId } },
  })
  if (existing) {
    throw new AppError('Ứng viên này đã có trong Talent Pool', 409, 'POOL_002')
  }

  await database.talentPool.create({
    data: { companyId, userId, status: 'IN_POOL' },
  })

  return null // API Contracts chỉ trả message, không trả data
}

// ─── GET /api/v1/talent-pool ──────────────────────────────────────────────────
// Lấy danh sách pool của company, sau đó gọi chéo sang IAM và Profile để gom data
export const getTalentPool = async ({ companyId }) => {
  // Bước 1: Lấy danh sách pool từ DB — chỉ lấy field cần thiết
  const poolEntries = await prisma.talentPool.findMany({
    where: { companyId },
    orderBy: { addedAt: 'desc' },
  })

  if (poolEntries.length === 0) return []

  // Bước 2: Gọi chéo sang IAM + Profile cho từng ứng viên
  // Dùng Promise.all để gọi song song — nhanh hơn gọi tuần tự
  const results = await Promise.all(
    poolEntries.map(async (entry) => {
      const [userInfo, evidenceSummary] = await Promise.all([
        userLookupService.getUserById(entry.userId).catch(() => ({
          user_id: entry.userId,
          full_name: 'Không tìm thấy',
          email: '',
        })),
        evidenceLookupService.getEvidenceSummaryByUserId(entry.userId).catch(() => ({
          highest_score: 0,
          challenges_taken: [],
        })),
      ])

      return {
        pool_id: entry.id,
        candidate: {
          user_id: userInfo.user_id,
          full_name: userInfo.full_name,
          // Lưu ý: bảng User chưa có university, year
          // → tạm trả null, cập nhật sau khi schema bổ sung
          university: null,
          year: null,
          primary_skills: [], // TODO: bổ sung khi có skill table
        },
        highest_score: evidenceSummary.highest_score,
        challenges_taken: evidenceSummary.challenges_taken,
        status: entry.status,
        added_at: entry.addedAt.toISOString(),
      }
    }),
  )

  return results
}

// ─── PATCH /api/v1/talent-pool/:pool_id/status ────────────────────────────────
export const updateStatus = async (
  { poolId, companyId, status },
  {
    database = prisma,
    getUserById = userLookupService.getUserById,
    getCompanyById = companyService.getCompanyById,
    notifyInterview = sendInterviewInvitationEmail,
  } = {},
) => {
  // Kiểm tra xem pool record này có tồn tại và thuộc về companyId hiện tại không
  // Việc check companyId rất quan trọng để tránh lỗi bảo mật (Employer A đổi status của Employer B)
  const existing = await database.talentPool.findFirst({
    where: { id: poolId, companyId },
  })

  if (!existing) {
    throw new AppError('Không tìm thấy ứng viên trong Talent Pool của bạn', 404, 'POOL_006')
  }

  // Compare-and-set để hai request INVITED đồng thời chỉ có một request gửi email.
  const updated = await database.talentPool.updateMany({
    where: { id: poolId, companyId, status: { not: status } },
    data: { status },
  })

  if (updated.count === 1 && status === 'INVITED') {
    try {
      const [candidate, company] = await Promise.all([
        getUserById(existing.userId),
        getCompanyById(companyId),
      ])
      await notifyInterview({
        toEmail: candidate.email,
        candidateName: candidate.full_name,
        companyName: company.company_name,
      })
    } catch (error) {
      console.error('[TalentPool] Không gửi được thông báo mời phỏng vấn:', error.message)
    }
  }

  return null
}
