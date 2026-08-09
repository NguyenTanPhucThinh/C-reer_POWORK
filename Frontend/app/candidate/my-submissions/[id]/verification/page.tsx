'use client';

import axios from 'axios';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useReducer, useRef } from 'react';
import { Badge, Button } from '@/components/ui';
import { assessmentAPI } from '@/lib/api/endpoints';
import {
  VERIFICATION_MAX_FILE_BYTES,
  useVerificationRecorder,
  type VerificationRecorderStatus,
} from '@/lib/hooks/useVerificationRecorder';
import type {
  ApiErrorBody,
  OralDurationSeconds,
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

interface VerificationState {
  phase: VerificationPhase;
  oralDurationSeconds: OralDurationSeconds;
  session: VerificationSession | null;
  error: { title: string; message: string } | null;
  retryAction: RetryAction;
  fullscreenMessage: string | null;
  recordingError: string | null;
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

export default function CandidateVerificationPage() {
  const submissionId = getSubmissionId(useParams());
  const [state, dispatch] = useReducer(verificationReducer, initialState);
  const transitionLock = useRef(false);
  const lastFocusLossAt = useRef(0);
  const recorder = useVerificationRecorder();

  const fail = useCallback((error: unknown, retryAction: Exclude<RetryAction, null>) => {
    const detail = describeError(error);
    dispatch({
      type: 'FAIL',
      error: { title: detail.title, message: detail.message },
      retryAction: detail.retryable ? retryAction : undefined,
    });
  }, []);

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
      dispatch({ type: 'SYNC_SESSION', session });
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
  }, [fail, submissionId]);

  useEffect(() => {
    void resumeSession();
  }, [resumeSession]);

  async function startSession() {
    if (!submissionId || transitionLock.current) return;

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
    let oralStarted = session.status === 'CameraActive';
    dispatch({ type: 'RECORDING_ERROR', message: null });

    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        dispatch({ type: 'FULLSCREEN_RESTORED' });
      }
      if (!mediaIsPrepared) await recorder.prepareMedia();
      await assessmentAPI.sendVerificationEvent(session.verificationId, 'ORAL_STARTED');
      oralStarted = true;
      if (session.status === 'CameraActive') {
        await assessmentAPI.sendVerificationEvent(session.verificationId, 'CAMERA_RESTORED');
      }
      const activeSession = { ...session, status: 'CameraActive' as const };
      dispatch({ type: 'SYNC_SESSION', session: activeSession });
      recorder.startRecording(session.oralDurationSeconds, {
        onStarted: () => undefined,
        onStopped: () => {
          void assessmentAPI
            .sendVerificationEvent(session.verificationId, 'ORAL_COMPLETED')
            .catch((error) =>
              dispatch({ type: 'RECORDING_ERROR', message: describeError(error).message })
            );
        },
        onCameraInterrupted: () => {
          void assessmentAPI
            .sendVerificationEvent(session.verificationId, 'CAMERA_INTERRUPTED')
            .catch(() => undefined);
        },
        onCameraRestored: () => {
          void assessmentAPI
            .sendVerificationEvent(session.verificationId, 'CAMERA_RESTORED')
            .catch(() => undefined);
        },
        onError: (message) => dispatch({ type: 'RECORDING_ERROR', message }),
      });
    } catch (error) {
      if (oralStarted) {
        void assessmentAPI
          .sendVerificationEvent(session.verificationId, 'CAMERA_INTERRUPTED')
          .catch(() => undefined);
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

  async function startExistingRecording(session: VerificationSession) {
    if (transitionLock.current) return;
    transitionLock.current = true;
    await beginRecording(session);
    transitionLock.current = false;
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
    if (!state.session || !FOCUS_TRACKING_PHASES.has(state.phase)) return;

    const reportFocusLoss = () => {
      const now = Date.now();
      if (now - lastFocusLossAt.current < 750) return;
      lastFocusLossAt.current = now;
      void assessmentAPI
        .sendVerificationEvent(state.session!.verificationId, 'FOCUS_LOST')
        .catch(() => undefined);
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
    <div className="min-h-screen bg-background px-4 py-6 text-foreground sm:px-8 lg:px-12">
      <div className="mx-auto max-w-5xl">
        <header className="flex flex-col gap-4 border-b-hairline border-border pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">POWORK</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
              Xác thực sau khi nộp bài
            </h1>
            <p className="mt-2 text-sm text-foreground-secondary">
              Không đóng hoặc tải lại trang khi một thao tác đang được xử lý.
            </p>
          </div>
          <Badge variant={badgeVariant}>{PHASE_LABEL[state.phase]}</Badge>
        </header>

        <main className="py-8">
          {isSessionInProgress && (
            <section className="mb-5 rounded-xl border-hairline border-border bg-background-secondary p-4 text-sm text-foreground-secondary">
              <p>
                Trình duyệt sẽ cảnh báo khi bạn tải lại hoặc đóng tab. Hệ thống có thể ghi nhận việc
                mất tập trung, nhưng không thể và không giả vờ chặn Alt + Tab hay chuyển ứng dụng.
              </p>
            </section>
          )}

          {isSessionInProgress && state.fullscreenMessage && (
            <section
              className="mb-5 flex flex-col gap-4 rounded-xl border border-warning bg-warning-bg p-4 sm:flex-row sm:items-center sm:justify-between"
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

          {state.phase === 'STARTING' && (
            <section className="rounded-xl border-hairline border-border bg-background-secondary p-8 text-center">
              <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-border border-t-accent" />
              <h2 className="mt-5 text-xl font-semibold">Đang kiểm tra phiên xác thực...</h2>
              <p className="mt-2 text-sm text-foreground-secondary">
                Hệ thống đang khởi tạo hoặc khôi phục đúng bước gần nhất.
              </p>
            </section>
          )}

          {state.phase === 'PREPARING' && !hasSession && (
            <section className="rounded-xl border-hairline border-border bg-background-secondary p-6 sm:p-8">
              <p className="text-xs font-semibold uppercase tracking-wider text-accent">
                Bước chuẩn bị
              </p>
              <h2 className="mt-2 text-2xl font-semibold">Chọn thời lượng trình bày</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-foreground-secondary">
                Lựa chọn sẽ được khóa sau khi phiên được tạo. Khi bấm bắt đầu, trình duyệt sẽ mở
                toàn màn hình và kiểm tra quyền camera, microphone trước khi tạo phiên.
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
                      className={`rounded-xl border px-4 py-5 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-focus ${
                        selected
                          ? 'border-accent bg-accent-bg text-accent'
                          : 'border-border bg-background text-foreground-secondary hover:border-border-secondary'
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
              <Button
                type="button"
                variant="primary"
                size="lg"
                className="mt-7 w-full sm:w-auto"
                onClick={() => void startSession()}
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
              previewRef={recorder.previewRef}
              onStart={() => void startExistingRecording(state.session!)}
            />
          )}

          {state.phase === 'ORAL_ACTIVE' && state.session && (
            <CameraRecordingPanel
              session={state.session}
              status={recorder.status}
              elapsedSeconds={recorder.elapsedSeconds}
              recordingBlob={recorder.recordingBlob}
              recordingError={state.recordingError}
              previewRef={recorder.previewRef}
              onStart={() => void startExistingRecording(state.session!)}
            />
          )}

          {state.phase !== 'PREPARING' &&
            state.phase !== 'STARTING' &&
            state.phase !== 'ORAL_ACTIVE' &&
            state.phase !== 'FAILED' &&
            state.phase !== 'COMPLETED' &&
            state.session && (
              <SessionPanel
                title={PHASE_LABEL[state.phase]}
                message="Hệ thống đã khôi phục đúng trạng thái do Backend xác nhận. Nội dung thao tác của bước này sẽ được nối ở các bước Frontend tiếp theo."
                session={state.session}
              />
            )}

          {state.phase === 'COMPLETED' && state.session && (
            <section className="rounded-xl border border-success bg-success-bg p-6 sm:p-8">
              <p className="text-xs font-semibold uppercase tracking-wider text-success">
                Hoàn tất
              </p>
              <h2 className="mt-2 text-2xl font-semibold">Cảm ơn bạn đã hoàn thành xác thực</h2>
              <p className="mt-2 text-sm leading-6 text-foreground-secondary">
                Phiên đã được Backend xác nhận hoàn tất. Chúc bạn có một buổi phỏng vấn thuận lợi.
              </p>
              <Link
                href="/candidate/my-submissions"
                className="mt-6 inline-block text-sm font-semibold text-accent hover:underline"
              >
                Quay lại bài nộp của tôi
              </Link>
            </section>
          )}

          {state.phase === 'FAILED' && state.error && (
            <section className="rounded-xl border border-error bg-error-bg p-6 sm:p-8" role="alert">
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
                  className="inline-flex items-center text-sm font-semibold text-accent hover:underline"
                >
                  Quay lại bài nộp của tôi
                </Link>
              </div>
            </section>
          )}
        </main>

        <footer className="border-t-hairline border-border py-5 text-xs text-foreground-tertiary">
          Mã Submission: <span className="font-mono">{submissionId || 'Không xác định'}</span>
        </footer>
      </div>
    </div>
  );
}

function CameraRecordingPanel({
  session,
  status,
  elapsedSeconds,
  recordingBlob,
  recordingError,
  previewRef,
  onStart,
}: {
  session: VerificationSession;
  status: VerificationRecorderStatus;
  elapsedSeconds: number;
  recordingBlob: Blob | null;
  recordingError: string | null;
  previewRef: (element: HTMLVideoElement | null) => void;
  onStart: () => void;
}) {
  const isRecording = status === 'recording';
  const canStart = status === 'idle' || status === 'error';

  return (
    <section className="rounded-xl border-hairline border-border bg-background-secondary p-5 sm:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-accent">
            Trình bày qua camera
          </p>
          <h2 className="mt-2 text-2xl font-semibold">Phiên ghi hình xác thực</h2>
          <p className="mt-2 text-sm leading-6 text-foreground-secondary">
            Thời lượng tối đa {formatRecordingTime(session.oralDurationSeconds)}. Video sẽ tự dừng
            khi hết thời gian.
          </p>
        </div>

        {isRecording && (
          <div
            className="inline-flex items-center gap-2 rounded-full border border-error bg-error-bg px-4 py-2 text-sm font-semibold text-error"
            role="status"
            aria-live="polite"
            aria-label={`Recording, ${formatRecordingTime(elapsedSeconds)}`}
          >
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-error" aria-hidden="true" />
            <span>Recording</span>
            <time dateTime={`PT${elapsedSeconds}S`}>{formatRecordingTime(elapsedSeconds)}</time>
          </div>
        )}

        {status === 'interrupted' && (
          <div
            className="rounded-full border border-warning bg-warning-bg px-4 py-2 text-sm font-semibold text-warning"
            role="alert"
          >
            Camera tạm gián đoạn
          </div>
        )}
      </div>

      <div className="relative mt-6 aspect-video overflow-hidden rounded-xl bg-black">
        <video
          ref={previewRef}
          autoPlay
          muted
          playsInline
          aria-label="Hình ảnh xem trước từ camera của bạn"
          className="h-full w-full object-cover [transform:scaleX(-1)]"
        />
        {status === 'stopped' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70 p-6 text-center text-white">
            <div>
              <p className="text-lg font-semibold">Đã ghi hình xong</p>
              <p className="mt-1 text-sm text-white/75">
                Video có dung lượng {formatFileSize(recordingBlob?.size ?? 0)} và đã sẵn sàng cho
                bước tiếp theo.
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
