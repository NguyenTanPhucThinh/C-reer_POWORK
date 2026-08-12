import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Email không hợp lệ'),
  password: z.string().min(1, 'Mật khẩu là bắt buộc'),
  role: z.enum(['Candidate', 'Employer']).optional(),
});

export const registerSchema = z
  .object({
    full_name: z.string().trim().min(2, 'Tên quá ngắn'),
    email: z.string().trim().toLowerCase().email('Email không hợp lệ'),
    password: z.string().min(8, 'Mật khẩu tối thiểu 8 ký tự'),
    role: z.enum(['Candidate', 'Employer']),
    company_name: z.string().trim().optional(),
    accepted_terms: z.boolean().refine((accepted) => accepted, {
      message: 'Bạn cần xác nhận Điều khoản sử dụng và Chính sách bảo mật',
    }),
  })
  .superRefine((value, context) => {
    if (value.role === 'Employer' && !value.company_name) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['company_name'],
        message: 'Tên công ty là bắt buộc',
      });
    }
  });

export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;
