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
  const session = await authService.register({
    email: req.body.email,
    password: req.body.password,
    fullName: req.body.full_name,
    role: req.body.role.toUpperCase(),
    companyName: req.body.company_name,
  })
  return sendCreated(res, session, 'User registered successfully')
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

// GET /api/v1/auth/google/callback
export const googleCallback = async (req, res) => {
  const user = req.user

  // Lấy company nếu là Employer
  const company = await prisma.company.findUnique({ where: { userId: user.id } })

  const code = authService.issueGoogleLoginCode(user, company)
  const callbackUrl = new URL('/api/auth/google/callback', config.clientUrl)
  callbackUrl.searchParams.set('code', code)
  return res.redirect(callbackUrl.toString())
}

// POST /api/v1/auth/google/exchange
export const googleExchange = async (req, res) => {
  return sendSuccess(res, authService.exchangeGoogleLoginCode(req.body.code))
}
