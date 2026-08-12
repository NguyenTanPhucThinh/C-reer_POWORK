/**
 * IAM MODULE — Company Service (Internal Service Interface)
 *
 * Theo Coding Convention mục 3: "Module A gọi hàm của Module B qua một
 * Interface đã được define sẵn" — đây chính là Interface đó.
 *
 * Challenge Module KHÔNG được tự query bảng companies trực tiếp.
 * Nó phải gọi qua hàm export này.
 */
import prisma from '../../shared/config/prisma.js'
import { AppError } from '../../shared/utils/AppError.js'

// Lấy company info từ userId — dùng khi Employer tạo Challenge
export const getCompanyByUserId = async (userId) => {
  const company = await prisma.company.findUnique({ where: { userId } })
  if (!company) {
    throw new AppError('Không tìm thấy thông tin doanh nghiệp cho user này', 404, 'AUTH_009')
  }
  return {
    company_id: company.id,
    company_name: company.companyName,
  }
}

// Lấy company info từ companyId — dùng cho giao tiếp nội bộ giữa các module.
export const getCompanyById = async (companyId) => {
  const company = await prisma.company.findUnique({ where: { id: companyId } })
  if (!company) {
    throw new AppError('Không tìm thấy thông tin doanh nghiệp', 404, 'AUTH_009')
  }
  return {
    company_id: company.id,
    company_name: company.companyName,
  }
}
