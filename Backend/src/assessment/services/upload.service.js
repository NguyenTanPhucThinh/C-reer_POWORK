/**
 * ASSESSMENT MODULE — Upload Service
 *
 * Theo API_Contracts mục 3.3:
 *   [GET] /assessment/challenges/{challenge_id}/presigned-url
 *
 * Flow: FE xin URL tạm → FE tự PUT file thẳng lên R2 (không qua Backend)
 *       → Controller trả object_key để dùng cho bước confirm submission sau
 */
import r2Client from '../../shared/config/r2.js'
import { config } from '../../shared/config/index.js'
import { randomUUID } from 'node:crypto'
import path from 'node:path'

const safeExtensionPattern = /^\.[a-z0-9]{1,10}$/
const anonymousFilePattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}(\.[a-z0-9]{1,10})?$/i

export const createSubmissionObjectKey = (challengeId, filename) => {
  const extension = path.extname(filename).toLowerCase()
  const safeExtension = safeExtensionPattern.test(extension) ? extension : ''
  return `submissions/${challengeId}/${randomUUID()}${safeExtension}`
}

export const isSubmissionObjectKey = (objectKey, challengeId) => {
  const parts = objectKey.split('/')
  return (
    parts.length === 3 &&
    parts[0] === 'submissions' &&
    parts[1] === challengeId &&
    anonymousFilePattern.test(parts[2])
  )
}

export const generatePresignedUploadUrl = async ({ challengeId, filename }) => {
  const objectKey = createSubmissionObjectKey(challengeId, filename)

  const uploadUrl = await r2Client.presignedPutObject(
    config.r2.bucket,
    objectKey,
    config.r2.presignedExpirySeconds,
  )

  // FIX: Chuyển đổi URL nội bộ (minio:9000) thành Public URL để Frontend (Browser) có thể upload
  const publicMinioUrl = process.env.NEXT_PUBLIC_MINIO_URL || 'http://localhost:9000'
  const finalUrl = uploadUrl.replace(/^https?:\/\/minio:9000/, publicMinioUrl)

  return {
    uploadUrl,
    objectKey,
    expiresIn: config.r2.presignedExpirySeconds,
  }
}

export const assertSubmissionObjectExists = (objectKey) =>
  r2Client.statObject(config.r2.bucket, objectKey)
