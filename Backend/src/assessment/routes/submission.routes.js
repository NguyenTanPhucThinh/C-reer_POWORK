import { Router } from 'express'
import {
  submitSolution,
  getSubmissionsByChallenge,
  evaluateSubmission,
  rejectSubmission,
  unlockCandidate,
} from '../controllers/submission.controller.js'
import { getPresignedUrl } from '../controllers/upload.controller.js'
import {
  authenticate,
  authorize,
  blindAuditionGuard,
} from '../../shared/middlewares/auth.middleware.js'
import { validateBody, validateQuery } from '../../shared/middlewares/validate.middleware.js'
import {
  presignedUrlQuerySchema,
  createSubmissionSchema,
  evaluateSubmissionSchema,
  unlockSubmissionSchema,
} from '../models/submission.schema.js'

const router = Router()

// Bước 1: xin Presigned URL để tự upload file lên MinIO
router.get(
  '/challenges/:challenge_id/presigned-url',
  authenticate,
  authorize('CANDIDATE'),
  validateQuery(presignedUrlQuerySchema),
  getPresignedUrl,
)

// Bước 2: xác nhận nộp bài (sau khi đã PUT file thành công) — hỗ trợ versioning
router.post(
  '/submissions',
  authenticate,
  authorize('CANDIDATE'),
  blindAuditionGuard,
  validateBody(createSubmissionSchema),
  submitSolution,
)

// Employer xem danh sách bài nộp — group theo hash_id, nhiều version
router.get(
  '/challenges/:challenge_id/submissions',
  authenticate,
  authorize('EMPLOYER'),
  getSubmissionsByChallenge,
)

router.post(
  '/submissions/:submission_id/evaluate',
  authenticate,
  authorize('EMPLOYER'),
  validateBody(evaluateSubmissionSchema),
  evaluateSubmission,
)

router.post(
  '/submissions/:submission_id/reject',
  authenticate,
  authorize('EMPLOYER'),
  rejectSubmission,
)

router.post(
  '/submissions/:submission_id/unlock',
  authenticate,
  authorize('EMPLOYER'),
  validateBody(unlockSubmissionSchema),
  unlockCandidate,
)

export default router
