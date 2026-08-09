CREATE TYPE "FileScanStatus" AS ENUM (
  'AWAITING_UPLOAD',
  'PENDING_SCAN',
  'SAFE',
  'REJECTED',
  'SCAN_FAILED'
);

ALTER TABLE "submissions" ADD COLUMN "file_status" "FileScanStatus";

-- Existing files have no durable clean-scan evidence, so fail closed.
UPDATE "submissions" SET "file_status" = 'SCAN_FAILED';

ALTER TABLE "submissions"
  ALTER COLUMN "file_status" SET NOT NULL,
  ALTER COLUMN "file_status" SET DEFAULT 'AWAITING_UPLOAD';
