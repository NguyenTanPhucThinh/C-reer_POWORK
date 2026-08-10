import { http, HttpResponse } from 'msw';
import type {
  ApiSuccess,
  EvaluateRequest,
  EvaluateResponse,
  SubmissionGroup,
  SubmissionReceipt,
  UnlockRequest,
  UnlockResponse,
} from '@/lib/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const BASE = `${API_URL}/api/v1/assessment`;

const success = <T>(data: T, message?: string): ApiSuccess<T> => ({
  status: 'success',
  data,
  ...(message ? { message } : {}),
});

const MOCK_SUBMISSION: SubmissionReceipt = {
  submission_id: 'f5e921dd-14bb-421c-a32e-11bc9aef4421',
  hash_id: 'Candidate_9F7A64D4297F45FA1E63B6A027AECE85',
  version: 1,
  submission_method: 'File',
  content_format: null,
  status: 'Pending',
  file_status: 'PendingScan',
  submitted_at: new Date().toISOString(),
};

export const assessmentHandlers = [
  http.post(`${BASE}/submissions`, () => {
    const hashId = `Candidate_${crypto.randomUUID().replace(/-/g, '').toUpperCase()}`;
    const submission: SubmissionReceipt = {
      submission_id: `mock-${Date.now()}`,
      hash_id: hashId,
      version: 1,
      submission_method: 'File',
      content_format: null,
      status: 'Pending',
      file_status: 'PendingScan',
      submitted_at: new Date().toISOString(),
    };
    return HttpResponse.json(success(submission), { status: 201 });
  }),

  http.get(`${BASE}/challenges/:challenge_id/submissions`, () => {
    const groups: SubmissionGroup[] = [
      {
        hash_id: MOCK_SUBMISSION.hash_id,
        is_unlocked: false,
        submissions: [
          {
            submission_id: MOCK_SUBMISSION.submission_id,
            version: MOCK_SUBMISSION.version,
            submission_method: 'File',
            content_format: null,
            status: MOCK_SUBMISSION.status,
            file_status: 'Safe',
            solution_url: 'https://github.com/mock-candidate/solution',
            content: null,
            submitted_at: MOCK_SUBMISSION.submitted_at,
          },
        ],
      },
    ];
    return HttpResponse.json(success(groups), { status: 200 });
  }),

  http.post(`${BASE}/submissions/:submission_id/evaluate`, async ({ params, request }) => {
    const body = (await request.json()) as EvaluateRequest;
    const total = body.evaluations.reduce((sum, e) => sum + (e.score ?? 0), 0);
    const response: EvaluateResponse = {
      submission_id: String(params.submission_id),
      evaluations: body.evaluations,
      general_comment: body.general_comment,
      total_score: total,
      evaluated_at: new Date().toISOString(),
    };
    return HttpResponse.json(success(response), { status: 201 });
  }),

  http.post(`${BASE}/submissions/:submission_id/reject`, ({ params }) => {
    return HttpResponse.json(
      success({ submission_id: String(params.submission_id), status: 'Rejected' as const }),
      { status: 200 }
    );
  }),

  http.post(`${BASE}/submissions/:submission_id/unlock`, async ({ request }) => {
    const body = (await request.json()) as UnlockRequest;
    if (body.action !== 'APPROVE') {
      return HttpResponse.json(
        { status: 'error', error_code: 'ASSESS_001', message: 'action phải là APPROVE' },
        { status: 400 }
      );
    }
    const response: UnlockResponse = {
      message: 'Identity unlocked.',
      unlocked_candidate_profile: {
        user_id: 'de305d54-75b4-431b-adb2-eb6b9e546014',
        full_name: 'Đoàn Tấn Phong',
        email: 'phong.dt@gmail.com',
      },
    };
    return HttpResponse.json(success(response), { status: 200 });
  }),
];
