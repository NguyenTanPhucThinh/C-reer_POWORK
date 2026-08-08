/**
 * CHALLENGE MODULE — Validation Schema (Zod)
 *
 * Zod chỉ validate CẤU TRÚC (kiểu dữ liệu, bắt buộc/optional, format).
 * Logic nghiệp vụ phức tạp (tổng weight=100, deadline tương lai, trùng tên...)
 * nằm ở challenge.service.js — vì cần so sánh giữa nhiều field với nhau.
 *
 * Theo Test_Cases_Challenge.md:
 *   TC_006 — rubrics không rỗng
 *   TC_007 — title và deadline bắt buộc
 *   TC_010 — weight và max_score phải > 0 (z.number().positive() lo phần cơ bản)
 */
import { z } from 'zod'

const rubricItemSchema = z.object({
  criteria_name: z.string().min(1, 'criteria_name là bắt buộc'),
  weight: z.number().positive('Trọng số phải lớn hơn 0'), // TC_010
  max_score: z.number().positive('Điểm tối đa phải lớn hơn 0'), // TC_010
})

export const createChallengeSchema = z.object({
  title: z.string().min(1, 'Tên thử thách và Hạn nộp bài là bắt buộc'), // TC_007
  description: z.string().min(1, 'description là bắt buộc'),
  industry: z.string().min(1, 'industry là bắt buộc'),
  deadline: z.string().datetime({ message: 'Hạn chót không hợp lệ hoặc đã qua thời hạn' }), // TC_008 (format)
  rubrics: z.array(rubricItemSchema).min(1, 'Bắt buộc phải có ít nhất một tiêu chí chấm điểm'), // TC_006
})

export const updateChallengeStatusSchema = z.object({
  status: z.enum(['Open', 'Closed', 'Archived']),
})
