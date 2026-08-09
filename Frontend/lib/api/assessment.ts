import { assessmentAPI, challengeAPI } from './endpoints';
import { MOCK_GRADING_SUBMISSION } from '@/lib/data/mockGradingSubmission';
import type { GradingSubmission, ReviewDocument, SubmissionVersion } from '@/lib/types';

interface GetGradingSubmissionOptions {
  submissionId: string;
  challengeId?: string | null;
  allowMockFallback?: boolean;
}

function cloneMockSubmission(submissionId: string): GradingSubmission {
  return {
    ...MOCK_GRADING_SUBMISSION,
    submission_id: submissionId || MOCK_GRADING_SUBMISSION.submission_id,
    criteria: MOCK_GRADING_SUBMISSION.criteria.map((criterion) => ({ ...criterion })),
    documents: MOCK_GRADING_SUBMISSION.documents.map((document) => ({ ...document })),
    data_source: 'mock',
  };
}

function getDocumentsFromSummary(summary: SubmissionVersion): ReviewDocument[] {
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
  allowMockFallback = true,
}: GetGradingSubmissionOptions): Promise<GradingSubmission> {
  if (!challengeId) {
    return cloneMockSubmission(submissionId);
  }

  try {
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
      solution_url: selectedSubmission.solution_url,
      criteria: challenge.rubrics,
      documents: getDocumentsFromSummary(selectedSubmission),
      is_unlocked: submissionGroup.is_unlocked,
      data_source: 'api',
    };
  } catch (error) {
    if (!allowMockFallback) {
      throw error;
    }

    return cloneMockSubmission(submissionId);
  }
}
