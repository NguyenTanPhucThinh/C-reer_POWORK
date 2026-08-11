-- One Candidate keeps one anonymous identity inside each Challenge.
CREATE UNIQUE INDEX "identity_mappings_user_id_challenge_id_key"
ON "identity_mappings"("user_id", "challenge_id");
