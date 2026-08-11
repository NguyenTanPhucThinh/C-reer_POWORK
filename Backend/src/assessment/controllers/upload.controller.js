/**
 * ASSESSMENT MODULE — Upload Controller
 * Endpoint: GET /api/v1/assessment/challenges/:challenge_id/presigned-url
 */
import { sendSuccess } from '../../shared/utils/response.js'
import * as submissionService from '../services/submission.service.js'

const fileStatusToApi = {
  AWAITING_UPLOAD: 'AwaitingUpload',
  PENDING_SCAN: 'PendingScan',
  SAFE: 'Safe',
  REJECTED: 'Rejected',
  SCAN_FAILED: 'ScanFailed',
}

export const getPresignedUrl = async (req, res) => {
  const { challenge_id: challengeId } = req.params
  const { filename } = req.query

  const result = await submissionService.prepareSubmissionUpload({
    userId: req.user.userId,
    challengeId,
    filename,
  })

  return sendSuccess(res, {
    upload_url: result.uploadUrl,
    object_key: result.objectKey,
    submission_id: result.submissionId,
    hash_id: result.hashId,
    version: result.version,
    file_status: fileStatusToApi[result.fileStatus],
    expires_in: result.expiresIn,
  })
}
