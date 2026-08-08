import { Router } from 'express'
import passport from 'passport'
import { randomBytes, timingSafeEqual } from 'node:crypto'
import {
  register,
  login,
  getMe,
  googleCallback,
  googleExchange,
} from '../controllers/auth.controller.js'
import { config } from '../../shared/config/index.js'
import { authenticate } from '../../shared/middlewares/auth.middleware.js'
import { validateBody } from '../../shared/middlewares/validate.middleware.js'
import { googleExchangeSchema, loginSchema, registerSchema } from '../models/auth.schema.js'

const router = Router()
const isGoogleOAuthConfigured = Boolean(config.google.clientId && config.google.clientSecret)
const googleStateCookie = 'google_oauth_state'
const googleStateCookieOptions = {
  httpOnly: true,
  secure: config.nodeEnv === 'production',
  sameSite: 'lax',
  path: '/api/v1/auth/google',
}

const readCookie = (req, name) => {
  const item = req.headers.cookie
    ?.split(';')
    .map((value) => value.trim())
    .find((value) => value.startsWith(`${name}=`))

  if (!item) return null

  try {
    return decodeURIComponent(item.slice(name.length + 1))
  } catch {
    return null
  }
}

const beginGoogleOAuth = (req, res, next) => {
  const state = randomBytes(32).toString('hex')
  res.cookie(googleStateCookie, state, {
    ...googleStateCookieOptions,
    maxAge: 10 * 60 * 1000,
  })
  return passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
    state,
  })(req, res, next)
}

const verifyGoogleOAuthState = (req, res, next) => {
  const expectedState = readCookie(req, googleStateCookie)
  const receivedState = typeof req.query.state === 'string' ? req.query.state : ''
  res.clearCookie(googleStateCookie, googleStateCookieOptions)

  const expectedBuffer = Buffer.from(expectedState ?? '')
  const receivedBuffer = Buffer.from(receivedState)
  const matches =
    expectedBuffer.length > 0 &&
    expectedBuffer.length === receivedBuffer.length &&
    timingSafeEqual(expectedBuffer, receivedBuffer)

  if (!matches) {
    return res.redirect(`${config.clientUrl}/login?error=google_state_failed`)
  }

  next()
}

const googleOAuthDisabled = (req, res) => {
  return res.redirect(`${config.clientUrl}/login?error=google_not_configured`)
}

// ─── Email / Password ─────────────────────────────────────────────────────────
router.post('/register', validateBody(registerSchema), register)
router.post('/login', validateBody(loginSchema), login)
router.get('/me', authenticate, getMe)
router.post('/google/exchange', validateBody(googleExchangeSchema), googleExchange)

// ─── Google OAuth ─────────────────────────────────────────────────────────────

// Bước 1: FE redirect user đến đây → Passport redirect sang Google
if (isGoogleOAuthConfigured) {
  router.get('/google', beginGoogleOAuth)

  // Bước 2: Google redirect về đây sau khi user đồng ý
  // Passport xác thực, gọi strategy → gắn req.user → gọi googleCallback
  router.get(
    '/google/callback',
    verifyGoogleOAuthState,
    passport.authenticate('google', {
      session: false,
      failureRedirect: `${config.clientUrl}/login?error=google_failed`,
    }),
    googleCallback,
  )
} else {
  router.get('/google', googleOAuthDisabled)
  router.get('/google/callback', googleOAuthDisabled)
}

export default router
