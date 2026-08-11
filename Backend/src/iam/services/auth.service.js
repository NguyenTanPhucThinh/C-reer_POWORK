/**
 * IAM MODULE — Auth Service
 *
 * Cập nhật:
 * 1. login() — bắt trường hợp user đăng ký bằng Google cố đăng nhập bằng password
 * 2. Login/register/Google cùng tạo một session theo HTTP contract snake_case.
 * 3. JWT giữ role enum nội bộ; response đổi role sang Candidate/Employer cho Frontend.
 */
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { randomBytes } from 'node:crypto'
import { config } from '../../shared/config/index.js'
import { AppError } from '../../shared/utils/AppError.js'
import prisma from '../../shared/config/prisma.js'

const SALT_ROUNDS = 10
const GOOGLE_LOGIN_CODE_TTL_MS = 60_000
const googleLoginCodes = new Map()

const toApiRole = (role) => (role === 'EMPLOYER' ? 'Employer' : 'Candidate')

const toPublicUser = (user) => ({
  user_id: user.id,
  email: user.email,
  full_name: user.fullName,
  role: toApiRole(user.role),
  company_id: user.company?.id ?? null,
  created_at: user.createdAt?.toISOString?.() ?? user.createdAt,
})

// ─── Hàm dùng chung: ký JWT từ user object ───────────────────────────────────
// Dùng cho cả luồng email/password và Google OAuth
const signTokenForUser = (user, company = null) => {
  return jwt.sign(
    {
      userId: user.id,
      role: user.role,
      companyId: company?.id ?? null,
    },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn },
  )
}

const createSession = (user, company = user.company ?? null) => ({
  access_token: signTokenForUser(user, company),
  token_type: 'Bearer',
  user: toPublicUser({ ...user, company }),
})

// ─── Register ─────────────────────────────────────────────────────────────────
export const register = async ({ email, password, fullName, role, companyName }) => {
  if (!['CANDIDATE', 'EMPLOYER'].includes(role)) {
    throw new AppError('role phải là Candidate hoặc Employer', 400, 'AUTH_004')
  }

  if (role === 'EMPLOYER' && !companyName) {
    throw new AppError('companyName là bắt buộc khi role là Employer', 400, 'AUTH_005')
  }

  // 3. Kiểm tra email đã tồn tại chưa
  const existing = await prisma.user.findFirst({
    where: { email: { equals: email, mode: 'insensitive' } },
  })
  if (existing) {
    throw new AppError('Email đã được đăng ký', 409, 'AUTH_006')
  }

  // 4. Hash password
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)

  // 5. Tạo user kèm Company (Nested Write nếu là Employer)
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      fullName,
      role,
      ...(role === 'EMPLOYER' && companyName ? { company: { create: { companyName } } } : {}),
    },
    include: { company: true },
  })

  return createSession(user)
}

// ─── Login ────────────────────────────────────────────────────────────────────
export const login = async ({ email, password }) => {
  const user = await prisma.user.findFirst({
    where: { email: { equals: email, mode: 'insensitive' } },
    include: { company: true },
  })

  // 1. Không tiết lộ "email không tồn tại"
  if (!user) {
    throw new AppError('Email hoặc mật khẩu không đúng', 401, 'AUTH_007')
  }

  // 2. Bắt trường hợp: user đăng ký bằng Google cố đăng nhập bằng password
  if (!user.passwordHash) {
    throw new AppError(
      'Tài khoản này được đăng ký qua Google. Vui lòng đăng nhập bằng Google.',
      400,
      'AUTH_010',
    )
  }

  // 3. So khớp password
  const isMatch = await bcrypt.compare(password, user.passwordHash)
  if (!isMatch) {
    throw new AppError('Email hoặc mật khẩu không đúng', 401, 'AUTH_007')
  }

  return createSession(user)
}

// ─── Get current user ─────────────────────────────────────────────────────────
export const getById = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { company: true },
  })
  if (!user) throw new AppError('Không tìm thấy người dùng', 404, 'AUTH_008')

  return toPublicUser(user)
}

const deleteExpiredGoogleLoginCodes = () => {
  const now = Date.now()
  for (const [code, value] of googleLoginCodes) {
    if (value.expiresAt <= now) googleLoginCodes.delete(code)
  }
}

export const issueGoogleLoginCode = (user, company = null) => {
  deleteExpiredGoogleLoginCodes()
  const code = randomBytes(32).toString('base64url')

  // ponytail: in-memory is enough for the current single Backend instance; use a shared store
  // only when the application is deployed with multiple Backend replicas.
  googleLoginCodes.set(code, {
    session: createSession(user, company),
    expiresAt: Date.now() + GOOGLE_LOGIN_CODE_TTL_MS,
  })
  const expiryTimer = setTimeout(() => googleLoginCodes.delete(code), GOOGLE_LOGIN_CODE_TTL_MS)
  expiryTimer.unref()

  return code
}

export const exchangeGoogleLoginCode = (code) => {
  deleteExpiredGoogleLoginCodes()
  const value = googleLoginCodes.get(code)
  googleLoginCodes.delete(code)

  if (!value || value.expiresAt <= Date.now()) {
    throw new AppError('Mã đăng nhập Google không hợp lệ hoặc đã hết hạn', 401, 'AUTH_011')
  }

  return value.session
}
