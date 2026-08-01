import { Router } from 'express'
import passport from 'passport'
import { register, login, getMe, googleAuth, googleCallback } from '../controllers/auth.controller.js'
import { authenticate } from '../../shared/middlewares/auth.middleware.js'
import { validateBody } from '../../shared/middlewares/validate.middleware.js'
import { loginSchema, registerSchema } from '../models/auth.schema.js'

const router = Router()

// ─── Email / Password ─────────────────────────────────────────────────────────
router.post('/register', validateBody(registerSchema), register)
router.post('/login',    validateBody(loginSchema),    login)
router.get('/me',        authenticate, getMe)

// ─── Google OAuth ─────────────────────────────────────────────────────────────

// Bước 1: FE redirect user đến đây → Passport redirect sang Google
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })
)

// Bước 2: Google redirect về đây sau khi user đồng ý
// Passport xác thực, gọi strategy → gắn req.user → gọi googleCallback
router.get(
  '/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: `${process.env.CLIENT_URL || 'http://localhost:3000'}/auth/login?error=google_failed`,
  }),
  googleCallback
)

export default router
