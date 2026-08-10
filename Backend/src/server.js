import 'dotenv/config'
import app from './app.js'
import { config } from './shared/config/index.js'
import prisma from './shared/config/prisma.js'
import { ensureR2BucketExists } from './shared/config/r2.js'

const knownDevelopmentJwtSecrets = new Set([
  'powork_super_secret_dev_2026',
  'your_super_secret_key_here_change_in_production',
])

const start = async () => {
  if (
    config.nodeEnv === 'production' &&
    (!config.jwt.secret || knownDevelopmentJwtSecrets.has(config.jwt.secret))
  ) {
    console.error('JWT_SECRET must be set to a non-development value in production')
    process.exit(1)
  }

  try {
    await prisma.$connect()
    console.log('✅ Database connected')
  } catch (err) {
    console.error('❌ Database not available - backend cannot start:', err.message)
    process.exit(1)
  }

  try {
    await ensureR2BucketExists()
  } catch (err) {
    console.error('❌ Cloudflare R2 not available - backend cannot start:', err.message)
    process.exit(1)
  }

  app.listen(config.port, () => {
    console.log(`POWORK Backend running on http://localhost:${config.port}`)
    console.log(`Environment: ${config.nodeEnv}`)
    console.log(`Health check: http://localhost:${config.port}/health`)
  })
}

start()
