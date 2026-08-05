import 'express-async-errors'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'

import prisma from './shared/config/prisma.js'
import { checkClamavReady } from './shared/config/clamav.js'
import { checkMinioReady } from './shared/config/minio.js'
import { errorHandler, notFoundHandler } from './shared/middlewares/error.middleware.js'
import authRoutes from './iam/routes/auth.routes.js'
import challengeRoutes from './challenge/routes/challenge.routes.js'
import assessmentRoutes from './assessment/routes/submission.routes.js'
import profileRoutes from './profile/routes/profile.routes.js'
import talentPoolRoutes from './talent-pool/routes/talent-pool.route.js'
import passport from './shared/config/passport.js'
import { config } from './shared/config/index.js'

const app = express()
const readinessProbeTimeoutMs = 4000

const withTimeout = (promise, timeoutLabel) =>
  new Promise((resolve) => {
    const timeoutId = setTimeout(() => {
      resolve({ ready: false, error: `${timeoutLabel}_timeout` })
    }, readinessProbeTimeoutMs)

    promise
      .then((result) => {
        clearTimeout(timeoutId)
        resolve(result)
      })
      .catch((error) => {
        clearTimeout(timeoutId)
        resolve({ ready: false, error: error.message })
      })
  })

// ─── Security & Logging ───────────────────────────────────────────────────────
app.use(helmet())
app.use(
  cors({
    origin: config.clientUrl,
    credentials: true,
  })
)
app.use(morgan('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(passport.initialize())

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', async (req, res) => {
  const [databaseResult, minioResult, clamavResult] = await Promise.all([
    withTimeout(
      prisma.$queryRawUnsafe('SELECT 1').then(() => ({ ready: true, error: null })).catch((error) => ({ ready: false, error: error.message })),
      'database'
    ),
    withTimeout(checkMinioReady(), 'minio'),
    withTimeout(checkClamavReady(), 'clamav'),
  ])

  const ready = databaseResult.ready && minioResult.ready && clamavResult.ready

  res.status(ready ? 200 : 503).json({
    status: ready ? 'ok' : 'degraded',
    service: 'powork-backend',
    timestamp: new Date().toISOString(),
    checks: {
      database: databaseResult,
      minio: minioResult,
      clamav: clamavResult,
    },
  })
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
