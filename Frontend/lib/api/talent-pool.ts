import apiClient from './client';
import { TalentPoolEntry, TalentPoolStatus } from '../types/talent-pool';

export const getTalentPool = async (): Promise<TalentPoolEntry[]> => {
  const response = await apiClient.get<TalentPoolEntry[]>('/api/v1/talent-pool');
  return response.data;
};

export const updateTalentPoolStatus = async (
  poolId: string,
  status: TalentPoolStatus
): Promise<void> => {
  await apiClient.patch(`/api/v1/talent-pool/${poolId}/status`, { status });
};

export const addToTalentPool = async (userId: string): Promise<void> => {
  await apiClient.post('/api/v1/talent-pool', { user_id: userId });
};
