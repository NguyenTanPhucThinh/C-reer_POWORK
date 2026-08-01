/**
 * IAM MODULE — Auth Service
 *
 * Cập nhật:
 * 1. login() — bắt trường hợp user đăng ký bằng Google cố đăng nhập bằng password
 * 2. signTokenForUser() — hàm dùng chung để ký JWT, dùng cho cả email/password và Google OAuth
 * 3. Đã đồng bộ toàn bộ Naming Convention (camelCase, Candidate/Employer) theo phong cách của nhóm
 */
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { config } from '../../shared/config/index.js'
import { AppError } from '../../shared/utils/AppError.js'
import prisma from '../../shared/config/prisma.js'

const SALT_ROUNDS = 10

// ─── Hàm dùng chung: ký JWT từ user object ───────────────────────────────────
// Dùng cho cả luồng email/password và Google OAuth
export const signTokenForUser = (user, company = null) => {
  return jwt.sign(
    {
      userId: user.id,
      role: user.role,
      companyId: company?.id ?? null,
    },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  )
}

// ─── Register ─────────────────────────────────────────────────────────────────
export const register = async ({ email, password, fullName, role, companyName }) => {
  // 1. Validate role hợp lệ theo chuẩn cũ của team
  if (!['Candidate', 'Employer'].includes(role)) {
    throw new AppError('role phải là Candidate hoặc Employer', 400, 'AUTH_004')
  }

  // 2. Employer bắt buộc phải có companyName
  if (role === 'Employer' && !companyName) {
    throw new AppError('companyName là bắt buộc khi role là Employer', 400, 'AUTH_005')
  }

  // 3. Kiểm tra email đã tồn tại chưa
  const existing = await prisma.user.findUnique({ where: { email } })
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
      ...(role === 'Employer' && companyName
        ? { company: { create: { companyName } } }
        : {}),
    },
    include: { company: true },
  })

  // 6. Trả về format camelCase
  return {
    userId: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    companyId: user.company?.id ?? null,
  }
}

// ─── Login ────────────────────────────────────────────────────────────────────
export const login = async ({ email, password }) => {
  const user = await prisma.user.findUnique({
    where: { email },
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
      'AUTH_010'
    )
  }

  // 3. So khớp password
  const isMatch = await bcrypt.compare(password, user.passwordHash)
  if (!isMatch) {
    throw new AppError('Email hoặc mật khẩu không đúng', 401, 'AUTH_007')
  }

  // 4. Sign JWT qua helper function
  const accessToken = signTokenForUser(user, user.company)

  // 5. Trả về đúng format camelCase của nhóm
  return {
    accessToken,
    tokenType: 'Bearer',
    user: {
      userId: user.id,
      fullName: user.fullName,
      role: user.role,
    },
  }
}

// ─── Get current user ─────────────────────────────────────────────────────────
export const getById = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { company: true },
  })
  if (!user) throw new AppError('Không tìm thấy người dùng', 404, 'AUTH_008')

  return {
    userId: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    companyId: user.company?.id ?? null,
  }
}