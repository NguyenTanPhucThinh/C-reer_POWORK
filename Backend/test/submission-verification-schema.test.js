import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

test('Prisma keeps one anonymous verification per Submission with the full lifecycle', async () => {
  const [schema, migration, interruptionMigration] = await Promise.all([
    readFile(new URL('../prisma/schema.prisma', import.meta.url), 'utf8'),
    readFile(
      new URL(
        '../prisma/migrations/20260809185041_add_submission_verification/migration.sql',
        import.meta.url,
      ),
      'utf8',
    ),
    readFile(
      new URL(
        '../prisma/migrations/20260809195247_add_verification_camera_interruption_time/migration.sql',
        import.meta.url,
      ),
      'utf8',
    ),
  ])
  const model = schema.match(/model SubmissionVerification \{[\s\S]*?\n\}/)?.[0]

  assert.ok(model)
  assert.match(model, /submissionId\s+String\s+@unique/)
  assert.match(model, /recordingObjectKey\s+String\?\s+@unique/)
  assert.match(model, /questions\s+Json\?/)
  assert.match(model, /answers\s+Json\?/)
  assert.match(model, /cameraInterruptedAt\s+DateTime\?\s+@map\("camera_interrupted_at"\)/)
  assert.doesNotMatch(model, /\b(userId|fullName|email)\b/)
  assert.match(migration, /UNIQUE INDEX "submission_verifications_submission_id_key"/)
  assert.match(migration, /UNIQUE INDEX "submission_verifications_recording_object_key_key"/)
  assert.match(migration, /ON DELETE CASCADE ON UPDATE CASCADE/)
  assert.match(interruptionMigration, /ADD COLUMN "camera_interrupted_at" TIMESTAMP\(3\)/)

  for (const status of [
    'PENDING_CAMERA',
    'CAMERA_ACTIVE',
    'GENERATING_QUESTIONS',
    'ANSWERING',
    'PENDING_UPLOAD',
    'PENDING_SCAN',
    'READY',
    'REJECTED',
    'SCAN_FAILED',
    'EXPIRED',
  ]) {
    assert.match(schema, new RegExp(`\\b${status}\\b`))
  }
})
