import { Client } from 'minio'

import { config } from './index.js'

const endpointPattern = /^[a-z0-9]{32}\.r2\.cloudflarestorage\.com$/i
const startupAttempts = 15
const startupRetryDelayMs = 2000

const hasCompleteConfig = () =>
  Boolean(
    config.r2.endpoint && config.r2.accessKeyId && config.r2.secretAccessKey && config.r2.bucket,
  )

export const validateR2Config = () => {
  if (!hasCompleteConfig()) {
    throw new Error(
      'R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY and R2_BUCKET are required',
    )
  }

  if (!endpointPattern.test(config.r2.endpoint)) {
    throw new Error(
      'R2_ENDPOINT must look like <ACCOUNT_ID>.r2.cloudflarestorage.com without https:// or a bucket name',
    )
  }
}

// The fallback host only lets unit tests import storage-dependent modules without live credentials.
// Runtime startup always calls validateR2Config before using this client.
const r2Client = new Client({
  endPoint: config.r2.endpoint || 'localhost',
  port: 443,
  useSSL: true,
  region: 'auto',
  accessKey: config.r2.accessKeyId,
  secretKey: config.r2.secretAccessKey,
})

export const ensureR2BucketExists = async () => {
  validateR2Config()
  let lastError

  for (let attempt = 1; attempt <= startupAttempts; attempt += 1) {
    try {
      const exists = await r2Client.bucketExists(config.r2.bucket)
      if (!exists) {
        throw new Error(`R2 bucket does not exist or is not accessible: ${config.r2.bucket}`)
      }
      return
    } catch (error) {
      lastError = error
      if (attempt < startupAttempts) {
        console.warn(`R2 not ready, retrying (${attempt}/${startupAttempts})...`)
        await new Promise((resolve) => setTimeout(resolve, startupRetryDelayMs))
      }
    }
  }

  throw lastError
}

export const checkR2Ready = async () => {
  try {
    validateR2Config()
    const bucketExists = await r2Client.bucketExists(config.r2.bucket)

    return {
      ready: bucketExists,
      bucketExists,
      error: bucketExists ? null : 'bucket_missing',
    }
  } catch (error) {
    return {
      ready: false,
      bucketExists: false,
      error: error.message,
    }
  }
}

export default r2Client
