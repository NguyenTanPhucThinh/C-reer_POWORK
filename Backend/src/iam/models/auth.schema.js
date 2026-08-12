/**
 * IAM MODULE — Validation Schemas (Zod)
 * Theo API Contracts: email/password required, password min 8 chars, role là Enum, company_name optional nhưng bắt buộc nếu role = Employer
 */
import { z } from 'zod'

export const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email('Email không hợp lệ'),
  password: z.string().min(8, 'Mật khẩu phải có ít nhất 8 ký tự'),
  full_name: z.string().trim().min(1, 'full_name là bắt buộc'),
  role: z.enum(['Candidate', 'Employer'], {
    errorMap: () => ({ message: 'role phải là Candidate hoặc Employer' }),
  }),
  company_name: z.string().trim().optional(),
  accepted_terms: z.literal(true, {
    errorMap: () => ({ message: 'Bạn phải xác nhận Điều khoản sử dụng và Chính sách bảo mật' }),
  }),
})

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Email không hợp lệ'),
  password: z.string().min(1, 'password là bắt buộc'),
})

export const googleExchangeSchema = z.object({
  code: z.string().min(32).max(128),
})
