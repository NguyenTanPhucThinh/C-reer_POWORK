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
  StartVerificationInput,
  VerificationSession,
  VerificationStatus,
  VerificationEvent,
  VerificationQuestions,
  VerificationRecordingUpload,
  CompleteVerificationInput,
  VerificationCompletion,
} from '@/lib/types';

interface VerificationSessionResponse {
  verification_id: string;
  submission_id: string;
  verification_status: VerificationStatus;
  verification_code: string;
  oral_duration_seconds: VerificationSession['oralDurationSeconds'];
  expires_at: string;
}

interface VerificationQuestionsResponse {
  verification_id: string;
  verification_status: VerificationStatus;
  questions: Array<{
    question_id: string;
    question: string;
    minimum_length: number;
    maximum_length: number;
  }>;
}

interface VerificationRecordingUploadResponse {
  upload_url: string;
  object_key: string;
  expires_in: number;
}

interface VerificationCompletionResponse {
  verification_id: string;
  verification_status: VerificationStatus;
}

const toVerificationSession = (response: VerificationSessionResponse): VerificationSession => ({
  verificationId: response.verification_id,
  submissionId: response.submission_id,
  status: response.verification_status,
  verificationCode: response.verification_code,
  oralDurationSeconds: response.oral_duration_seconds,
  expiresAt: response.expires_at,
});

const getVerificationSession = (verificationId: string) =>
  unwrap<VerificationSessionResponse>(
    apiClient.get(`/assessment/verifications/${verificationId}`)
  ).then(toVerificationSession);

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
    unwrap<Challenge>(apiClient.post('/challenges', payload, { timeout: 25_000 })),
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
  startVerification: (submissionId: string, payload: StartVerificationInput) =>
    unwrap<VerificationSessionResponse>(
      apiClient.post(`/assessment/submissions/${submissionId}/verification/start`, {
        oral_duration_seconds: payload.oralDurationSeconds,
      })
    ).then(toVerificationSession),
  resumeVerification: getVerificationSession,
  getVerificationStatus: getVerificationSession,
  generateVerificationQuestions: (verificationId: string) =>
    unwrap<VerificationQuestionsResponse>(
      apiClient.post(`/assessment/verifications/${verificationId}/questions`, undefined, {
        timeout: 25_000,
      })
    ).then(
      (response): VerificationQuestions => ({
        verificationId: response.verification_id,
        status: response.verification_status,
        questions: response.questions.map((question) => ({
          questionId: question.question_id,
          question: question.question,
          minimumLength: question.minimum_length,
          maximumLength: question.maximum_length,
        })),
      })
    ),
  sendVerificationEvent: async (verificationId: string, event: VerificationEvent) => {
    await apiClient.post(`/assessment/verifications/${verificationId}/events`, { event });
  },
  requestVerificationRecordingUpload: (verificationId: string) =>
    unwrap<VerificationRecordingUploadResponse>(
      apiClient.post(`/assessment/verifications/${verificationId}/recording-upload`)
    ).then(
      (response): VerificationRecordingUpload => ({
        uploadUrl: response.upload_url,
        objectKey: response.object_key,
        expiresIn: response.expires_in,
      })
    ),
  completeVerification: (verificationId: string, payload: CompleteVerificationInput) =>
    unwrap<VerificationCompletionResponse>(
      apiClient.post(`/assessment/verifications/${verificationId}/complete`, {
        object_key: payload.objectKey,
        recording_mime_type: payload.recordingMimeType,
        answers: payload.answers.map((answer) => ({
          question_id: answer.questionId,
          answer: answer.answer,
        })),
      })
    ).then(
      (response): VerificationCompletion => ({
        verificationId: response.verification_id,
        status: response.verification_status,
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
  add: async (payload: AddToTalentPoolRequest): Promise<void> => {
    await unwrap<null>(apiClient.post('/talent-pool', payload));
  },
  updateStatus: async (poolId: string, status: TalentPoolEntry['status']): Promise<void> => {
    await unwrap<null>(apiClient.patch(`/talent-pool/${poolId}/status`, { status }));
  },
};
