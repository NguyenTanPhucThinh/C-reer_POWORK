/**
 * Error Handler tập trung
 * Format theo Coding Convention:
 * { status: "error", error_code: "AUTH_001", message: "..." }
 */
import { AppError } from '../utils/AppError.js'

export const errorHandler = (err, req, res, next) => {
  // Lỗi do dev throw AppError — có error_code
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: 'error',
      error_code: err.errorCode ?? 'UNKNOWN',
      message: err.message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    })
  }

  // Prisma: record not found
  if (err.code === 'P2025') {
    return res
      .status(404)
      .json({ status: 'error', error_code: 'NOT_FOUND', message: 'Không tìm thấy dữ liệu' })
  }

  // Prisma: unique constraint
  if (err.code === 'P2002') {
    return res
      .status(409)
      .json({ status: 'error', error_code: 'CONFLICT', message: 'Dữ liệu đã tồn tại' })
  }

  // Zod validation
  if (err.name === 'ZodError') {
    return res.status(400).json({
      status: 'error',
      error_code: 'VALIDATION',
      message: 'Dữ liệu đầu vào không hợp lệ',
      errors: err.errors.map((e) => ({ field: e.path.join('.'), message: e.message })),
    })
  }

  console.error('[UNHANDLED ERROR]', err)
  res
    .status(500)
    .json({ status: 'error', error_code: 'SERVER_ERROR', message: 'Lỗi hệ thống Backend' })
}

export const notFoundHandler = (req, res) => {
  res.status(404).json({
    status: 'error',
    error_code: 'NOT_FOUND',
    message: `Route ${req.originalUrl} không tồn tại`,
  })
}
