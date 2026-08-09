import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { talentPoolAPI } from '@/lib/api/endpoints';
import type { TalentPoolStatus, TalentPoolEntry } from '@/lib/types';

export const useTalentPool = () => {
  return useQuery<TalentPoolEntry[]>({
    queryKey: ['talent-pool'],
    queryFn: talentPoolAPI.list,
  });
};

export const useUpdateTalentPoolStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ poolId, status }: { poolId: string; status: TalentPoolStatus }) =>
      talentPoolAPI.updateStatus(poolId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['talent-pool'] });
    },
  });
};

export const useAddToTalentPool = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => talentPoolAPI.add({ user_id: userId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['talent-pool'] });
    },
  });
};
