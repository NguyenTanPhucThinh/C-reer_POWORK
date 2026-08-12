import type { RubricCriteria } from './challenge';

export type SubmissionStatus = 'Pending' | 'Evaluated' | 'Approved' | 'Rejected';
export type FileScanStatus = 'AwaitingUpload' | 'PendingScan' | 'Safe' | 'Rejected' | 'ScanFailed';
export type SubmissionMethod = 'File' | 'Text';
export type SubmissionContentFormat = 'RichText' | 'Markdown';

export type DocumentKind = 'pdf' | 'image' | 'zip' | 'unknown';

export interface ReviewDocument {
  fileName?: string | null;
  url?: string | null;
  kind?: DocumentKind | null;
  mimeType?: string | null;
  fileSize?: number | null;
  description?: string | null;
}

export interface SubmissionReceipt {
  submission_id: string;
  hash_id: string;
  version: number;
  submission_method: SubmissionMethod;
  content_format: SubmissionContentFormat | null;
  status: SubmissionStatus;
  file_status: FileScanStatus | null;
  submitted_at: string;
}

export interface SubmissionVersion {
  submission_id: string;
  version: number;
  submission_method: SubmissionMethod;
  content_format: SubmissionContentFormat | null;
  status: SubmissionStatus;
  file_status: FileScanStatus | null;
  solution_url: string | null;
  content: string | null;
  general_comment?: string | null;
  evaluations?: Array<EvaluationItemInput & { evaluated_at?: string }>;
  submitted_at: string;
}

export interface SubmissionGroup {
  hash_id: string;
  is_unlocked: boolean;
  submissions: SubmissionVersion[];
}

export type SubmitSolutionRequest =
  | { challenge_id: string; submission_method: 'FILE'; solution_url: string }
  | {
      challenge_id: string;
      submission_method: 'TEXT';
      content_format: 'RICH_TEXT' | 'MARKDOWN';
      content: string;
    };

export interface GradingSubmission {
  submission_id: string;
  hash_id: string;
  status: SubmissionStatus;
  challenge_id?: string;
  challenge_title: string;
  submitted_at?: string;
  solution_url?: string | null;
  submission_method: SubmissionMethod;
  content_format?: SubmissionContentFormat | null;
  content?: string | null;
  criteria: RubricCriteria[];
  documents: ReviewDocument[];
  evaluations: EvaluationItemInput[];
  general_comment?: string;
  evaluated_at?: string;
  is_unlocked?: boolean;
  unlocked_candidate_profile?: UnlockedCandidateProfile;
}

export interface EvaluationItemInput {
  criteria_id: string;
  score: number;
  comment?: string;
}

export interface EvaluateRequest {
  evaluations: EvaluationItemInput[];
  general_comment?: string;
}

export interface EvaluateResponse {
  submission_id: string;
  evaluations: EvaluationItemInput[];
  general_comment?: string;
  total_score: number;
  evaluated_at: string;
}

export interface RejectSubmissionResponse {
  submission_id: string;
  status: 'Rejected';
}

export interface UnlockedCandidateProfile {
  user_id: string;
  full_name: string;
  email: string;
}

export interface UnlockResponse {
  message: string;
  unlocked_candidate_profile: UnlockedCandidateProfile;
}

export interface UnlockRequest {
  action: 'APPROVE';
}

export interface GetPresignedUploadUrlRequest {
  challenge_id: string;
  filename: string;
  content_type: string;
}

export interface GetPresignedUploadUrlResponse {
  upload_url: string;
  object_key: string;
  submission_id: string;
  hash_id: string;
  version: number;
  file_status: 'AwaitingUpload';
  expires_in: number;
}

export type VerificationStatus =
  | 'PendingCamera'
  | 'CameraActive'
  | 'GeneratingQuestions'
  | 'Answering'
  | 'PendingUpload'
  | 'PendingScan'
  | 'Ready'
  | 'Rejected'
  | 'ScanFailed'
  | 'Expired';

export type VerificationEvent =
  | 'CAMERA_INTERRUPTED'
  | 'CAMERA_RESTORED'
  | 'FOCUS_LOST'
  | 'PASTE_BLOCKED'
  | 'SELECT_ALL_BLOCKED'
  | 'COPY_BLOCKED'
  | 'DROP_BLOCKED'
  | 'ORAL_STARTED'
  | 'ORAL_COMPLETED'
  | 'ANSWERING_STARTED';

export type OralDurationSeconds = 15 | 30 | 60 | 120;

export interface StartVerificationInput {
  oralDurationSeconds: OralDurationSeconds;
}

export interface VerificationSession {
  verificationId: string;
  submissionId: string;
  status: VerificationStatus;
  verificationCode: string;
  oralDurationSeconds: OralDurationSeconds;
  expiresAt: string;
}

export interface VerificationQuestion {
  questionId: string;
  question: string;
  minimumLength: number;
  maximumLength: number;
}

export interface VerificationQuestions {
  verificationId: string;
  status: VerificationStatus;
  questions: VerificationQuestion[];
}

export interface VerificationRecordingUpload {
  uploadUrl: string;
  objectKey: string;
  expiresIn: number;
}

export interface VerificationAnswer {
  questionId: string;
  answer: string;
}

export interface CompleteVerificationInput {
  objectKey: string;
  recordingMimeType: 'video/webm';
  answers: VerificationAnswer[];
}

export interface VerificationCompletion {
  verificationId: string;
  status: VerificationStatus;
}

export type VerificationSummaryStatus = VerificationStatus | 'NotStarted';
export type VerificationScanStatus =
  | 'NOT_STARTED'
  | 'PENDING'
  | 'SAFE'
  | 'REJECTED'
  | 'SCAN_FAILED';

export interface VerificationSummary {
  status: VerificationSummaryStatus;
  completedAt: string | null;
  questionCount: number;
  scanStatus: VerificationScanStatus;
}

export interface VerificationDashboardStatistics {
  questionCount: number;
  selectedOralDurationSeconds: number;
  actualOralDurationSeconds: number | null;
  cameraInterruptionCount: number;
  cameraInterruptionDurationSeconds: number;
  focusLossCount: number;
  pasteBlockedCount: number;
  selectAllBlockedCount: number;
  copyBlockedCount: number;
  dropBlockedCount: number;
}

export interface VerificationDashboardTimeline {
  createdAt: string;
  oralStartedAt: string | null;
  oralCompletedAt: string | null;
  answeringStartedAt: string | null;
  answeringCompletedAt: string | null;
  completedAt: string | null;
}

export interface VerificationDashboard {
  verificationId: string;
  status: VerificationStatus;
  statistics: VerificationDashboardStatistics;
  timeline: VerificationDashboardTimeline;
  questions: VerificationQuestion[];
  answers: VerificationAnswer[];
  video: {
    status: 'Ready';
    recordingMimeType: string | null;
    recordingSize: number | null;
  };
}

export interface VerificationRecordingAccess {
  recordingUrl: string;
  expiresIn: number;
}
