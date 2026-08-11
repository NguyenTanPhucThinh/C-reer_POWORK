/**
 * ASSESSMENT MODULE — Scan Service
 *
 * Tải file từ R2 về dưới dạng stream, đưa qua ClamAV để quét.
 * Nếu phát hiện mã độc → cập nhật Submission.status = 'REJECTED',
 * KHÔNG cho phép Employer xem được file này.
 */
import r2Client from '../../shared/config/r2.js'
import { getClamScan } from '../../shared/config/clamav.js'
import { config } from '../../shared/config/index.js'
import * as submissionRepository from '../repositories/submission.repository.js'
import { sendSubmissionScanOutcomeEmail } from './notification.service.js'

// Quét 1 file theo object_key trong R2 — trả về { isInfected, viruses }
export const scanObjectForVirus = async (objectKey) => {
  const clamscan = await getClamScan()

  // Lấy file dưới dạng stream để quét trực tiếp, không cần tải hẳn xuống disk
  const stream = await r2Client.getObject(config.r2.bucket, objectKey)
  const { isInfected, viruses } = await clamscan.scanStream(stream)

  return { isInfected, viruses }
}

// Quét 1 Submission cụ thể và cập nhật trạng thái tương ứng
export const scanSubmission = async (
  submissionId,
  {
    repository = submissionRepository,
    scan = scanObjectForVirus,
    notify = sendSubmissionScanOutcomeEmail,
  } = {},
) => {
  const submission = await repository.findSubmissionById(submissionId)
  if (!submission) {
    console.warn(`[ClamAV Job] Submission ${submissionId} không tồn tại, bỏ qua`)
    return
  }
  if (submission.fileStatus !== 'PENDING_SCAN') return submission

  let updatedSubmission
  let outcome
  let rejectionReason

  try {
    const { isInfected, viruses } = await scan(submission.solutionUrl)

    if (isInfected === true) {
      rejectionReason = `Tệp không vượt qua kiểm tra an toàn vì phát hiện dấu hiệu mã độc: ${viruses?.join(', ') || 'không xác định'}.`
      updatedSubmission = await repository.updateSubmissionScanResult(submissionId, {
        fileStatus: 'REJECTED',
        status: 'REJECTED',
        generalComment: `[Hệ thống] File bị từ chối do phát hiện mã độc: ${viruses?.join(', ') || 'unknown'}`,
      })
      outcome = 'REJECTED'
    } else {
      if (isInfected !== false) throw new Error('ClamAV returned an indeterminate result')

      updatedSubmission = await repository.updateSubmissionScanResult(submissionId, {
        fileStatus: 'SAFE',
      })
      outcome = 'ACCEPTED'
    }
  } catch (err) {
    console.error(`[ClamAV Job] Lỗi khi quét submission ${submissionId}:`, err.message)
    return repository.updateSubmissionScanResult(submissionId, { fileStatus: 'SCAN_FAILED' })
  }

  try {
    await notify(submissionId, outcome, rejectionReason)
  } catch (error) {
    console.error(`[Notification] Không gửi được kết quả bài nộp ${submissionId}:`, error.message)
  }

  return updatedSubmission
}
