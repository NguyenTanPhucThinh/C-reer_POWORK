import { AppError } from '../../shared/utils/AppError.js'

export const assertChallengeOwnership = (challenge, companyId) => {
  if (!challenge) throw new AppError('Không tìm thấy challenge tương ứng', 404, 'CHAL_004')
  if (challenge.companyId !== companyId) {
    throw new AppError(
      'Bạn không có quyền truy cập dữ liệu Assessment của công ty khác.',
      403,
      'ASSESS_005',
    )
  }
  return challenge
}
