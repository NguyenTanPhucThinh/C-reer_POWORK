/**
 * PROFILE MODULE — Profile Controller
 * Prefix: /api/v1/profiles
 *
 * Ranh giới: Profile Module KHÔNG JOIN về Challenge hay IAM Module.
 * Dùng Snapshot Data đã lưu sẵn trong verified_evidences.
 * Giao tiếp với Assessment Module qua Event "Submission_Unlocked".
 */
import { sendSuccess } from '../../shared/utils/response.js'
import * as profileService from '../services/profile.service.js'

// GET /api/v1/profiles/:user_id — public, không cần auth
export const getProfile = async (req, res) => {
  const { user_id: userId } = req.params

  const profileData = await profileService.getProfileByUserId(userId)

  // Chuyển đổi tên key từ camelCase (của Prisma) sang snake_case theo chuẩn API Contracts
  return sendSuccess(res, {
    user_id: profileData.userId,
    full_name: profileData.fullName,
    verified_evidences: profileData.verifiedEvidences.map((ev) => ({
      evidence_id: ev.id,
      challenge_name: ev.challengeName,
      company_name: ev.companyName,
      industry: ev.industry,
      total_score: ev.totalScore,
      unlocked_at: ev.unlockedAt,
    })),
  })
}
