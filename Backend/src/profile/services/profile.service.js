/**
 * PROFILE MODULE — Profile Service
 * Lấy lịch sử thực chiến và thông tin ứng viên
 */

import prisma from '../../shared/config/prisma.js'
import * as authService from '../../iam/services/auth.service.js' // Sử dụng IAM Interface

export const getProfileByUserId = async (userId) => {
  // Bước 1: Lấy thông tin cơ bản từ IAM Module (Không được JOIN trực tiếp ở DB)
  // Nếu user không tồn tại, authService.getById sẽ tự động ném AppError(404)
  const userContact = await authService.getById(userId)

  // Bước 2: Truy vấn danh sách Snapshot Evidence (các thử thách đã vượt qua và được nhà tuyển dụng duyệt)
  const evidences = await prisma.verifiedEvidence.findMany({
    where: { userId },
    orderBy: { unlockedAt: 'desc' }, // Bài nộp mới nhất lên trên
  })

  // Bước 3: Đóng gói và trả về Object thuần
  return {
    userId: userContact.user_id,
    fullName: userContact.full_name,
    verifiedEvidences: evidences,
  }
}
