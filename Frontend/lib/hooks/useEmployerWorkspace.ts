'use client';

import { useCallback, useSyncExternalStore } from 'react';
import {
  getWorkspaceState,
  saveWorkspaceState,
  subscribeWorkspaceState,
  DEFAULT_WORKSPACE_STATE,
} from '@/lib/services/employerWorkspaceStorage';
import type { WorkspaceSettings } from '@/lib/types/employerOverview';

export function useEmployerWorkspace() {
  const state = useSyncExternalStore(
    subscribeWorkspaceState,
    getWorkspaceState,
    () => DEFAULT_WORKSPACE_STATE
  );

  const toggleBookmark = useCallback((challengeId: string) => {
    const current = getWorkspaceState();
    const exists = current.bookmarkIds.includes(challengeId);
    saveWorkspaceState({
      ...current,
      bookmarkIds: exists
        ? current.bookmarkIds.filter((id) => id !== challengeId)
        : [...current.bookmarkIds, challengeId],
    });
  }, []);

  const updateSettings = useCallback((settings: Partial<WorkspaceSettings>) => {
    const current = getWorkspaceState();
    saveWorkspaceState({ ...current, settings: { ...current.settings, ...settings } });
  }, []);

  return { ...state, toggleBookmark, updateSettings };
}
