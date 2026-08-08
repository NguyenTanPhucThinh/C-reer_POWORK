/**
 * ASSESSMENT MODULE — Upload Service
 *
 * Theo API_Contracts mục 3.3:
 *   [GET] /assessment/challenges/{challenge_id}/presigned-url
 *
 * Flow: FE xin URL tạm → FE tự PUT file thẳng lên MinIO (không qua Backend)
 *       → Controller trả object_key để dùng cho bước confirm submission sau
 */
import minioClient from '../../shared/config/minio.js'
import { config } from '../../shared/config/index.js'

export const generatePresignedUploadUrl = async ({ userId, challengeId, filename }) => {
  // object_key: submissions/{challenge_id}/{user_id}/{filename}
  // user_id xuất hiện trong path nội bộ MinIO — KHÔNG bao giờ trả ra response
  // nào mà Employer xem được (chỉ Backend dùng path này để lưu solution_url)
  const objectKey = `submissions/${challengeId}/${userId}/${Date.now()}_${filename}`

  const uploadUrl = await minioClient.presignedPutObject(
    config.minio.bucket,
    objectKey,
    config.minio.presignedExpirySeconds,
  )

  return {
    uploadUrl,
    objectKey,
    expiresIn: config.minio.presignedExpirySeconds,
  }
}
