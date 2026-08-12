'use client';

import axios from 'axios';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { Badge, Button } from '@/components/ui';
import { assessmentAPI } from '@/lib/api/endpoints';
import {
  VERIFICATION_MAX_FILE_BYTES,
  useVerificationRecorder,
  type VerificationRecorderStatus,
} from '@/lib/hooks/useVerificationRecorder';
import type {
  ApiErrorBody,
  CompleteVerificationInput,
  OralDurationSeconds,
  VerificationEvent,
  VerificationQuestion,
  VerificationSession,
  VerificationStatus,
} from '@/lib/types';

type VerificationPhase =
  | 'PREPARING'
  | 'STARTING'
  | 'ORAL_ACTIVE'
  | 'GENERATING_QUESTIONS'
  | 'ANSWERING'
  | 'PREPARING_UPLOAD'
  | 'UPLOADING'
  | 'COMPLETING'
  | 'SCANNING'
  | 'COMPLETED'
  | 'FAILED';

type RetryAction = 'START' | 'RESUME' | null;
type EvidenceRecoveryKind =
  | 'NETWORK'
  | 'PRESIGNED_EXPIRED'
  | 'FILE_TOO_LARGE'
  | 'UPLOAD'
  | 'COMPLETE';

interface EvidenceRecovery {
  kind: EvidenceRecoveryKind;
  message: string;
}

interface VerificationState {
  phase: VerificationPhase;
  oralDurationSeconds: OralDurationSeconds;
  session: VerificationSession | null;
  error: { title: string; message: string } | null;
  retryAction: RetryAction;
  fullscreenMessage: string | null;
  recordingError: string | null;
  oralCompleted: boolean;
  questions: VerificationQuestion[];
  answers: Record<string, string>;
  questionError: string | null;
  notice: string | null;
  recordingObjectKey: string | null;
  uploadProgress: number;
  evidenceUploaded: boolean;
  uploadError: EvidenceRecovery | null;
}

type VerificationAction =
  | { type: 'PREPARE' }
  | { type: 'SELECT_DURATION'; duration: OralDurationSeconds }
  | { type: 'STARTING' }
  | { type: 'SYNC_SESSION'; session: VerificationSession }
  | { type: 'FULLSCREEN_LEFT' }
  | { type: 'FULLSCREEN_RESTORED' }
  | { type: 'FULLSCREEN_FAILED' }
  | { type: 'RECORDING_ERROR'; message: string | null }
  | { type: 'ORAL_COMPLETED_CONFIRMED' }
  | { type: 'QUESTIONS_LOADING' }
  | {
      type: 'QUESTIONS_LOADED';
      questions: VerificationQuestion[];
      status: VerificationStatus;
    }
  | { type: 'QUESTIONS_FAILED'; message: string }
  | { type: 'ANSWER_CHANGED'; questionId: string; answer: string }
  | { type: 'SHOW_NOTICE'; message: string }
  | { type: 'CLEAR_NOTICE' }
  | { type: 'EVIDENCE_SUBMITTING' }
  | { type: 'UPLOAD_TARGET_RECEIVED'; objectKey: string }
  | { type: 'UPLOAD_PROGRESS'; progress: number }
  | { type: 'UPLOAD_SUCCEEDED' }
  | { type: 'COMPLETE_STARTED' }
  | { type: 'EVIDENCE_FAILED'; error: EvidenceRecovery }
  | { type: 'SCAN_STARTED'; session: VerificationSession }
  | { type: 'SCAN_POLL_ERROR'; message: string }
  | { type: 'SCAN_POLL_RECOVERED' }
  | {
      type: 'FAIL';
      error: VerificationState['error'];
      retryAction?: Exclude<RetryAction, null>;
    };

const STATUS_PHASE: Record<VerificationStatus, VerificationPhase> = {
  PendingCamera: 'PREPARING',
  CameraActive: 'ORAL_ACTIVE',
  GeneratingQuestions: 'GENERATING_QUESTIONS',
  Answering: 'ANSWERING',
  PendingUpload: 'PREPARING_UPLOAD',
  PendingScan: 'SCANNING',
  Ready: 'COMPLETED',
  Rejected: 'FAILED',
  ScanFailed: 'FAILED',
  Expired: 'FAILED',
};

const PHASE_LABEL: Record<VerificationPhase, string> = {
  PREPARING: 'Chuẩn bị',
  STARTING: 'Đang khởi tạo',
  ORAL_ACTIVE: 'Đang ghi hình',
  GENERATING_QUESTIONS: 'Đang tạo câu hỏi',
  ANSWERING: 'Đang trả lời',
  PREPARING_UPLOAD: 'Chuẩn bị tải lên',
  UPLOADING: 'Đang tải video',
  COMPLETING: 'Đang hoàn tất',
  SCANNING: 'Đang quét an toàn',
  COMPLETED: 'Đã hoàn tất',
  FAILED: 'Không thể tiếp tục',
};

const DURATION_OPTIONS: Array<{ value: OralDurationSeconds; label: string }> = [
  { value: 15, label: '15 giây' },
  { value: 30, label: '30 giây' },
  { value: 60, label: '1 phút' },
  { value: 120, label: '2 phút' },
];

const VERIFICATION_STEPS = ['Chuẩn bị', 'Trình bày', 'Tự luận', 'Gửi bài', 'Hoàn tất'] as const;

function phaseStepIndex(phase: VerificationPhase, status?: VerificationStatus): number {
  if (phase === 'STARTING' || phase === 'PREPARING') return 0;
  if (phase === 'ORAL_ACTIVE') return 1;
  if (phase === 'GENERATING_QUESTIONS' || phase === 'ANSWERING') return 2;
  if (
    phase === 'PREPARING_UPLOAD' ||
    phase === 'UPLOADING' ||
    phase === 'COMPLETING' ||
    phase === 'SCANNING'
  ) {
    return 3;
  }
  return phase === 'COMPLETED' ||
    status === 'Rejected' ||
    status === 'ScanFailed' ||
    status === 'Expired'
    ? 4
    : 0;
}

const FOCUS_TRACKING_PHASES = new Set<VerificationPhase>([
  'ORAL_ACTIVE',
  'GENERATING_QUESTIONS',
  'ANSWERING',
]);

const initialState: VerificationState = {
  phase: 'STARTING',
  oralDurationSeconds: 60,
  session: null,
  error: null,
  retryAction: null,
  fullscreenMessage: null,
  recordingError: null,
  oralCompleted: false,
  questions: [],
  answers: {},
  questionError: null,
  notice: null,
  recordingObjectKey: null,
  uploadProgress: 0,
  evidenceUploaded: false,
  uploadError: null,
};

function verificationReducer(
  state: VerificationState,
  action: VerificationAction
): VerificationState {
  switch (action.type) {
    case 'PREPARE':
      return {
        ...state,
        phase: 'PREPARING',
        error: null,
        retryAction: null,
        fullscreenMessage: null,
        recordingError: null,
        oralCompleted: false,
        questions: [],
        answers: {},
        questionError: null,
        recordingObjectKey: null,
        uploadProgress: 0,
        evidenceUploaded: false,
        uploadError: null,
      };
    case 'SELECT_DURATION':
      return { ...state, oralDurationSeconds: action.duration };
    case 'STARTING':
      return { ...state, phase: 'STARTING', error: null, retryAction: null };
    case 'SYNC_SESSION':
      return {
        ...state,
        phase: STATUS_PHASE[action.session.status],
        oralDurationSeconds: action.session.oralDurationSeconds,
        session: action.session,
        error: terminalError(action.session.status),
        retryAction: null,
        recordingError: null,
        oralCompleted: false,
      };
    case 'FULLSCREEN_LEFT':
      return {
        ...state,
        fullscreenMessage:
          'Bạn đã rời chế độ toàn màn hình. Hãy quay lại trước khi tiếp tục xác thực.',
      };
    case 'FULLSCREEN_RESTORED':
      return { ...state, fullscreenMessage: null };
    case 'FULLSCREEN_FAILED':
      return {
        ...state,
        fullscreenMessage:
          'Trình duyệt chưa cho phép toàn màn hình. Hãy cấp quyền rồi bấm thử lại.',
      };
    case 'RECORDING_ERROR':
      return { ...state, recordingError: action.message };
    case 'ORAL_COMPLETED_CONFIRMED':
      return { ...state, oralCompleted: true, recordingError: null };
    case 'QUESTIONS_LOADING':
      return { ...state, phase: 'GENERATING_QUESTIONS', questionError: null };
    case 'QUESTIONS_LOADED':
      return {
        ...state,
        phase: STATUS_PHASE[action.status],
        session: state.session ? { ...state.session, status: action.status } : null,
        questions: action.questions,
        questionError: null,
      };
    case 'QUESTIONS_FAILED':
      return { ...state, phase: 'ORAL_ACTIVE', questionError: action.message };
    case 'ANSWER_CHANGED':
      return {
        ...state,
        answers: { ...state.answers, [action.questionId]: action.answer },
      };
    case 'SHOW_NOTICE':
      return { ...state, notice: action.message };
    case 'CLEAR_NOTICE':
      return { ...state, notice: null };
    case 'EVIDENCE_SUBMITTING':
      return { ...state, phase: 'PREPARING_UPLOAD', uploadError: null };
    case 'UPLOAD_TARGET_RECEIVED':
      return {
        ...state,
        recordingObjectKey: action.objectKey,
      };
    case 'UPLOAD_PROGRESS':
      return { ...state, phase: 'UPLOADING', uploadProgress: action.progress };
    case 'UPLOAD_SUCCEEDED':
      return { ...state, phase: 'COMPLETING', uploadProgress: 100, evidenceUploaded: true };
    case 'COMPLETE_STARTED':
      return { ...state, phase: 'COMPLETING', uploadError: null };
    case 'EVIDENCE_FAILED':
      return { ...state, phase: 'PREPARING_UPLOAD', uploadError: action.error };
    case 'SCAN_STARTED':
      return {
        ...state,
        phase: 'SCANNING',
        session: action.session,
        uploadError: null,
      };
    case 'SCAN_POLL_ERROR':
      return {
        ...state,
        uploadError: { kind: 'NETWORK', message: action.message },
      };
    case 'SCAN_POLL_RECOVERED':
      return { ...state, uploadError: null };
    case 'FAIL':
      return {
        ...state,
        phase: 'FAILED',
        error: action.error,
        retryAction: action.retryAction ?? null,
      };
  }
}

function terminalError(status: VerificationStatus): VerificationState['error'] {
  if (status === 'Expired') {
    return {
      title: 'Phiên xác thực đã hết hạn',
      message: 'Phiên này không còn nhận thao tác mới. Vui lòng quay lại danh sách bài nộp.',
    };
  }
  if (status === 'Rejected') {
    return {
      title: 'Video xác thực không được chấp nhận',
      message: 'Tệp ghi hình không vượt qua bước kiểm tra an toàn.',
    };
  }
  if (status === 'ScanFailed') {
    return {
      title: 'Chưa thể kiểm tra video',
      message: 'Hệ thống quét an toàn gặp lỗi và không xem đây là một lần xác thực thành công.',
    };
  }
  return null;
}

function getSubmissionId(params: ReturnType<typeof useParams>): string {
  const value = params?.id;
  return Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
}

function sessionStorageKey(submissionId: string): string {
  return `powork:verification:${submissionId}`;
}

function describeError(error: unknown): { title: string; message: string; retryable: boolean } {
  if (!axios.isAxiosError<ApiErrorBody>(error)) {
    return {
      title: 'Không thể kết nối hệ thống',
      message: 'Vui lòng kiểm tra kết nối và thử lại.',
      retryable: true,
    };
  }

  const code = error.response?.data?.error_code;
  if (code === 'VERIFICATION_EXPIRED') {
    return {
      title: 'Phiên xác thực đã hết hạn',
      message: error.response?.data?.message ?? 'Phiên này không còn nhận thao tác mới.',
      retryable: false,
    };
  }
  if (code === 'VERIFICATION_FORBIDDEN') {
    return {
      title: 'Bạn không có quyền truy cập',
      message: 'Bài nộp hoặc phiên xác thực này không thuộc tài khoản Candidate hiện tại.',
      retryable: false,
    };
  }
  if (code === 'VERIFICATION_NOT_FOUND') {
    return {
      title: 'Không tìm thấy bài nộp hoặc phiên xác thực',
      message: 'Dữ liệu có thể đã thay đổi. Vui lòng quay lại danh sách bài nộp.',
      retryable: false,
    };
  }
  if (code === 'VERIFICATION_ALREADY_COMPLETED') {
    return {
      title: 'Phiên xác thực đã kết thúc',
      message: error.response?.data?.message ?? 'Phiên này không thể bắt đầu lại.',
      retryable: false,
    };
  }

  return {
    title: error.response ? 'Hệ thống chưa thể xử lý yêu cầu' : 'Không thể kết nối hệ thống',
    message:
      error.response?.data?.message ??
      'Không nhận được phản hồi từ máy chủ. Dữ liệu của bạn vẫn được giữ nguyên.',
    retryable: !error.response || (error.response.status >= 500 && error.response.status < 600),
  };
}

function describeMediaError(error: unknown): string {
  if (error instanceof DOMException && error.name === 'NotAllowedError') {
    return 'Quyền camera hoặc microphone đã bị từ chối. Hãy cấp quyền trong cài đặt trình duyệt rồi thử lại.';
  }
  return error instanceof Error
    ? error.message
    : 'Không thể chuẩn bị camera và microphone cho phiên xác thực.';
}

function isRetryableEventError(error: unknown): boolean {
  return (
    axios.isAxiosError(error) &&
    (!error.response || error.response.status === 429 || error.response.status >= 500)
  );
}

async function sendVerificationEventWithRetry(
  verificationId: string,
  event: VerificationEvent,
  maximumAttempts: number
): Promise<void> {
  for (let attempt = 1; attempt <= maximumAttempts; attempt += 1) {
    try {
      await assessmentAPI.sendVerificationEvent(verificationId, event);
      return;
    } catch (error) {
      if (attempt === maximumAttempts || !isRetryableEventError(error)) throw error;
      await new Promise((resolve) => window.setTimeout(resolve, attempt * 250));
    }
  }
}

function uploadRecordingBlob(
  uploadUrl: string,
  blob: Blob,
  onProgress: (progress: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open('PUT', uploadUrl);
    request.setRequestHeader('Content-Type', 'video/webm');
    request.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100));
    };
    request.onload = () => {
      if (request.status >= 200 && request.status < 300) resolve();
      else if (request.status === 401 || request.status === 403) {
        reject(
          new DOMException(
            'Liên kết tải video đã hết hạn. Video vẫn được giữ để bạn thử lại.',
            'PresignedUrlExpiredError'
          )
        );
      } else reject(new Error(`Chưa thể tải video lên kho lưu trữ (mã ${request.status}).`));
    };
    request.onerror = () =>
      reject(
        new DOMException(
          'Mất kết nối trong khi tải video. Video và câu trả lời vẫn được giữ trong tab này.',
          'NetworkError'
        )
      );
    request.onabort = () => reject(new Error('Quá trình tải video đã bị gián đoạn.'));
    request.send(blob);
  });
}

function describeEvidenceError(error: unknown, stage: 'UPLOAD' | 'COMPLETE'): EvidenceRecovery {
  if (error instanceof DOMException && error.name === 'PresignedUrlExpiredError') {
    return { kind: 'PRESIGNED_EXPIRED', message: error.message };
  }
  if (error instanceof DOMException && error.name === 'FileTooLargeError') {
    return { kind: 'FILE_TOO_LARGE', message: error.message };
  }
  if (
    (error instanceof DOMException && error.name === 'NetworkError') ||
    (axios.isAxiosError(error) && !error.response)
  ) {
    return {
      kind: 'NETWORK',
      message: 'Không thể kết nối hệ thống. Video và câu trả lời vẫn được giữ trong tab này.',
    };
  }
  return {
    kind: stage,
    message: axios.isAxiosError(error)
      ? describeError(error).message
      : error instanceof Error
        ? error.message
        : 'Không thể hoàn tất xác thực. Dữ liệu trong tab này vẫn được giữ nguyên.',
  };
}

function isAlreadyCompletedError(error: unknown): boolean {
  return (
    axios.isAxiosError<ApiErrorBody>(error) &&
    error.response?.data?.error_code === 'VERIFICATION_ALREADY_COMPLETED'
  );
}

export default function CandidateVerificationPage() {
  const submissionId = getSubmissionId(useParams());
  const [state, dispatch] = useReducer(verificationReducer, initialState);
  const [rulesAccepted, setRulesAccepted] = useState(false);
  const transitionLock = useRef(false);
  const lastFocusLossAt = useRef(0);
  const recorder = useVerificationRecorder();
  const oralStartedId = useRef<string | null>(null);
  const oralCompletedId = useRef<string | null>(null);
  const oralStartRequest = useRef<{ id: string; promise: Promise<void> } | null>(null);
  const oralCompleteRequest = useRef<{ id: string; promise: Promise<void> } | null>(null);
  const cameraInterruptedId = useRef<string | null>(null);
  const cameraInterruptionRequest = useRef<{ id: string; promise: Promise<void> } | null>(null);
  const questionsLoadedId = useRef<string | null>(null);
  const questionRequest = useRef<{ id: string; promise: Promise<void> } | null>(null);
  const lastBlockedAction = useRef<{ event: VerificationEvent; at: number } | null>(null);
  const evidenceSubmissionLock = useRef(false);
  const completeRequest = useRef<{ id: string; promise: Promise<void> } | null>(null);

  const fail = useCallback((error: unknown, retryAction: Exclude<RetryAction, null>) => {
    const detail = describeError(error);
    dispatch({
      type: 'FAIL',
      error: { title: detail.title, message: detail.message },
      retryAction: detail.retryable ? retryAction : undefined,
    });
  }, []);

  const sendOralStarted = useCallback((verificationId: string) => {
    if (oralStartedId.current === verificationId) return Promise.resolve();
    if (oralStartRequest.current?.id === verificationId) {
      return oralStartRequest.current.promise;
    }

    const request: Promise<void> = sendVerificationEventWithRetry(verificationId, 'ORAL_STARTED', 3)
      .then(() => {
        oralStartedId.current = verificationId;
      })
      .finally(() => {
        if (oralStartRequest.current?.promise === request) oralStartRequest.current = null;
      });
    oralStartRequest.current = { id: verificationId, promise: request };
    return request;
  }, []);

  const sendOralCompleted = useCallback((verificationId: string) => {
    if (oralCompletedId.current === verificationId) return Promise.resolve();
    if (oralCompleteRequest.current?.id === verificationId) {
      return oralCompleteRequest.current.promise;
    }

    const request: Promise<void> = sendVerificationEventWithRetry(
      verificationId,
      'ORAL_COMPLETED',
      3
    )
      .then(() => {
        oralCompletedId.current = verificationId;
      })
      .finally(() => {
        if (oralCompleteRequest.current?.promise === request) oralCompleteRequest.current = null;
      });
    oralCompleteRequest.current = { id: verificationId, promise: request };
    return request;
  }, []);

  const sendCameraInterrupted = useCallback((verificationId: string) => {
    if (cameraInterruptedId.current === verificationId) return;
    cameraInterruptedId.current = verificationId;

    const request = sendVerificationEventWithRetry(verificationId, 'CAMERA_INTERRUPTED', 2).catch(
      (error) => {
        if (cameraInterruptedId.current === verificationId) cameraInterruptedId.current = null;
        dispatch({ type: 'RECORDING_ERROR', message: describeError(error).message });
      }
    );
    cameraInterruptionRequest.current = { id: verificationId, promise: request };
  }, []);

  const sendCameraRestored = useCallback(async (verificationId: string) => {
    if (cameraInterruptedId.current !== verificationId) return;
    if (cameraInterruptionRequest.current?.id === verificationId) {
      await cameraInterruptionRequest.current.promise;
    }
    if (cameraInterruptedId.current !== verificationId) return;

    try {
      await sendVerificationEventWithRetry(verificationId, 'CAMERA_RESTORED', 2);
      cameraInterruptedId.current = null;
      cameraInterruptionRequest.current = null;
    } catch (error) {
      dispatch({ type: 'RECORDING_ERROR', message: describeError(error).message });
    }
  }, []);

  const loadQuestions = useCallback((verificationId: string) => {
    if (questionsLoadedId.current === verificationId) return Promise.resolve();
    if (questionRequest.current?.id === verificationId) return questionRequest.current.promise;

    dispatch({ type: 'QUESTIONS_LOADING' });
    const request: Promise<void> = assessmentAPI
      .generateVerificationQuestions(verificationId)
      .then((result) => {
        questionsLoadedId.current = verificationId;
        dispatch({
          type: 'QUESTIONS_LOADED',
          questions: result.questions,
          status: result.status,
        });
      })
      .catch((error) => {
        dispatch({ type: 'QUESTIONS_FAILED', message: describeError(error).message });
      })
      .finally(() => {
        if (questionRequest.current?.promise === request) questionRequest.current = null;
      });
    questionRequest.current = { id: verificationId, promise: request };
    return request;
  }, []);

  const completeEvidenceOnce = useCallback(
    (verificationId: string, payload: CompleteVerificationInput) => {
      if (completeRequest.current?.id === verificationId) return completeRequest.current.promise;

      const request: Promise<void> = assessmentAPI
        .completeVerification(verificationId, payload)
        .then(() => undefined)
        .finally(() => {
          if (completeRequest.current?.promise === request) completeRequest.current = null;
        });
      completeRequest.current = { id: verificationId, promise: request };
      return request;
    },
    []
  );

  const reportBlockedAction = useCallback(
    (
      event: Extract<
        VerificationEvent,
        'PASTE_BLOCKED' | 'COPY_BLOCKED' | 'DROP_BLOCKED' | 'SELECT_ALL_BLOCKED'
      >
    ) => {
      const now = Date.now();
      if (lastBlockedAction.current?.event === event && now - lastBlockedAction.current.at < 500) {
        return;
      }
      lastBlockedAction.current = { event, at: now };

      const message =
        event === 'PASTE_BLOCKED'
          ? 'Dán nội dung đã bị chặn. Vui lòng tự nhập câu trả lời.'
          : event === 'COPY_BLOCKED'
            ? 'Sao chép nội dung đã bị chặn trong phần trả lời.'
            : event === 'DROP_BLOCKED'
              ? 'Thả nội dung vào câu trả lời đã bị chặn.'
              : 'Chọn toàn bộ nội dung đã bị chặn.';
      dispatch({ type: 'SHOW_NOTICE', message });

      const verificationId = state.session?.verificationId;
      if (verificationId) {
        void sendVerificationEventWithRetry(verificationId, event, 2).catch(() => undefined);
      }
    },
    [state.session?.verificationId]
  );

  const resumeSession = useCallback(async () => {
    if (!submissionId || transitionLock.current) return;

    const storedVerificationId = sessionStorage.getItem(sessionStorageKey(submissionId));
    if (!storedVerificationId) {
      dispatch({ type: 'PREPARE' });
      return;
    }

    transitionLock.current = true;
    dispatch({ type: 'STARTING' });
    try {
      const session = await assessmentAPI.resumeVerification(storedVerificationId);
      if (session.submissionId !== submissionId) {
        sessionStorage.removeItem(sessionStorageKey(submissionId));
        dispatch({
          type: 'FAIL',
          error: {
            title: 'Phiên xác thực không khớp',
            message: 'Phiên đã lưu không thuộc bài nộp đang mở.',
          },
        });
        return;
      }
      if (session.status === 'CameraActive') oralStartedId.current = session.verificationId;
      dispatch({ type: 'SYNC_SESSION', session });
      if (session.status === 'GeneratingQuestions' || session.status === 'Answering') {
        void loadQuestions(session.verificationId);
      }
      const resumedPhase = STATUS_PHASE[session.status];
      if (
        resumedPhase !== 'COMPLETED' &&
        resumedPhase !== 'FAILED' &&
        !document.fullscreenElement
      ) {
        dispatch({ type: 'FULLSCREEN_LEFT' });
      }
    } catch (error) {
      fail(error, 'RESUME');
    } finally {
      transitionLock.current = false;
    }
  }, [fail, loadQuestions, submissionId]);

  useEffect(() => {
    void resumeSession();
  }, [resumeSession]);

  async function startSession() {
    if (!submissionId || !rulesAccepted || transitionLock.current) return;

    transitionLock.current = true;
    dispatch({ type: 'STARTING' });

    try {
      if (!document.fullscreenEnabled) {
        throw new DOMException('Fullscreen is not available', 'NotSupportedError');
      }
      await document.documentElement.requestFullscreen();
      dispatch({ type: 'FULLSCREEN_RESTORED' });
    } catch {
      dispatch({
        type: 'FAIL',
        error: {
          title: 'Chưa thể mở chế độ toàn màn hình',
          message:
            'Trình duyệt đã từ chối yêu cầu. Hãy cho phép toàn màn hình cho trang này rồi thử lại.',
        },
        retryAction: 'START',
      });
      transitionLock.current = false;
      return;
    }

    let session: VerificationSession;
    try {
      await recorder.prepareMedia();
      session = await assessmentAPI.startVerification(submissionId, {
        oralDurationSeconds: state.oralDurationSeconds,
      });
      sessionStorage.setItem(sessionStorageKey(submissionId), session.verificationId);
      dispatch({ type: 'SYNC_SESSION', session });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        fail(error, 'START');
      } else {
        dispatch({
          type: 'FAIL',
          error: {
            title: 'Camera hoặc microphone chưa sẵn sàng',
            message: describeMediaError(error),
          },
          retryAction: 'START',
        });
      }
      recorder.releaseMedia();
      if (document.fullscreenElement) await document.exitFullscreen().catch(() => undefined);
      transitionLock.current = false;
      return;
    }

    await beginRecording(session, true);
    transitionLock.current = false;
  }

  const hasSession = state.session !== null;
  const isSessionInProgress = hasSession && state.phase !== 'COMPLETED' && state.phase !== 'FAILED';
  const isEvidenceSubmitting = ['PREPARING_UPLOAD', 'UPLOADING', 'COMPLETING', 'SCANNING'].includes(
    state.phase
  );
  const badgeVariant =
    state.phase === 'COMPLETED' ? 'done' : state.phase === 'FAILED' ? 'fail' : 'blind';

  async function restoreFullscreen() {
    try {
      await document.documentElement.requestFullscreen();
      dispatch({ type: 'FULLSCREEN_RESTORED' });
    } catch {
      dispatch({ type: 'FULLSCREEN_FAILED' });
    }
  }

  async function beginRecording(session: VerificationSession, mediaIsPrepared = false) {
    if (session.status === 'CameraActive') oralStartedId.current = session.verificationId;
    dispatch({ type: 'RECORDING_ERROR', message: null });

    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        dispatch({ type: 'FULLSCREEN_RESTORED' });
      }
      if (!mediaIsPrepared) await recorder.prepareMedia();
      await sendOralStarted(session.verificationId);
      const activeSession = { ...session, status: 'CameraActive' as const };
      dispatch({ type: 'SYNC_SESSION', session: activeSession });
      recorder.startRecording(session.oralDurationSeconds, {
        onStarted: () => undefined,
        onStopped: () => {
          void confirmOralCompleted(session.verificationId);
        },
        onCameraInterrupted: () => sendCameraInterrupted(session.verificationId),
        onCameraRestored: () => void sendCameraRestored(session.verificationId),
        onError: (message) => dispatch({ type: 'RECORDING_ERROR', message }),
      });
    } catch (error) {
      if (oralStartedId.current === session.verificationId) {
        sendCameraInterrupted(session.verificationId);
      }
      recorder.releaseMedia();
      dispatch({
        type: 'RECORDING_ERROR',
        message: axios.isAxiosError(error)
          ? describeError(error).message
          : describeMediaError(error),
      });
    }
  }

  async function confirmOralCompleted(verificationId: string) {
    try {
      await sendOralCompleted(verificationId);
      dispatch({ type: 'ORAL_COMPLETED_CONFIRMED' });
      await loadQuestions(verificationId);
    } catch (error) {
      dispatch({ type: 'RECORDING_ERROR', message: describeError(error).message });
    }
  }

  async function startExistingRecording(session: VerificationSession) {
    if (transitionLock.current) return;
    transitionLock.current = true;
    await beginRecording(session);
    transitionLock.current = false;
  }

  async function submitVerificationEvidence() {
    if (evidenceSubmissionLock.current || !state.session) return;
    evidenceSubmissionLock.current = true;
    dispatch({ type: 'EVIDENCE_SUBMITTING' });

    const answers = state.questions.map((question) => ({
      questionId: question.questionId,
      answer: state.answers[question.questionId] ?? '',
    }));
    const invalidAnswer = state.questions.some((question) => {
      const length = (state.answers[question.questionId] ?? '').length;
      return length < question.minimumLength || length > question.maximumLength;
    });
    const blob = recorder.recordingBlob;
    let stage: 'UPLOAD' | 'COMPLETE' = state.evidenceUploaded ? 'COMPLETE' : 'UPLOAD';

    try {
      if (state.questions.length === 0 || invalidAnswer) {
        throw new Error('Vui lòng hoàn thành tất cả câu trả lời đúng giới hạn ký tự.');
      }
      recorder.releaseMedia();
      if (!blob || blob.size === 0) {
        throw new Error('Không tìm thấy video ghi hình hợp lệ để tải lên.');
      }
      if (blob.type !== 'video/webm') {
        throw new Error('Video ghi hình không đúng định dạng WebM.');
      }
      if (blob.size > VERIFICATION_MAX_FILE_BYTES) {
        throw new DOMException(
          `Video vượt quá giới hạn ${formatFileSize(VERIFICATION_MAX_FILE_BYTES)} nên chưa được upload.`,
          'FileTooLargeError'
        );
      }

      let objectKey = state.recordingObjectKey;
      if (!state.evidenceUploaded) {
        const upload = await assessmentAPI.requestVerificationRecordingUpload(
          state.session.verificationId
        );
        if (objectKey && upload.objectKey !== objectKey) {
          throw new Error('Phiên gửi video chưa đồng bộ. Vui lòng thử lại.');
        }
        objectKey = upload.objectKey;
        dispatch({
          type: 'UPLOAD_TARGET_RECEIVED',
          objectKey,
        });
        await uploadRecordingBlob(upload.uploadUrl, blob, (progress) =>
          dispatch({ type: 'UPLOAD_PROGRESS', progress })
        );
        dispatch({ type: 'UPLOAD_SUCCEEDED' });
      }

      if (!objectKey) throw new Error('Chưa thể chuẩn bị vị trí lưu video. Vui lòng thử lại.');
      stage = 'COMPLETE';
      dispatch({ type: 'COMPLETE_STARTED' });
      try {
        await completeEvidenceOnce(state.session.verificationId, {
          objectKey,
          recordingMimeType: 'video/webm',
          answers,
        });
      } catch (error) {
        if (!isAlreadyCompletedError(error)) throw error;
      }

      const currentSession = await assessmentAPI.getVerificationStatus(
        state.session.verificationId
      );
      if (currentSession.status === 'PendingScan') {
        dispatch({ type: 'SCAN_STARTED', session: currentSession });
      } else {
        dispatch({ type: 'SYNC_SESSION', session: currentSession });
      }
    } catch (error) {
      dispatch({ type: 'EVIDENCE_FAILED', error: describeEvidenceError(error, stage) });
    } finally {
      evidenceSubmissionLock.current = false;
    }
  }

  useEffect(() => {
    if (!isSessionInProgress) return;

    const handleFullscreenChange = () => {
      dispatch({ type: document.fullscreenElement ? 'FULLSCREEN_RESTORED' : 'FULLSCREEN_LEFT' });
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [isSessionInProgress]);

  useEffect(() => {
    if (state.phase !== 'SCANNING' || !state.session) return;
    const verificationId = state.session.verificationId;
    let cancelled = false;
    let timer: number | null = null;

    const poll = async () => {
      try {
        const session = await assessmentAPI.getVerificationStatus(verificationId);
        if (cancelled) return;
        if (session.status === 'PendingScan') {
          dispatch({ type: 'SCAN_POLL_RECOVERED' });
          timer = window.setTimeout(poll, 1500);
        } else {
          dispatch({ type: 'SYNC_SESSION', session });
        }
      } catch {
        if (cancelled) return;
        dispatch({
          type: 'SCAN_POLL_ERROR',
          message: 'Tạm thời chưa đọc được trạng thái quét. Hệ thống sẽ tự thử lại.',
        });
        timer = window.setTimeout(poll, 2000);
      }
    };

    timer = window.setTimeout(poll, 1000);
    return () => {
      cancelled = true;
      if (timer !== null) window.clearTimeout(timer);
    };
  }, [state.phase, state.session]);

  useEffect(() => {
    if (!state.notice) return;
    const timer = window.setTimeout(() => dispatch({ type: 'CLEAR_NOTICE' }), 3600);
    return () => window.clearTimeout(timer);
  }, [state.notice]);

  useEffect(() => {
    if (!state.session || !FOCUS_TRACKING_PHASES.has(state.phase)) return;
    const verificationId = state.session.verificationId;

    const reportFocusLoss = () => {
      const now = Date.now();
      if (now - lastFocusLossAt.current < 750) return;
      lastFocusLossAt.current = now;
      void sendVerificationEventWithRetry(verificationId, 'FOCUS_LOST', 2).catch(() => undefined);
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') reportFocusLoss();
    };

    window.addEventListener('blur', reportFocusLoss);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      window.removeEventListener('blur', reportFocusLoss);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [state.phase, state.session]);

  useEffect(() => {
    if (!isSessionInProgress) return;

    const warnBeforeLeaving = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warnBeforeLeaving);
    return () => window.removeEventListener('beforeunload', warnBeforeLeaving);
  }, [isSessionInProgress]);

  return (
    <div className="min-h-screen bg-background px-4 py-4 text-foreground selection:bg-accent-bg selection:text-accent sm:px-6 sm:py-6 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <header className="rounded-2xl border-hairline border-border bg-background-secondary p-5 shadow-[var(--shadow-surface)] sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">
                POWORK · Xác thực ứng viên
              </p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl lg:text-4xl">
                Xác thực sau khi nộp bài
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-foreground-secondary">
                Hãy giữ trang này mở cho đến khi bạn nhận được thông báo hoàn tất.
              </p>
            </div>
            <Badge variant={badgeVariant} className="w-fit shrink-0 px-3 py-1 text-xs">
              {PHASE_LABEL[state.phase]}
            </Badge>
          </div>
          <VerificationStepProgress phase={state.phase} status={state.session?.status} />
        </header>

        <main
          key={state.phase}
          className="animate-in py-6 fade-in slide-in-from-bottom-2 duration-300 motion-reduce:animate-none motion-reduce:transition-none sm:py-8"
        >
          {isSessionInProgress && (
            <section className="mb-5 flex gap-4 rounded-xl border border-accent/35 bg-accent-bg/70 p-4 shadow-sm sm:p-5">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-lg font-bold text-white shadow-sm"
                aria-hidden="true"
              >
                i
              </div>
              <div>
                <h2 className="font-semibold text-foreground">Giữ phiên làm bài ổn định</h2>
                <p className="mt-1 text-sm leading-6 text-foreground-secondary">
                  Hãy duy trì chế độ toàn màn hình, giữ camera hoạt động và tập trung hoàn thành
                  từng bước. Việc đóng hoặc tải lại trang có thể làm gián đoạn phần bài đang thực
                  hiện.
                </p>
              </div>
            </section>
          )}

          {isSessionInProgress && state.fullscreenMessage && (
            <section
              className="mb-5 flex flex-col gap-4 rounded-xl border border-warning bg-warning-bg p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
              role="alert"
            >
              <div>
                <p className="font-semibold text-warning">Đã rời chế độ toàn màn hình</p>
                <p className="mt-1 text-sm text-foreground-secondary">{state.fullscreenMessage}</p>
              </div>
              <Button type="button" variant="primary" onClick={() => void restoreFullscreen()}>
                Quay lại toàn màn hình
              </Button>
            </section>
          )}

          {state.phase === 'STARTING' && !submissionId && (
            <section
              className="rounded-2xl border border-warning bg-warning-bg p-8 text-center shadow-[var(--shadow-surface)]"
              role="alert"
            >
              <h2 className="text-xl font-semibold">Không xác định được bài nộp</h2>
              <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-foreground-secondary">
                Đường dẫn này không chứa mã Submission hợp lệ. Hãy quay lại danh sách và mở lại bài
                nộp cần xác thực.
              </p>
              <Link
                href="/candidate/my-submissions"
                className="mt-6 inline-flex rounded-lg text-sm font-semibold text-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
              >
                Quay lại bài nộp của tôi
              </Link>
            </section>
          )}

          {state.phase === 'STARTING' && submissionId && (
            <section
              className="rounded-2xl border-hairline border-border bg-background-secondary p-8 text-center shadow-[var(--shadow-surface)] sm:p-12"
              aria-live="polite"
            >
              <div
                className="mx-auto h-10 w-10 animate-spin rounded-full border-[3px] border-border border-t-accent motion-reduce:animate-none"
                aria-hidden="true"
              />
              <h2 className="mt-5 text-xl font-semibold">Đang kiểm tra phiên xác thực...</h2>
              <p className="mt-2 text-sm text-foreground-secondary">
                Hệ thống đang khởi tạo hoặc khôi phục đúng bước gần nhất.
              </p>
            </section>
          )}

          {state.phase === 'PREPARING' && !hasSession && (
            <section className="rounded-2xl border-hairline border-border bg-background-secondary p-6 shadow-[var(--shadow-surface)] sm:p-8">
              <p className="text-xs font-semibold uppercase tracking-wider text-accent">
                Bước chuẩn bị
              </p>
              <h2 className="mt-2 text-2xl font-semibold">Hướng dẫn trước khi xác thực</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-foreground-secondary">
                Hãy đọc kỹ để phiên xác thực diễn ra liền mạch. Sau khi bắt đầu, bạn sẽ lần lượt
                hoàn thành đủ năm bước được hiển thị trên thanh tiến trình.
              </p>

              <ol className="mt-6 grid gap-3 text-sm leading-6 text-foreground-secondary sm:grid-cols-2">
                {[
                  [
                    'Chuẩn bị thiết bị',
                    'Ngồi ở nơi đủ sáng, giữ khuôn mặt trong khung hình và kiểm tra camera, microphone.',
                  ],
                  [
                    'Trình bày qua camera',
                    'Chọn thời lượng phù hợp, trình bày rõ ràng về bài làm và kết thúc trong thời gian đã chọn.',
                  ],
                  [
                    'Trả lời câu hỏi',
                    'Tự nhập câu trả lời bằng bàn phím; thao tác sao chép, dán, thả nội dung và chọn toàn bộ sẽ không được sử dụng.',
                  ],
                  [
                    'Giữ phiên ổn định',
                    'Duy trì toàn màn hình, không tải lại hoặc đóng trang cho đến khi hệ thống báo hoàn tất.',
                  ],
                  [
                    'Gửi và chờ xác nhận',
                    'Video và câu trả lời sẽ được gửi, kiểm tra an toàn rồi mới ghi nhận hoàn tất.',
                  ],
                ].map(([title, description], index) => (
                  <li
                    key={title}
                    className="flex gap-3 rounded-xl border border-border bg-background p-4"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-bg font-semibold text-accent">
                      {index + 1}
                    </span>
                    <span>
                      <strong className="block text-foreground">{title}</strong>
                      <span className="mt-1 block">{description}</span>
                    </span>
                  </li>
                ))}
              </ol>

              <h3 className="mt-7 text-lg font-semibold">Chọn thời lượng trình bày</h3>
              <p className="mt-1 text-sm leading-6 text-foreground-secondary">
                Lựa chọn này sẽ được khóa sau khi phiên được tạo.
              </p>
              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {DURATION_OPTIONS.map((option) => {
                  const selected = option.value === state.oralDurationSeconds;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => dispatch({ type: 'SELECT_DURATION', duration: option.value })}
                      className={`rounded-xl border px-4 py-5 text-sm font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-background-secondary motion-reduce:transition-none ${
                        selected
                          ? 'border-accent bg-accent-bg text-accent shadow-sm'
                          : 'border-border bg-background text-foreground-secondary hover:-translate-y-0.5 hover:border-border-secondary motion-reduce:hover:translate-y-0'
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>

              <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-xl border border-accent/30 bg-accent-bg/60 p-4 text-sm leading-6 text-foreground-secondary">
                <input
                  type="checkbox"
                  checked={rulesAccepted}
                  onChange={(event) => setRulesAccepted(event.currentTarget.checked)}
                  className="mt-1 h-4 w-4 shrink-0 accent-[var(--color-accent)]"
                />
                <span>
                  <strong className="text-foreground">Tôi đã nắm rõ nội quy</strong>
                  <span className="block">
                    Tôi đã chuẩn bị thiết bị và đồng ý thực hiện phiên xác thực theo hướng dẫn trên.
                  </span>
                </span>
              </label>
              <Button
                type="button"
                variant="primary"
                size="lg"
                className="mt-7 w-full sm:w-auto"
                onClick={() => void startSession()}
                disabled={!rulesAccepted}
              >
                Bắt đầu phiên xác thực
              </Button>
            </section>
          )}

          {state.phase === 'PREPARING' && state.session && (
            <CameraRecordingPanel
              session={state.session}
              status={recorder.status}
              elapsedSeconds={recorder.elapsedSeconds}
              recordingBlob={recorder.recordingBlob}
              recordingError={state.recordingError}
              oralCompleted={state.oralCompleted}
              previewRef={recorder.previewRef}
              onStart={() => void startExistingRecording(state.session!)}
              onRetryCompletion={() => void confirmOralCompleted(state.session!.verificationId)}
            />
          )}

          {state.phase === 'ORAL_ACTIVE' && state.session && state.questionError && (
            <section
              className="rounded-2xl border border-warning bg-warning-bg p-6 shadow-[var(--shadow-surface)] sm:p-8"
              role="alert"
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-warning">
                Chưa thể chuẩn bị câu hỏi
              </p>
              <h2 className="mt-2 text-2xl font-semibold">
                Bài trình bày của bạn vẫn được giữ nguyên
              </h2>
              <p className="mt-2 text-sm leading-6 text-foreground-secondary">
                {state.questionError}
              </p>
              <Button
                type="button"
                variant="primary"
                className="mt-5"
                onClick={() => void loadQuestions(state.session!.verificationId)}
              >
                Thử tải lại bộ câu hỏi
              </Button>
            </section>
          )}

          {state.phase === 'ORAL_ACTIVE' && state.session && !state.questionError && (
            <CameraRecordingPanel
              session={state.session}
              status={recorder.status}
              elapsedSeconds={recorder.elapsedSeconds}
              recordingBlob={recorder.recordingBlob}
              recordingError={state.recordingError}
              oralCompleted={state.oralCompleted}
              previewRef={recorder.previewRef}
              onStart={() => void startExistingRecording(state.session!)}
              onRetryCompletion={() => void confirmOralCompleted(state.session!.verificationId)}
            />
          )}

          {(state.phase === 'GENERATING_QUESTIONS' ||
            (state.phase === 'ANSWERING' && state.questions.length === 0)) && (
            <section
              className="rounded-2xl border-hairline border-border bg-background-secondary p-8 text-center shadow-[var(--shadow-surface)] sm:p-12"
              role="status"
              aria-live="polite"
            >
              <div
                className="mx-auto h-10 w-10 animate-spin rounded-full border-[3px] border-border border-t-accent motion-reduce:animate-none"
                aria-hidden="true"
              />
              <h2 className="mt-5 text-xl font-semibold">Đang chuẩn bị câu hỏi tự luận...</h2>
              <p className="mt-2 text-sm text-foreground-secondary">
                Bộ câu hỏi được tạo một lần từ nội dung Challenge và sẽ không thể đổi sang bộ khác.
              </p>
            </section>
          )}

          {state.phase === 'ANSWERING' && state.questions.length > 0 && (
            <EssayAnsweringPanel
              questions={state.questions}
              answers={state.answers}
              onAnswerChange={(questionId, answer) =>
                dispatch({ type: 'ANSWER_CHANGED', questionId, answer })
              }
              onBlocked={reportBlockedAction}
              isSubmitting={isEvidenceSubmitting}
              onComplete={() => void submitVerificationEvidence()}
            />
          )}

          {state.session &&
            (state.phase === 'PREPARING_UPLOAD' ||
              state.phase === 'UPLOADING' ||
              state.phase === 'COMPLETING' ||
              state.phase === 'SCANNING') && (
              <EvidenceUploadPanel
                phase={state.phase}
                progress={state.uploadProgress}
                error={state.uploadError}
                uploaded={state.evidenceUploaded}
                onRetry={() => void submitVerificationEvidence()}
              />
            )}

          {state.phase !== 'PREPARING' &&
            state.phase !== 'STARTING' &&
            state.phase !== 'ORAL_ACTIVE' &&
            state.phase !== 'GENERATING_QUESTIONS' &&
            state.phase !== 'ANSWERING' &&
            state.phase !== 'PREPARING_UPLOAD' &&
            state.phase !== 'UPLOADING' &&
            state.phase !== 'COMPLETING' &&
            state.phase !== 'SCANNING' &&
            state.phase !== 'FAILED' &&
            state.phase !== 'COMPLETED' &&
            state.session && (
              <SessionPanel
                title={PHASE_LABEL[state.phase]}
                message="Phiên làm bài đã được khôi phục. Bạn có thể tiếp tục từ bước gần nhất."
                session={state.session}
              />
            )}

          {state.phase === 'COMPLETED' && state.session && (
            <section className="relative isolate overflow-hidden rounded-3xl border border-success/60 bg-success-bg px-6 py-10 text-center shadow-[0_24px_80px_rgba(52,211,153,0.12)] sm:px-12 sm:py-14">
              <div
                className="absolute -right-20 -top-24 -z-10 h-64 w-64 rounded-full bg-success/10 blur-3xl"
                aria-hidden="true"
              />
              <div
                className="absolute -bottom-28 -left-20 -z-10 h-64 w-64 rounded-full bg-accent/10 blur-3xl"
                aria-hidden="true"
              />
              <div
                className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border-4 border-white/20 bg-success text-4xl font-bold text-white shadow-[0_14px_36px_rgba(52,211,153,0.28)]"
                aria-hidden="true"
              >
                ✓
              </div>
              <p className="mt-6 text-xs font-semibold uppercase tracking-[0.24em] text-success">
                Đã gửi thành công
              </p>
              <h2 className="mx-auto mt-3 max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">
                Cảm ơn bạn đã hoàn thành phần xác thực
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-foreground-secondary sm:text-base">
                Bài trình bày và câu trả lời của bạn đã được ghi nhận an toàn. Bạn có thể yên tâm
                đóng trang này và chuẩn bị cho những bước tiếp theo.
              </p>

              <div className="mx-auto mt-8 grid max-w-3xl gap-3 text-left sm:grid-cols-3">
                {[
                  ['01', 'Bài trình bày', 'Đã ghi nhận'],
                  ['02', 'Câu trả lời', 'Đã gửi đầy đủ'],
                  ['03', 'Kiểm tra an toàn', 'Đã hoàn tất'],
                ].map(([number, label, value]) => (
                  <div
                    key={number}
                    className="rounded-2xl border border-success/25 bg-background/55 p-4 backdrop-blur-sm"
                  >
                    <span className="font-mono text-xs font-semibold text-success">{number}</span>
                    <p className="mt-2 text-sm font-semibold text-foreground">{label}</p>
                    <p className="mt-1 text-xs text-foreground-secondary">{value}</p>
                  </div>
                ))}
              </div>

              <div className="mx-auto mt-8 max-w-2xl rounded-2xl border-hairline border-border bg-background-secondary/75 p-5 text-left">
                <p className="text-sm font-semibold text-foreground">
                  Điều gì sẽ diễn ra tiếp theo?
                </p>
                <p className="mt-2 text-sm leading-6 text-foreground-secondary">
                  Nhà tuyển dụng sẽ đánh giá bài làm theo tiêu chí của Challenge. Danh tính của bạn
                  tiếp tục được bảo vệ trong quá trình đánh giá năng lực.
                </p>
              </div>

              <Link
                href="/candidate/dashboard"
                className="mt-8 inline-flex min-h-11 items-center justify-center rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-4 focus-visible:ring-offset-success-bg motion-reduce:transition-none motion-reduce:hover:translate-y-0"
              >
                Về trang tổng quan
              </Link>
            </section>
          )}

          {state.phase === 'FAILED' && state.error && (
            <section
              className="rounded-2xl border border-error bg-error-bg p-6 shadow-[var(--shadow-surface)] sm:p-8"
              role="alert"
            >
              <div
                className="mb-5 flex h-12 w-12 items-center justify-center rounded-full border border-error bg-background text-xl font-bold text-error"
                aria-hidden="true"
              >
                !
              </div>
              <p className="text-xs font-semibold uppercase tracking-wider text-error">
                Không thể tiếp tục
              </p>
              <h2 className="mt-2 text-2xl font-semibold">{state.error.title}</h2>
              <p className="mt-2 text-sm leading-6 text-foreground-secondary">
                {state.error.message}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                {state.retryAction && (
                  <Button
                    type="button"
                    variant="primary"
                    onClick={() =>
                      void (state.retryAction === 'RESUME' ? resumeSession() : startSession())
                    }
                  >
                    Thử lại
                  </Button>
                )}
                <Link
                  href="/candidate/my-submissions"
                  className="inline-flex items-center rounded-lg px-2 py-1 text-sm font-semibold text-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                >
                  Quay lại bài nộp của tôi
                </Link>
              </div>
            </section>
          )}
        </main>

        <footer className="border-t-hairline border-border py-5 text-center text-xs text-foreground-tertiary sm:text-left">
          Mã tham chiếu bài nộp:{' '}
          <span className="font-mono">{submissionId || 'Không xác định'}</span>
        </footer>
      </div>

      {state.notice && (
        <div
          className="animate-in fixed right-4 top-4 z-50 flex w-[calc(100%-2rem)] max-w-md items-start gap-3 rounded-2xl border border-warning/45 bg-background-secondary p-4 text-left shadow-[0_20px_60px_rgba(0,0,0,0.35)] fade-in slide-in-from-top-2 motion-reduce:animate-none sm:right-6 sm:top-6"
          role="status"
          aria-live="polite"
        >
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-warning-bg text-lg font-bold text-warning"
            aria-hidden="true"
          >
            !
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Thao tác đã được chặn</p>
            <p className="mt-1 text-sm leading-5 text-foreground-secondary">{state.notice}</p>
          </div>
        </div>
      )}
    </div>
  );
}

type BlockedTypingEvent = Extract<
  VerificationEvent,
  'PASTE_BLOCKED' | 'COPY_BLOCKED' | 'DROP_BLOCKED' | 'SELECT_ALL_BLOCKED'
>;

function VerificationStepProgress({
  phase,
  status,
}: {
  phase: VerificationPhase;
  status?: VerificationStatus;
}) {
  const activeStep = phaseStepIndex(phase, status);

  return (
    <nav
      className="relative mt-6 border-t-hairline border-border pt-5"
      aria-label="Tiến trình xác thực"
    >
      <div
        className="absolute left-[10%] right-[10%] top-[34px] h-0.5 bg-border"
        aria-hidden="true"
      >
        <div
          className="h-full bg-accent transition-[width] duration-500 motion-reduce:transition-none"
          style={{ width: `${(activeStep / (VERIFICATION_STEPS.length - 1)) * 100}%` }}
        />
      </div>
      <ol className="relative grid grid-cols-5 gap-1">
        {VERIFICATION_STEPS.map((label, index) => {
          const completed = index < activeStep;
          const current = index === activeStep;
          return (
            <li
              key={label}
              className="flex min-w-0 flex-col items-center gap-2 text-center"
              aria-current={current ? 'step' : undefined}
            >
              <span
                className={`relative z-10 flex h-7 w-7 items-center justify-center rounded-full border text-xs font-bold transition-colors motion-reduce:transition-none sm:h-8 sm:w-8 ${
                  completed
                    ? 'border-accent bg-accent text-white'
                    : current
                      ? 'border-accent bg-background text-accent ring-4 ring-accent-bg'
                      : 'border-border-secondary bg-background text-foreground-tertiary'
                }`}
                aria-hidden="true"
              >
                {completed ? '✓' : index + 1}
              </span>
              <span
                className={`text-[10px] font-medium leading-tight sm:text-xs ${
                  current ? 'text-foreground' : 'text-foreground-tertiary'
                }`}
              >
                {label}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function EssayAnsweringPanel({
  questions,
  answers,
  onAnswerChange,
  onBlocked,
  isSubmitting,
  onComplete,
}: {
  questions: VerificationQuestion[];
  answers: Record<string, string>;
  onAnswerChange: (questionId: string, answer: string) => void;
  onBlocked: (event: BlockedTypingEvent) => void;
  isSubmitting: boolean;
  onComplete: () => void;
}) {
  const allAnswersValid = questions.every((question) => {
    const length = (answers[question.questionId] ?? '').length;
    return length >= question.minimumLength && length <= question.maximumLength;
  });

  return (
    <section className="rounded-2xl border-hairline border-border bg-background-secondary p-5 shadow-[var(--shadow-surface)] sm:p-8">
      <p className="text-xs font-semibold uppercase tracking-wider text-accent">Câu hỏi tự luận</p>
      <h2 className="mt-2 text-2xl font-semibold">Trình bày hiểu biết của bạn</h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-foreground-secondary">
        Hãy tự nhập câu trả lời. Dán, sao chép, thả nội dung và chọn toàn bộ bằng Ctrl/Cmd + A bị
        chặn và được ghi nhận như tín hiệu phiên.
      </p>

      <div className="mt-7 space-y-7">
        {questions.map((question, index) => {
          const answer = answers[question.questionId] ?? '';
          const length = answer.length;
          const isValid = length >= question.minimumLength && length <= question.maximumLength;

          const block = (event: { preventDefault: () => void }, type: BlockedTypingEvent) => {
            event.preventDefault();
            onBlocked(type);
          };

          return (
            <article
              key={question.questionId}
              className="rounded-2xl border-hairline border-border bg-background p-5 shadow-sm transition-[border-color,box-shadow] focus-within:border-accent/70 focus-within:shadow-md motion-reduce:transition-none sm:p-6"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                <div className="flex min-w-0 items-start gap-3">
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-bg text-sm font-bold text-accent"
                    aria-hidden="true"
                  >
                    {index + 1}
                  </span>
                  <label
                    htmlFor={`answer-${question.questionId}`}
                    className="pt-1 font-semibold leading-6"
                  >
                    {question.question}
                  </label>
                </div>
                <Badge variant={isValid ? 'done' : 'blind'} className="w-fit shrink-0">
                  {isValid ? 'Đủ điều kiện' : `Tối thiểu ${question.minimumLength}`}
                </Badge>
              </div>

              <textarea
                id={`answer-${question.questionId}`}
                value={answer}
                maxLength={question.maximumLength}
                rows={8}
                spellCheck
                onChange={(event) => onAnswerChange(question.questionId, event.target.value)}
                onPaste={(event) => block(event, 'PASTE_BLOCKED')}
                onCopy={(event) => block(event, 'COPY_BLOCKED')}
                onDrop={(event) => block(event, 'DROP_BLOCKED')}
                onKeyDown={(event) => {
                  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'a') {
                    block(event, 'SELECT_ALL_BLOCKED');
                  }
                }}
                onBeforeInput={(event) => {
                  const inputType = (event.nativeEvent as InputEvent).inputType;
                  if (inputType === 'insertFromPaste') block(event, 'PASTE_BLOCKED');
                  if (inputType === 'insertFromDrop') block(event, 'DROP_BLOCKED');
                }}
                aria-describedby={`answer-help-${question.questionId}`}
                className="mt-5 min-h-48 w-full resize-y rounded-xl border-hairline border-border bg-background-secondary px-4 py-3 text-sm leading-6 text-foreground outline-none transition-colors placeholder:text-foreground-tertiary focus:border-accent focus:ring-2 focus:ring-focus motion-reduce:transition-none sm:min-h-56"
              />

              <div
                id={`answer-help-${question.questionId}`}
                className="mt-2 flex flex-wrap justify-between gap-2 text-xs"
              >
                <span className={isValid ? 'text-success' : 'text-foreground-tertiary'}>
                  {isValid
                    ? 'Câu trả lời đã đạt độ dài yêu cầu.'
                    : `Cần thêm ${Math.max(question.minimumLength - length, 0)} ký tự.`}
                </span>
                <span className="font-mono text-foreground-tertiary">
                  {length}/{question.maximumLength}
                </span>
              </div>
            </article>
          );
        })}
      </div>

      <div className="mt-7 flex flex-col gap-3 border-t-hairline border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-foreground-secondary">
          {allAnswersValid
            ? 'Tất cả câu trả lời đã đủ điều kiện để hoàn tất.'
            : 'Hãy hoàn thành đầy đủ các câu trả lời trước khi tiếp tục.'}
        </p>
        <Button
          type="button"
          variant="primary"
          size="lg"
          disabled={!allAnswersValid || isSubmitting}
          onClick={onComplete}
        >
          {isSubmitting ? 'Đang hoàn tất...' : 'Hoàn tất xác thực'}
        </Button>
      </div>
    </section>
  );
}

function EvidenceUploadPanel({
  phase,
  progress,
  error,
  uploaded,
  onRetry,
}: {
  phase: VerificationPhase;
  progress: number;
  error: EvidenceRecovery | null;
  uploaded: boolean;
  onRetry: () => void;
}) {
  const activeTitle =
    phase === 'UPLOADING'
      ? 'Đang tải video xác thực'
      : phase === 'COMPLETING'
        ? 'Đang xác nhận bài làm'
        : phase === 'SCANNING'
          ? 'Đang quét an toàn video'
          : uploaded
            ? 'Chưa thể hoàn tất xác thực'
            : 'Đang chuẩn bị tải video';
  const recovery = error
    ? {
        NETWORK: {
          title: 'Mất kết nối trong khi hoàn tất',
          action: 'Thử lại khi có kết nối',
        },
        PRESIGNED_EXPIRED: {
          title: 'Liên kết tải video đã hết hạn',
          action: 'Tạo liên kết mới và thử lại',
        },
        FILE_TOO_LARGE: {
          title: 'Video vượt quá giới hạn dung lượng',
          action: null,
        },
        UPLOAD: {
          title: 'Video chưa được tải lên thành công',
          action: 'Thử tải lên lại',
        },
        COMPLETE: {
          title: 'Chưa thể hoàn tất bài xác thực',
          action: 'Thử hoàn tất lại',
        },
      }[error.kind]
    : null;

  return (
    <section
      className="rounded-2xl border-hairline border-border bg-background-secondary p-6 shadow-[var(--shadow-surface)] sm:p-8"
      aria-live="polite"
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-accent">Hoàn tất phiên</p>
      <h2 className="mt-2 text-2xl font-semibold">{recovery?.title ?? activeTitle}</h2>
      <p className="mt-2 text-sm leading-6 text-foreground-secondary">
        {phase === 'SCANNING'
          ? 'Video và câu trả lời đã được gửi. Vui lòng chờ trong giây lát để hoàn tất kiểm tra an toàn.'
          : 'Hãy giữ tab này mở trong lúc video và câu trả lời đang được gửi.'}
      </p>

      {(phase === 'UPLOADING' || progress > 0) && (
        <div className="mt-6">
          <div className="mb-2 flex justify-between text-xs font-medium text-foreground-secondary">
            <span>Đang gửi video xác thực</span>
            <span className="font-mono tabular-nums text-foreground">{progress}%</span>
          </div>
          <div
            className="h-3 overflow-hidden rounded-full border-hairline border-border bg-background-tertiary"
            role="progressbar"
            aria-label="Tiến độ upload video"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
          >
            <div
              className="h-full rounded-full bg-accent transition-[width] duration-300 motion-reduce:transition-none"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {error && (
        <div
          className="mt-5 rounded-xl border border-warning bg-warning-bg p-4 text-sm font-medium leading-6 text-warning"
          role="alert"
        >
          {error.message}
        </div>
      )}

      {phase === 'PREPARING_UPLOAD' && recovery?.action && (
        <Button type="button" variant="primary" className="mt-5" onClick={onRetry}>
          {recovery.action}
        </Button>
      )}
    </section>
  );
}

function CameraRecordingPanel({
  session,
  status,
  elapsedSeconds,
  recordingBlob,
  recordingError,
  oralCompleted,
  previewRef,
  onStart,
  onRetryCompletion,
}: {
  session: VerificationSession;
  status: VerificationRecorderStatus;
  elapsedSeconds: number;
  recordingBlob: Blob | null;
  recordingError: string | null;
  oralCompleted: boolean;
  previewRef: (element: HTMLVideoElement | null) => void;
  onStart: () => void;
  onRetryCompletion: () => void;
}) {
  const isRecording = status === 'recording';
  const canStart = status === 'idle' || status === 'error';
  const remainingSeconds = Math.max(session.oralDurationSeconds - elapsedSeconds, 0);
  const recordingProgress = Math.min((elapsedSeconds / session.oralDurationSeconds) * 100, 100);

  return (
    <section className="rounded-2xl border-hairline border-border bg-background-secondary p-5 shadow-[var(--shadow-surface)] sm:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-accent">
            Trình bày qua camera
          </p>
          <h2 className="mt-2 text-2xl font-semibold">Phiên ghi hình xác thực</h2>
          <p className="mt-2 text-sm leading-6 text-foreground-secondary">
            Bạn có tối đa {formatRecordingTime(session.oralDurationSeconds)} để trình bày. Hãy nói
            rõ ràng, đi thẳng vào cách tiếp cận và những quyết định quan trọng trong bài làm. Video
            sẽ tự dừng khi hết thời gian.
          </p>
        </div>

        {status === 'interrupted' && (
          <div
            className="rounded-full border border-warning bg-warning-bg px-4 py-2 text-sm font-semibold text-warning"
            role="alert"
          >
            Camera tạm gián đoạn
          </div>
        )}
      </div>

      <div className="relative mt-6 aspect-video overflow-hidden rounded-2xl border border-border-secondary bg-black shadow-2xl ring-1 ring-white/10">
        <video
          ref={previewRef}
          autoPlay
          muted
          playsInline
          aria-label="Hình ảnh xem trước từ camera của bạn"
          className="h-full w-full object-cover [transform:scaleX(-1)]"
        />
        {isRecording && (
          <div
            className="absolute left-3 top-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/75 px-3 py-2 text-xs font-semibold text-white shadow-lg backdrop-blur-sm sm:left-4 sm:top-4 sm:px-4 sm:text-sm"
            role="status"
            aria-live="polite"
            aria-label={`Đang ghi hình, còn ${formatRecordingTime(remainingSeconds)}`}
          >
            <span
              className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-500 shadow-[0_0_0_4px_rgba(239,68,68,0.2)] motion-reduce:animate-none"
              aria-hidden="true"
            />
            <span>Recording</span>
            <span className="text-white/60" aria-hidden="true">
              ·
            </span>
            <time className="font-mono tabular-nums" dateTime={`PT${remainingSeconds}S`}>
              Còn {formatRecordingTime(remainingSeconds)}
            </time>
          </div>
        )}
        {isRecording && (
          <div className="absolute inset-x-0 bottom-0 h-1.5 bg-white/20" aria-hidden="true">
            <div
              className="h-full bg-red-500 transition-[width] duration-300 motion-reduce:transition-none"
              style={{ width: `${recordingProgress}%` }}
            />
          </div>
        )}
        {status === 'stopped' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70 p-6 text-center text-white">
            <div>
              <p className="text-lg font-semibold">Đã ghi hình xong</p>
              <p className="mt-1 text-sm text-white/75">
                Video có dung lượng {formatFileSize(recordingBlob?.size ?? 0)}.{' '}
                {oralCompleted
                  ? 'Phần trình bày đã được ghi nhận.'
                  : 'Đang hoàn tất phần trình bày.'}
              </p>
            </div>
          </div>
        )}
      </div>

      {recordingError && (
        <div
          className="mt-4 rounded-lg border border-error bg-error-bg p-4 text-sm text-error"
          role="alert"
        >
          {recordingError}
        </div>
      )}

      <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
        <p className="text-xs text-foreground-tertiary">
          Giới hạn video: {formatFileSize(VERIFICATION_MAX_FILE_BYTES)} · WebM · Camera và
          microphone
        </p>
        {canStart && (
          <Button type="button" variant="primary" size="lg" onClick={onStart}>
            {recordingError ? 'Thử ghi hình lại' : 'Bắt đầu ghi hình'}
          </Button>
        )}
        {status === 'stopped' && recordingError && !oralCompleted && (
          <Button type="button" variant="primary" onClick={onRetryCompletion}>
            Thử xác nhận lại
          </Button>
        )}
        {(status === 'preparing' || status === 'ready') && (
          <span className="text-sm text-foreground-secondary" role="status" aria-live="polite">
            Đang chuẩn bị camera và microphone...
          </span>
        )}
      </div>
    </section>
  );
}

function formatRecordingTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function formatFileSize(bytes: number): string {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function SessionPanel({
  title,
  message,
  session,
}: {
  title: string;
  message: string;
  session: VerificationSession;
}) {
  return (
    <section className="rounded-xl border-hairline border-border bg-background-secondary p-6 sm:p-8">
      <p className="text-xs font-semibold uppercase tracking-wider text-accent">
        Phiên đang hoạt động
      </p>
      <h2 className="mt-2 text-2xl font-semibold">{title}</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-foreground-secondary">{message}</p>
      <dl className="mt-6 grid gap-4 rounded-lg border-hairline border-border bg-background p-5 sm:grid-cols-3">
        <div>
          <dt className="text-xs text-foreground-tertiary">Mã xác thực</dt>
          <dd className="mt-1 font-mono text-lg font-semibold text-accent">
            {session.verificationCode}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-foreground-tertiary">Thời lượng trình bày</dt>
          <dd className="mt-1 text-sm font-semibold">{session.oralDurationSeconds} giây</dd>
        </div>
        <div>
          <dt className="text-xs text-foreground-tertiary">Phiên hết hạn</dt>
          <dd className="mt-1 text-sm font-semibold">
            {new Date(session.expiresAt).toLocaleString('vi-VN')}
          </dd>
        </div>
      </dl>
    </section>
  );
}
