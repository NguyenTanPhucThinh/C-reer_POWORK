import { assessmentAPI, challengeAPI } from './endpoints';
import type { GradingSubmission, ReviewDocument, SubmissionVersion } from '@/lib/types';

interface GetGradingSubmissionOptions {
  submissionId: string;
  challengeId: string;
}

function getDocumentsFromSummary(summary: SubmissionVersion): ReviewDocument[] {
  if (!summary.solution_url) return [];
  const extension = summary.solution_url.match(/\.[a-z0-9]{1,10}$/i)?.[0] ?? '';

  return [
    {
      fileName: `submission-v${summary.version}${extension}`,
      url: summary.solution_url,
      description:
        'Bài làm được backend trả về dưới dạng URL. Nếu trình duyệt không xem trước được, reviewer có thể tải xuống hoặc mở bằng công cụ phù hợp.',
    },
  ];
}

export async function getGradingSubmission({
  submissionId,
  challengeId,
}: GetGradingSubmissionOptions): Promise<GradingSubmission> {
  const [challenge, submissions] = await Promise.all([
    challengeAPI.getById(challengeId),
    assessmentAPI.listByChallenge(challengeId),
  ]);

  const submissionGroup = submissions.find((group) =>
    group.submissions.some((submission) => submission.submission_id === submissionId)
  );
  const selectedSubmission = submissionGroup?.submissions.find(
    (submission) => submission.submission_id === submissionId
  );

  if (!submissionGroup || !selectedSubmission) {
    throw new Error('Submission not found for this challenge.');
  }

  return {
    submission_id: selectedSubmission.submission_id,
    hash_id: submissionGroup.hash_id,
    status: selectedSubmission.status,
    challenge_id: challenge.challenge_id,
    challenge_title: challenge.title,
    submitted_at: selectedSubmission.submitted_at,
    submission_method: selectedSubmission.submission_method,
    content_format: selectedSubmission.content_format,
    content: selectedSubmission.content,
    solution_url: selectedSubmission.solution_url,
    criteria: challenge.rubrics,
    documents: getDocumentsFromSummary(selectedSubmission),
    evaluations: selectedSubmission.evaluations ?? [],
    general_comment: selectedSubmission.general_comment ?? undefined,
    evaluated_at: selectedSubmission.evaluations?.at(-1)?.evaluated_at,
    is_unlocked: submissionGroup.is_unlocked,
  };
}
