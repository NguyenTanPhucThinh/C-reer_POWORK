import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { assessmentAPI } from '@/lib/api/endpoints';
import { getGradingSubmission } from '@/lib/api/assessment';
import type { EvaluateRequest, UnlockRequest } from '@/lib/types';

export function useGradingSubmission(submissionId: string, challengeId?: string | null) {
  return useQuery({
    queryKey: ['assessment', 'grading-submission', submissionId, challengeId ?? null],
    queryFn: () => getGradingSubmission({ submissionId, challengeId: challengeId! }),
    enabled: Boolean(submissionId && challengeId),
  });
}

export function useVerificationSummary(submissionId: string) {
  return useQuery({
    queryKey: ['assessment', 'verification-summary', submissionId],
    queryFn: () => assessmentAPI.getVerificationSummary(submissionId),
    enabled: Boolean(submissionId),
  });
}

export function useEvaluateSubmission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ submissionId, payload }: { submissionId: string; payload: EvaluateRequest }) =>
      assessmentAPI.evaluate(submissionId, payload),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['assessment', 'grading-submission', variables.submissionId],
      });
    },
  });
}

export function useUnlockSubmission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      submissionId,
      payload = { action: 'APPROVE' },
    }: {
      submissionId: string;
      payload?: UnlockRequest;
    }) => assessmentAPI.unlock(submissionId, payload),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['assessment', 'grading-submission', variables.submissionId],
      });
    },
  });
}
