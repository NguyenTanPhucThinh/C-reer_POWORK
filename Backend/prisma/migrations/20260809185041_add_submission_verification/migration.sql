CREATE TYPE "VerificationStatus" AS ENUM (
  'PENDING_CAMERA',
  'CAMERA_ACTIVE',
  'GENERATING_QUESTIONS',
  'ANSWERING',
  'PENDING_UPLOAD',
  'PENDING_SCAN',
  'READY',
  'REJECTED',
  'SCAN_FAILED',
  'EXPIRED'
);

CREATE TABLE "submission_verifications" (
  "verification_id" TEXT NOT NULL,
  "submission_id" TEXT NOT NULL,
  "status" "VerificationStatus" NOT NULL DEFAULT 'PENDING_CAMERA',
  "verification_code" TEXT NOT NULL,
  "selected_oral_duration_seconds" INTEGER NOT NULL,
  "actual_oral_duration_seconds" INTEGER,
  "questions" JSONB,
  "answers" JSONB,
  "recording_object_key" TEXT,
  "recording_mime_type" TEXT,
  "recording_size" INTEGER,
  "oral_started_at" TIMESTAMP(3),
  "oral_completed_at" TIMESTAMP(3),
  "answering_started_at" TIMESTAMP(3),
  "answering_completed_at" TIMESTAMP(3),
  "expires_at" TIMESTAMP(3) NOT NULL,
  "completed_at" TIMESTAMP(3),
  "camera_interruption_count" INTEGER NOT NULL DEFAULT 0,
  "camera_interruption_duration_seconds" INTEGER NOT NULL DEFAULT 0,
  "focus_loss_count" INTEGER NOT NULL DEFAULT 0,
  "paste_blocked_count" INTEGER NOT NULL DEFAULT 0,
  "select_all_blocked_count" INTEGER NOT NULL DEFAULT 0,
  "copy_blocked_count" INTEGER NOT NULL DEFAULT 0,
  "drop_blocked_count" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "submission_verifications_pkey" PRIMARY KEY ("verification_id")
);

CREATE UNIQUE INDEX "submission_verifications_submission_id_key"
ON "submission_verifications"("submission_id");

CREATE UNIQUE INDEX "submission_verifications_recording_object_key_key"
ON "submission_verifications"("recording_object_key");

ALTER TABLE "submission_verifications"
ADD CONSTRAINT "submission_verifications_submission_id_fkey"
FOREIGN KEY ("submission_id") REFERENCES "submissions"("submission_id")
ON DELETE CASCADE ON UPDATE CASCADE;
