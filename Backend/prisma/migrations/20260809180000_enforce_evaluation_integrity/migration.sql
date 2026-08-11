-- Reject duplicate historical rows instead of silently choosing which score should survive.
CREATE UNIQUE INDEX "evaluation_results_submission_id_criteria_id_key"
ON "evaluation_results"("submission_id", "criteria_id");

-- Existing snapshots remain valid with NULL. Every new unlock records one immutable source hash.
ALTER TABLE "verified_evidences" ADD COLUMN "source_hash_id" TEXT;
CREATE UNIQUE INDEX "verified_evidences_source_hash_id_key"
ON "verified_evidences"("source_hash_id");
