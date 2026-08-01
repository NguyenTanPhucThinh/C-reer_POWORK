import 'express-async-errors'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'

import { errorHandler, notFoundHandler } from './shared/middlewares/error.middleware.js'
import authRoutes from './iam/routes/auth.routes.js'
import challengeRoutes from './challenge/routes/challenge.routes.js'
import assessmentRoutes from './assessment/routes/submission.routes.js'
import profileRoutes from './profile/routes/profile.routes.js'
import talentPoolRoutes from './talent-pool/routes/talent-pool.route.js'
import passport from './shared/config/passport.js'

const app = express()

// ─── Security & Logging ───────────────────────────────────────────────────────
app.use(helmet())
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  }),
)
app.use(morgan('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(passport.initialize())

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'powork-backend', timestamp: new Date().toISOString() })
})

// ─── API v1 — Module Routing Table (theo API Contracts) ───────────────────────
app.use('/api/v1/auth', authRoutes)
app.use('/api/v1/challenges', challengeRoutes)
app.use('/api/v1/assessment', assessmentRoutes)
app.use('/api/v1/profiles', profileRoutes)
app.use('/api/v1/talent-pool', talentPoolRoutes)

// ─── Error Handling ───────────────────────────────────────────────────────────
app.use(notFoundHandler)
app.use(errorHandler)

export default app
