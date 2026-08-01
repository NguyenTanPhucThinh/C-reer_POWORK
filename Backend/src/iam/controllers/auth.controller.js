/**
 * IAM MODULE — Auth Controller
 * Prefix: /api/v1/auth
 *
 * Mới thêm:
 * googleCallback() — xử lý sau khi Google redirect về, ký JWT và redirect FE
 */
import { sendSuccess, sendCreated } from '../../shared/utils/response.js'
import * as authService from '../services/auth.service.js'
import { config } from '../../shared/config/index.js'
import prisma from '../../shared/config/prisma.js'

// POST /api/v1/auth/register
export const register = async (req, res) => {
  const user = await authService.register(req.body)
  return sendCreated(res, { user }, 'User registered successfully')
}

// POST /api/v1/auth/login
export const login = async (req, res) => {
  const result = await authService.login(req.body)
  return sendSuccess(res, result)
}

// GET /api/v1/auth/me
export const getMe = async (req, res) => {
  const user = await authService.getById(req.user.userId)
  return sendSuccess(res, user)
}

// ─── Google OAuth ─────────────────────────────────────────────────────────────

// GET /api/v1/auth/google
export const googleAuth = (req, res) => {
  // Passport middleware đã xử lý — hàm này không bao giờ được gọi thực sự
}

// GET /api/v1/auth/google/callback
export const googleCallback = async (req, res) => {
  const user = req.user

  // Lấy company nếu là Employer
  const company = await prisma.company.findUnique({ where: { userId: user.id } }).catch(() => null)

  // 💡 SỬA: Đổi access_token thành accessToken cho đúng chuẩn camelCase
  const accessToken = authService.signTokenForUser(user, company)

  // Redirect về FE kèm token
  return res.redirect(`${config.clientUrl}/auth/callback?token=${accessToken}&role=${user.role}`)
}
