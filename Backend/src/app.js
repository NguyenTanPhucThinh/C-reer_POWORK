import 'express-async-errors'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'

import prisma from './shared/config/prisma.js'
import { checkClamavReady } from './shared/config/clamav.js'
import { checkR2Ready } from './shared/config/r2.js'
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
      console.error(`[health] ${timeoutLabel} probe timed out after ${readinessProbeTimeoutMs}ms`)
      resolve({ ready: false })
    }, readinessProbeTimeoutMs)

    promise
      .then((result) => {
        clearTimeout(timeoutId)
        resolve(result)
      })
      .catch((error) => {
        clearTimeout(timeoutId)
        console.error(`[health] ${timeoutLabel} probe failed`, error)
        resolve({ ready: false })
      })
  })

// ─── Security & Logging ───────────────────────────────────────────────────────
app.use(helmet())
app.use(
  cors({
    origin: config.clientUrl,
    credentials: true,
  }),
)
app.use(morgan('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(passport.initialize())

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', async (req, res) => {
  const [databaseResult, r2Result, clamavResult] = await Promise.all([
    withTimeout(
      prisma.$queryRaw`SELECT 1`
        .then(() => ({ ready: true }))
        .catch((error) => {
          console.error('[health] database probe failed', error)
          return { ready: false }
        }),
      'database',
    ),
    withTimeout(
      checkR2Ready().then((result) => {
        if (!result.ready) {
          console.error('[health] R2 probe failed', result.error)
        }

        return { ready: result.ready }
      }),
      'r2',
    ),
    withTimeout(
      checkClamavReady().then((result) => {
        if (!result.ready) {
          console.error('[health] clamav probe failed', result.error)
        }

        return { ready: result.ready }
      }),
      'clamav',
    ),
  ])

  const ready = databaseResult.ready && r2Result.ready && clamavResult.ready

  res.status(ready ? 200 : 503).json({
    status: ready ? 'ok' : 'degraded',
    service: 'powork-backend',
    timestamp: new Date().toISOString(),
    checks: {
      database: databaseResult.ready ? 'ready' : 'degraded',
      r2: r2Result.ready ? 'ready' : 'degraded',
      clamav: clamavResult.ready ? 'ready' : 'degraded',
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
