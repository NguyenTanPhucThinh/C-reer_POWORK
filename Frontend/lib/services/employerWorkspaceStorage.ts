import type { WorkspaceState } from '@/lib/types/employerOverview';

const STORAGE_KEY = 'powork-employer-workspace';
const CHANGE_EVENT = 'powork-employer-workspace-change';

export const DEFAULT_WORKSPACE_STATE: WorkspaceState = {
  bookmarkIds: [],
  settings: {
    workspaceName: 'POWORK Hiring',
    companyName: 'POWORK',
    memberEmails: [],
    emailNotifications: true,
    reviewNotifications: true,
    theme: 'dark',
    hideCandidateIdentity: true,
    privateWorkspace: true,
  },
};

let cachedState = DEFAULT_WORKSPACE_STATE;
let hasLoadedStorage = false;

export function getWorkspaceState(): WorkspaceState {
  if (typeof window === 'undefined') return cachedState;
  if (hasLoadedStorage) return cachedState;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      hasLoadedStorage = true;
      return cachedState;
    }
    const parsed = JSON.parse(raw) as Partial<WorkspaceState>;
    cachedState = {
      bookmarkIds: Array.isArray(parsed.bookmarkIds) ? parsed.bookmarkIds : [],
      settings: { ...DEFAULT_WORKSPACE_STATE.settings, ...parsed.settings },
    };
    hasLoadedStorage = true;
    return cachedState;
  } catch {
    hasLoadedStorage = true;
    return cachedState;
  }
}

export function saveWorkspaceState(state: WorkspaceState) {
  cachedState = state;
  hasLoadedStorage = true;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function subscribeWorkspaceState(callback: () => void) {
  const handleStorage = () => {
    hasLoadedStorage = false;
    getWorkspaceState();
    callback();
  };
  window.addEventListener(CHANGE_EVENT, callback);
  window.addEventListener('storage', handleStorage);
  return () => {
    window.removeEventListener(CHANGE_EVENT, callback);
    window.removeEventListener('storage', handleStorage);
  };
}
