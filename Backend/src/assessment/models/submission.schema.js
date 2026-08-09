/**
 * ASSESSMENT MODULE — Validation Schemas (Zod)
 */
import { z } from 'zod'

// GET /assessment/challenges/:challenge_id/presigned-url?filename=...&content_type=...
export const presignedUrlQuerySchema = z.object({
  filename: z.string().min(1, 'filename là bắt buộc'),
  content_type: z.string().min(1, 'content_type là bắt buộc'),
})

// POST /assessment/submissions
export const createSubmissionSchema = z.object({
  challenge_id: z.string().uuid('challenge_id phải là UUID hợp lệ'),
  solution_url: z.string().min(1, 'solution_url (object_key) là bắt buộc'),
})

// POST /assessment/submissions/:submission_id/verification/start
export const startVerificationSchema = z
  .object({
    oral_duration_seconds: z.union([z.literal(15), z.literal(30), z.literal(60), z.literal(120)]),
  })
  .strict()

// POST /assessment/verifications/:verification_id/events
export const verificationEventSchema = z
  .object({
    event: z.enum([
      'CAMERA_INTERRUPTED',
      'CAMERA_RESTORED',
      'FOCUS_LOST',
      'PASTE_BLOCKED',
      'SELECT_ALL_BLOCKED',
      'COPY_BLOCKED',
      'DROP_BLOCKED',
      'ORAL_STARTED',
      'ORAL_COMPLETED',
      'ANSWERING_STARTED',
    ]),
  })
  .strict()

// POST /assessment/submissions/:submission_id/evaluate
export const evaluateSubmissionSchema = z.object({
  evaluations: z
    .array(
      z.object({
        criteria_id: z.string().uuid(),
        score: z.number().min(0),
        comment: z.string().optional(),
      }),
    )
    .min(1, 'evaluations phải có ít nhất 1 tiêu chí'),
  general_comment: z.string().optional(),
})

// POST /assessment/submissions/:submission_id/unlock
export const unlockSubmissionSchema = z.object({
  action: z.literal('APPROVE'),
})
