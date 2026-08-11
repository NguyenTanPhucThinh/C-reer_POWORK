CREATE TYPE "SubmissionMethod" AS ENUM ('FILE', 'TEXT');
CREATE TYPE "SubmissionContentFormat" AS ENUM ('RICH_TEXT', 'MARKDOWN');

ALTER TABLE "submissions"
ADD COLUMN "submission_method" "SubmissionMethod" NOT NULL DEFAULT 'FILE',
ADD COLUMN "content" TEXT,
ADD COLUMN "content_format" "SubmissionContentFormat";

ALTER TABLE "submissions"
ALTER COLUMN "solution_url" DROP NOT NULL,
ALTER COLUMN "file_status" DROP NOT NULL;

ALTER TABLE "submissions"
ADD CONSTRAINT "submissions_content_matches_method" CHECK (
  (
    "submission_method" = 'FILE'
    AND "solution_url" IS NOT NULL
    AND "file_status" IS NOT NULL
    AND "content" IS NULL
    AND "content_format" IS NULL
  )
  OR
  (
    "submission_method" = 'TEXT'
    AND "solution_url" IS NULL
    AND "file_status" IS NULL
    AND "content" IS NOT NULL
    AND "content_format" IS NOT NULL
  )
);
