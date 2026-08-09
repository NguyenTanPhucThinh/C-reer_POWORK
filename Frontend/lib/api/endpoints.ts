import { apiClient, authClient, unwrap } from './client';
import type {
  AuthResponse,
  User,
  LoginRequest,
  RegisterRequest,
  Challenge,
  ChallengeSummary,
  CreateChallengeRequest,
  UpdateChallengeStatusRequest,
  SubmissionReceipt,
  SubmissionGroup,
  SubmitSolutionRequest,
  EvaluateRequest,
  EvaluateResponse,
  RejectSubmissionResponse,
  UnlockRequest,
  UnlockResponse,
  GetPresignedUploadUrlRequest,
  GetPresignedUploadUrlResponse,
  Profile,
  TalentPoolEntry,
  AddToTalentPoolRequest,
} from '@/lib/types';

// IAM Module — BFF same-origin /api/auth (set/clear cookie httpOnly)
export const authAPI = {
  login: (payload: LoginRequest) => unwrap<AuthResponse>(authClient.post('/login', payload)),
  register: (payload: RegisterRequest) =>
    unwrap<AuthResponse>(authClient.post('/register', payload)),
  logout: () => unwrap<{ message: string }>(authClient.post('/logout')),
  getMe: () => unwrap<User>(authClient.get('/me')),
};

// Challenge Module — /api/v1/challenges
export const challengeAPI = {
  list: (params?: { industry?: string }) =>
    unwrap<ChallengeSummary[]>(apiClient.get('/challenges', { params })),
  getById: (challengeId: string) => unwrap<Challenge>(apiClient.get(`/challenges/${challengeId}`)),
  create: (payload: CreateChallengeRequest) =>
    unwrap<Challenge>(apiClient.post('/challenges', payload)),
  updateStatus: (challengeId: string, payload: UpdateChallengeStatusRequest) =>
    unwrap<Pick<Challenge, 'challenge_id' | 'status' | 'updated_at'>>(
      apiClient.patch(`/challenges/${challengeId}/status`, payload)
    ),
};

// Assessment Module — /api/v1/assessment (Khu vực cách ly Blind Audition)
export const assessmentAPI = {
  submit: (payload: SubmitSolutionRequest) =>
    unwrap<SubmissionReceipt>(apiClient.post('/assessment/submissions', payload)),
  listByChallenge: (challengeId: string) =>
    unwrap<SubmissionGroup[]>(apiClient.get(`/assessment/challenges/${challengeId}/submissions`)),
  evaluate: (submissionId: string, payload: EvaluateRequest) =>
    unwrap<EvaluateResponse>(
      apiClient.post(`/assessment/submissions/${submissionId}/evaluate`, payload)
    ),
  reject: (submissionId: string) =>
    unwrap<RejectSubmissionResponse>(
      apiClient.post(`/assessment/submissions/${submissionId}/reject`)
    ),
  unlock: (submissionId: string, payload: UnlockRequest = { action: 'APPROVE' }) =>
    unwrap<UnlockResponse>(
      apiClient.post(`/assessment/submissions/${submissionId}/unlock`, payload)
    ),
  getPresignedUploadUrl: (payload: GetPresignedUploadUrlRequest) =>
    unwrap<GetPresignedUploadUrlResponse>(
      apiClient.get(`/assessment/challenges/${payload.challenge_id}/presigned-url`, {
        params: { filename: payload.filename, content_type: payload.content_type },
      })
    ),
};

// Profile Module — /api/v1/profiles
export const profileAPI = {
  getByUserId: (userId: string) => unwrap<Profile>(apiClient.get(`/profiles/${userId}`)),
};

// Talent Pool Module — /api/v1/talent-pool
export const talentPoolAPI = {
  list: () => unwrap<TalentPoolEntry[]>(apiClient.get('/talent-pool')),
  add: (payload: AddToTalentPoolRequest) =>
    unwrap<{ message: string }>(apiClient.post('/talent-pool', payload)),
};
