import 'dotenv/config'
import app from './app.js'
import { config } from './shared/config/index.js'
import prisma from './shared/config/prisma.js'
import { ensureBucketExists } from './shared/config/minio.js'

const start = async () => {
  try {
    await prisma.$connect()
    console.log('✅ Database connected')
  } catch (err) {
    console.error('❌ Database not available - backend cannot start:', err.message)
    process.exit(1)
  }

  try {
    await ensureBucketExists()
  } catch (err) {
    console.error('❌ MinIO not available - backend cannot start:', err.message)
    process.exit(1)
  }

  if (config.nodeEnv === 'production' && !config.jwt.secret) {
    console.error('❌ JWT_SECRET is required in production')
    process.exit(1)
  }

  app.listen(config.port, () => {
    console.log(`POWORK Backend running on http://localhost:${config.port}`)
    console.log(`Environment: ${config.nodeEnv}`)
    console.log(`Health check: http://localhost:${config.port}/health`)
  })
}

start()
