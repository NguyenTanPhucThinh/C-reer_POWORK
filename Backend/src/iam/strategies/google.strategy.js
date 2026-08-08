/**
 * IAM MODULE — Google OAuth Strategy (Passport.js)
 *
 * Luồng hoạt động:
 *   1. User bấm "Đăng nhập Google" → FE redirect đến GET /api/v1/auth/google
 *   2. Passport redirect sang Google consent screen
 *   3. Google callback về GET /api/v1/auth/google/callback kèm profile
 *   4. Strategy này nhận profile → tìm hoặc tạo User trong DB
 *   5. Trả về user để controller ký JWT
 *
 * Lưu ý quan trọng:
 *   - User đăng nhập Google KHÔNG có password → passwordHash = null (OK)
 *   - Role mặc định = CANDIDATE (user tự chọn sau nếu muốn là Employer)
 *   - Nếu email đã tồn tại (đăng ký thường trước) → link vào account cũ,
 *     không tạo account mới
 */
import { Strategy as GoogleStrategy } from 'passport-google-oauth20'
import { config } from '../../shared/config/index.js'
import prisma from '../../shared/config/prisma.js'

export const isGoogleOAuthConfigured = Boolean(config.google.clientId && config.google.clientSecret)

export const createGoogleStrategy = () =>
  new GoogleStrategy(
    {
      clientID: config.google.clientId,
      clientSecret: config.google.clientSecret,
      callbackURL: config.google.callbackUrl,
      scope: ['profile', 'email'],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const googleEmail = profile.emails?.[0]
        const email = googleEmail?.value?.trim().toLowerCase()
        const emailVerified = googleEmail?.verified ?? profile._json?.email_verified
        const fullName = profile.displayName || 'Google User'
        const googleId = profile.id

        if (!email || emailVerified !== true) {
          return done(new Error('Không lấy được email đã xác minh từ Google'), null)
        }

        // Tìm user theo email — có thể đã đăng ký bằng email/password trước đó
        let user = await prisma.user.findFirst({
          where: { email: { equals: email, mode: 'insensitive' } },
        })

        if (user) {
          // User đã tồn tại → cập nhật googleId nếu chưa có, link vào account cũ
          if (!user.googleId) {
            user = await prisma.user.update({
              where: { id: user.id },
              data: { googleId },
            })
          }
        } else {
          // User mới → tạo account, không có password
          user = await prisma.user.create({
            data: {
              email,
              fullName,
              passwordHash: null, // Google user không có password
              role: 'CANDIDATE',
              googleId,
            },
          })
        }

        return done(null, user)
      } catch (err) {
        return done(err, null)
      }
    },
  )
