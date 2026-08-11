'use client';

import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import { assessmentAPI } from '@/lib/api/endpoints';
import { useChallenges } from '@/lib/hooks/useChallenges';
import type {
  EmployerOverviewData,
  OverviewActivity,
  OverviewTask,
  ReviewQueueItem,
} from '@/lib/types/employerOverview';
import type { SubmissionGroup } from '@/lib/types';

const PENDING_STATUS = 'Pending';
const SESSION_NOW = Date.now();

function isDeadlineSoon(deadline: string) {
  const remaining = new Date(deadline).getTime() - SESSION_NOW;
  return remaining > 0 && remaining <= 7 * 24 * 60 * 60 * 1000;
}

export function useEmployerOverview() {
  const challengesQuery = useChallenges();
  const challenges = useMemo(() => challengesQuery.data ?? [], [challengesQuery.data]);
  const submissionQueries = useQueries({
    queries: challenges.map((challenge) => ({
      queryKey: ['challenge-submissions', challenge.challenge_id],
      queryFn: () => assessmentAPI.listByChallenge(challenge.challenge_id),
      staleTime: 60_000,
    })),
  });

  const data = useMemo<EmployerOverviewData>(() => {
    const allSubmissions = challenges.flatMap((challenge, index) => {
      const groups = (submissionQueries[index]?.data ?? []) as SubmissionGroup[];
      return groups.flatMap((group) =>
        group.submissions.map((submission) => ({
          challenge,
          submission,
          hashId: group.hash_id,
        }))
      );
    });

    const reviewQueue: ReviewQueueItem[] = allSubmissions
      .filter(({ submission }) => submission.status === PENDING_STATUS)
      .map(({ challenge, submission, hashId }) => ({
        submissionId: submission.submission_id,
        challengeId: challenge.challenge_id,
        challengeTitle: challenge.title,
        candidateCode: hashId,
        status: submission.status,
        submittedAt: submission.submitted_at,
      }))
      .sort(
        (a, b) => new Date(b.submittedAt ?? 0).getTime() - new Date(a.submittedAt ?? 0).getTime()
      );

    const tasks: OverviewTask[] = [];
    if (challenges.length === 0)
      tasks.push({ key: 'createChallenge', href: '/employer/challenges/create' });
    if (reviewQueue.length > 0)
      tasks.push({ key: 'reviewSubmissions', href: '#review-queue', count: reviewQueue.length });
    const endingSoon = challenges.filter((challenge) => isDeadlineSoon(challenge.deadline)).length;
    if (endingSoon > 0) tasks.push({ key: 'deadlineSoon', href: '#challenges', count: endingSoon });

    const activities: OverviewActivity[] = allSubmissions
      .filter(({ submission }) => Boolean(submission.submitted_at))
      .map(({ challenge, submission, hashId }) => ({
        id: submission.submission_id,
        action: 'submissionReceived' as const,
        actorName: `Candidate ${hashId.slice(0, 8)}`,
        actorInitials: '••',
        candidateCode: hashId,
        subject: challenge.title,
        occurredAt: submission.submitted_at,
      }))
      .sort((a, b) => new Date(b.occurredAt ?? 0).getTime() - new Date(a.occurredAt ?? 0).getTime())
      .slice(0, 5);

    const nextDeadline = [...challenges]
      .filter((challenge) => new Date(challenge.deadline).getTime() > SESSION_NOW)
      .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())[0]?.deadline;

    return { challenges, reviewQueue, tasks, activities, nextDeadline };
  }, [challenges, submissionQueries]);

  return {
    data,
    unlockedCount: challenges
      .flatMap((_, index) => (submissionQueries[index]?.data ?? []) as SubmissionGroup[])
      .filter((group) => group.is_unlocked).length,
    isLoading: challengesQuery.isLoading,
    isError: challengesQuery.isError,
    error: challengesQuery.error,
    isReviewQueueLoading: submissionQueries.some((query) => query.isLoading),
    hasReviewQueueError: submissionQueries.some((query) => query.isError),
    refetch: challengesQuery.refetch,
  };
}
