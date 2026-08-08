/**
 * MinIO Client — Object Storage cho file bài nộp
 * Dùng chung cho toàn app — đặt ở shared/ vì không thuộc 1 domain cụ thể
 */
import { Client } from 'minio'
import { config } from './index.js'

const minioClient = new Client({
  endPoint: config.minio.endpoint,
  port: config.minio.port,
  useSSL: config.minio.useSSL,
  accessKey: config.minio.accessKey,
  secretKey: config.minio.secretKey,
})

const startupAttempts = 15
const startupRetryDelayMs = 2000

// Đảm bảo bucket tồn tại — gọi 1 lần khi server start
export const ensureBucketExists = async () => {
  let lastError

  for (let attempt = 1; attempt <= startupAttempts; attempt += 1) {
    try {
      const exists = await minioClient.bucketExists(config.minio.bucket)
      if (!exists) {
        await minioClient.makeBucket(config.minio.bucket)
        console.log(`✅ Đã tạo MinIO bucket: ${config.minio.bucket}`)
      }
      return
    } catch (error) {
      lastError = error
      if (attempt < startupAttempts) {
        console.warn(`MinIO not ready, retrying (${attempt}/${startupAttempts})...`)
        await new Promise((resolve) => setTimeout(resolve, startupRetryDelayMs))
      }
    }
  }

  throw lastError
}

export const checkMinioReady = async () => {
  if (!config.minio.endpoint || !config.minio.accessKey || !config.minio.secretKey) {
    return {
      ready: false,
      bucketExists: false,
      error: 'missing_minio_configuration',
    }
  }

  try {
    const bucketExists = await minioClient.bucketExists(config.minio.bucket)

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

export default minioClient
