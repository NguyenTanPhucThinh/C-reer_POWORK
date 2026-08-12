import { useQuery } from '@tanstack/react-query';
import { dynamicProfileAPI } from '@/lib/api/dynamic-profile';

export function useCandidateProfile(userId: string) {
  return useQuery({
    queryKey: ['candidate-profile', userId],
    queryFn: () => dynamicProfileAPI.getCandidateProfile(userId),
    enabled: Boolean(userId),
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    refetchInterval: 30_000,
  });
}

export function useEvidenceDetail(evidenceId: string, userId: string) {
  return useQuery({
    queryKey: ['candidate-profile', userId, 'evidence', evidenceId],
    queryFn: () => dynamicProfileAPI.getEvidenceDetail(evidenceId, userId),
    enabled: Boolean(evidenceId && userId),
  });
}
