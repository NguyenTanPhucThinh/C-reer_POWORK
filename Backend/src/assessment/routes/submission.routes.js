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
  createVerificationQuestions,
  createVerificationEvent,
  completeCandidateVerification,
  createVerificationRecordingUploadUrl,
  getEmployerVerificationDashboard,
  getEmployerVerificationRecording,
  getEmployerVerificationSummary,
  resumeVerification,
  startVerification,
} from '../controllers/verification.controller.js'
import {
  authenticate,
  authorize,
  blindAuditionGuard,
} from '../../shared/middlewares/auth.middleware.js'
import { validateBody, validateQuery } from '../../shared/middlewares/validate.middleware.js'
import {
  presignedUrlQuerySchema,
  createSubmissionSchema,
  startVerificationSchema,
  verificationEventSchema,
  completeVerificationSchema,
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

router.post(
  '/submissions/:submission_id/verification/start',
  authenticate,
  authorize('CANDIDATE'),
  validateBody(startVerificationSchema),
  startVerification,
)

router.get(
  '/verifications/:verification_id',
  authenticate,
  authorize('CANDIDATE'),
  resumeVerification,
)

router.post(
  '/verifications/:verification_id/questions',
  authenticate,
  authorize('CANDIDATE'),
  createVerificationQuestions,
)

router.post(
  '/verifications/:verification_id/events',
  authenticate,
  authorize('CANDIDATE'),
  validateBody(verificationEventSchema),
  createVerificationEvent,
)

router.post(
  '/verifications/:verification_id/recording-upload',
  authenticate,
  authorize('CANDIDATE'),
  createVerificationRecordingUploadUrl,
)

router.post(
  '/verifications/:verification_id/complete',
  authenticate,
  authorize('CANDIDATE'),
  validateBody(completeVerificationSchema),
  completeCandidateVerification,
)

router.get(
  '/submissions/:submission_id/verification-summary',
  authenticate,
  authorize('EMPLOYER'),
  getEmployerVerificationSummary,
)

router.get(
  '/submissions/:submission_id/verification-dashboard',
  authenticate,
  authorize('EMPLOYER'),
  getEmployerVerificationDashboard,
)

router.get(
  '/submissions/:submission_id/verification-recording',
  authenticate,
  authorize('EMPLOYER'),
  getEmployerVerificationRecording,
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
