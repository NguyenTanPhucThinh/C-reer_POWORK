/**
 * Shared Middleware — Validate Middleware
 * Dùng chung cho mọi domain để kiểm tra tính hợp lệ của dữ liệu bằng Zod Schema.
 * Nếu dữ liệu sai, schema.parse() sẽ ném ra ZodError. 
 * Lỗi này sẽ được error.middleware.js tự động bắt và trả về mã 400 kèm danh sách field bị lỗi.
 */

// Kiểm tra dữ liệu trong Body (dùng cho POST, PUT, PATCH)
export const validateBody = (schema) => (req, res, next) => {
  req.body = schema.parse(req.body)
  next()
}

// Kiểm tra dữ liệu trên URL Query (dùng cho GET, ví dụ: ?page=1&limit=10)
export const validateQuery = (schema) => (req, res, next) => {
  req.query = schema.parse(req.query)
  next()
}