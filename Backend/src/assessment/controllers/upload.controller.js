/**
 * ASSESSMENT MODULE — Upload Controller
 * Endpoint: GET /api/v1/assessment/challenges/:challenge_id/presigned-url
 */
import { sendSuccess } from '../../shared/utils/response.js'
import * as uploadService from '../services/upload.service.js'

export const getPresignedUrl = async (req, res) => {
  const { challenge_id: challengeId } = req.params
  const { filename } = req.query

  const result = await uploadService.generatePresignedUploadUrl({
    challengeId,
    filename,
  })

  return sendSuccess(res, {
    upload_url: result.uploadUrl,
    object_key: result.objectKey,
    expires_in: result.expiresIn,
  })
}
