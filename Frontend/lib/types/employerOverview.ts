import type { ChallengeSummary, SubmissionStatus } from '@/lib/types';

export type OverviewMetricKey =
  | 'activeChallenges'
  | 'pendingReviews'
  | 'unlockedProfiles'
  | 'nextDeadline';
export type TaskKey = 'createChallenge' | 'reviewSubmissions' | 'deadlineSoon';
export type ActivityAction = 'challengeCreated' | 'submissionReceived';
export type BookmarkFilter = 'all' | 'active' | 'endingSoon';
export type SettingsSection = 'profile' | 'members' | 'notifications' | 'appearance' | 'privacy';

export interface ReviewQueueItem {
  submissionId: string;
  challengeId: string;
  challengeTitle: string;
  candidateCode: string;
  status: SubmissionStatus;
  submittedAt?: string;
}

export interface OverviewTask {
  key: TaskKey;
  href: string;
  count?: number;
}

export interface OverviewActivity {
  id: string;
  action: ActivityAction;
  actorName: string;
  actorInitials: string;
  subject: string;
  occurredAt?: string;
  candidateCode?: string;
}

export interface EmployerOverviewData {
  challenges: ChallengeSummary[];
  reviewQueue: ReviewQueueItem[];
  tasks: OverviewTask[];
  activities: OverviewActivity[];
  nextDeadline?: string;
}

export interface WorkspaceSettings {
  workspaceName: string;
  companyName: string;
  memberEmails: string[];
  emailNotifications: boolean;
  reviewNotifications: boolean;
  theme: 'dark' | 'light';
  hideCandidateIdentity: boolean;
  privateWorkspace: boolean;
}

export interface WorkspaceState {
  bookmarkIds: string[];
  settings: WorkspaceSettings;
}
