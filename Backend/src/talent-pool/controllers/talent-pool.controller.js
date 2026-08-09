/**
 * TALENT POOL MODULE — Talent Pool Controller
 * Prefix: /api/v1/talent-pool
 *
 * Cho phép Employer lưu lại danh sách ứng viên đã unlock để tiện theo dõi.
 *
 * Ranh giới module (ERD mục 2.5):
 *   - Bảng talent_pools lưu companyId và userId dạng DATA FIELD — không FK cứng
 *   - Không JOIN trực tiếp sang IAM Module ở tầng DB
 *   - Thông tin ứng viên (full_name, university...) lấy qua Internal Service Interface
 */

import { sendSuccess, sendCreated } from '../../shared/utils/response.js'
import { AppError } from '../../shared/utils/AppError.js'
import * as talentPoolService from '../services/talent-pool.service.js'

// ─── POST /api/v1/talent-pool ─────────────────────────────────────────────────
// Ai gọi: Employer — sau khi unlock ứng viên, muốn lưu vào danh sách theo dõi
// Auth:   Bearer Employer_Token
// Nhận:  { user_id } — userId của ứng viên đã được unlock trước đó
// Lưu ý: Chỉ được thêm ứng viên đã unlock (isUnlocked = true trong identity_mappings)
export const addToTalentPool = async (req, res) => {
  const { user_id: userId } = req.body

  if (!userId) throw new AppError('user_id là bắt buộc', 400, 'POOL_001')

  const companyId = req.user.companyId
  if (!companyId) throw new AppError('Tài khoản chưa thuộc công ty nào', 403, 'POOL_003')

  await talentPoolService.addToTalentPool({ companyId, userId })

  return sendCreated(res, null, 'Candidate added to Talent Pool')
}

// ─── GET /api/v1/talent-pool ──────────────────────────────────────────────────
// Ai gọi: Employer — xem danh sách ứng viên đang theo dõi
// Auth:   Bearer Employer_Token
// Trả:   danh sách ứng viên kèm highestScore, challengesTaken, status
export const getTalentPool = async (req, res) => {
  const companyId = req.user.companyId
  if (!companyId) throw new AppError('Tài khoản chưa thuộc công ty nào', 403, 'POOL_003')

  const pool = await talentPoolService.getTalentPool({ companyId })

  return sendSuccess(res, pool)
}

// ─── PATCH /api/v1/talent-pool/:pool_id/status ────────────────────────────────
// Ai gọi: Employer — muốn đổi trạng thái của ứng viên (VD: mời phỏng vấn)
// Auth:   Bearer Employer_Token
// Nhận:   { status: 'INVITED' | 'IN_POOL' }
export const updateTalentPoolStatus = async (req, res) => {
  const poolId = req.params.pool_id
  const { status } = req.body
  const companyId = req.user.companyId

  if (!companyId) throw new AppError('Tài khoản chưa thuộc công ty nào', 403, 'POOL_003')
  if (!status) throw new AppError('status là bắt buộc', 400, 'POOL_004')

  const validStatuses = ['IN_POOL', 'INVITED']
  if (!validStatuses.includes(status)) {
    throw new AppError('Trạng thái không hợp lệ', 400, 'POOL_005')
  }

  await talentPoolService.updateStatus({ poolId, companyId, status })

  return sendSuccess(res, null, 'Cập nhật trạng thái thành công')
}
