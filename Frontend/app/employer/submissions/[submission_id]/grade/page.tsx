'use client';

import { useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { DocumentViewer, RubricScoringForm } from '@/components/assessment';
import { Badge, Button } from '@/components/ui';
import { useEvaluateSubmission, useGradingSubmission, useUnlockSubmission } from '@/lib/hooks';
import { useAddToTalentPool } from '../../../../../lib/hooks/useTalentPool'; // Import useAddToTalentPool hook
import { cn } from '@/lib/utils/cn';
import type { UseMutationResult } from '@tanstack/react-query'; // Import UseMutationResult for typing
import type {
  EvaluateRequest,
  EvaluateResponse,
  GradingSubmission,
  ReviewDocument,
  SubmissionStatus,
  UnlockResponse,
} from '@/lib/types';

function getStringParam(value: string | string[] | undefined, fallback = ''): string {
  if (Array.isArray(value)) return value[0] ?? fallback;
  return value ?? fallback;
}

function normalizeStatus(
  status?: SubmissionStatus
): 'pending' | 'evaluated' | 'approved' | 'rejected' {
  const normalized = status?.toLowerCase();

  if (normalized === 'evaluated') return 'evaluated';
  if (normalized === 'approved') return 'approved';
  if (normalized === 'rejected' || normalized === 'failed') return 'rejected';
  return 'pending';
}

function getStatusBadgeVariant(status: ReturnType<typeof normalizeStatus>) {
  if (status === 'pending') return 'blind';
  if (status === 'evaluated') return 'done';
  if (status === 'approved') return 'open';
  return 'fail';
}

function getStatusLabel(status: ReturnType<typeof normalizeStatus>): string {
  if (status === 'pending') return 'Đang chấm mù';
  if (status === 'evaluated') return 'Đã lưu điểm';
  if (status === 'approved') return 'Đã unlock';
  return 'Không đạt';
}

function formatSubmittedAt(value?: string): string {
  if (!value) return 'Chưa rõ thời gian';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function getAnonymousCode(hashId?: string): string {
  if (!hashId) return 'N/A';
  return hashId.replace(/^Candidate[_-]?/i, '') || hashId;
}

function getActionError(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    // Specifically check for the 409 Conflict message from the backend API contract
    // (from Documents/API_Contracts_POWORK.md, POST /assessment/submissions/{submission_id}/unlock, Response 409 Conflict)
    if (
      error.message.includes(
        'Conflict! This candidate has already been unlocked by another evaluator.'
      )
    ) {
      return 'Không thể mở khóa. Ứng viên này đã được mở khóa bởi một người chấm khác.';
    }
    return fallback;
  }

  return fallback;
}

function getFormLockReason({
  isUnlocked,
  status,
  evaluationResult,
}: {
  isUnlocked: boolean;
  status: ReturnType<typeof normalizeStatus>;
  evaluationResult: EvaluateResponse | null;
}) {
  if (isUnlocked) {
    return 'Ứng viên đã được mở khóa. Form chấm điểm đã khóa để giữ lịch sử đánh giá.';
  }

  if (evaluationResult || status === 'evaluated') {
    return 'Điểm đã được lưu. Reviewer có thể unlock nếu bài nộp đạt điều kiện.';
  }

  if (status === 'approved' || status === 'rejected') {
    return 'Backend trả trạng thái không cho phép chấm lại bài nộp này.';
  }

  return undefined;
}

function DocumentsTabs({
  documents,
  activeDocIndex,
  onChange,
}: {
  documents: ReviewDocument[];
  activeDocIndex: number;
  onChange: (index: number) => void;
}) {
  if (documents.length === 0) {
    return (
      <div className="rounded-lg border-hairline border-dashed border-border-secondary bg-background-tertiary px-3 py-2 text-xs text-foreground-secondary">
        Chưa có file bài nộp từ backend.
      </div>
    );
  }

  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {documents.map((document, index) => {
        const fileName = document.fileName || `file-${index + 1}`;

        return (
          <button
            key={`${fileName}-${index}`}
            type="button"
            onClick={() => onChange(index)}
            className={cn(
              'min-h-8 max-w-[220px] shrink-0 truncate rounded-lg border-hairline px-3 py-1.5 text-xs font-medium transition-colors',
              index === activeDocIndex
                ? 'border-accent bg-accent-bg text-accent'
                : 'border-border-secondary bg-background-tertiary text-foreground-secondary hover:opacity-90'
            )}
            title={fileName}
          >
            {fileName}
          </button>
        );
      })}
    </div>
  );
}

function LoadingPanel() {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-7rem)] w-full max-w-[1440px] flex-col gap-4">
      <div className="h-20 animate-pulse rounded-lg border-hairline border-border-secondary bg-background-secondary" />
      <div className="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="min-h-[420px] animate-pulse rounded-lg border-hairline border-border-secondary bg-background-secondary" />
        <div className="min-h-[420px] animate-pulse rounded-lg border-hairline border-border-secondary bg-background-secondary" />
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="mx-auto flex min-h-[420px] max-w-2xl items-center justify-center rounded-lg border-hairline border-dashed border-border-secondary bg-background-secondary px-6 text-center">
      <p className="text-sm leading-6 text-foreground-secondary">{message}</p>
    </div>
  );
}

function UnlockPanel({
  submission,
  evaluationResult,
  unlockResult,
  canUnlock,
  isUnlocking,
  onUnlock,
  onSaveToTalentPoolMutation, // New prop
}: {
  submission: GradingSubmission;
  evaluationResult: EvaluateResponse | null;
  unlockResult: UnlockResponse | null;
  canUnlock: boolean;
  isUnlocking: boolean;
  onUnlock: () => void;
  onSaveToTalentPoolMutation?: UseMutationResult<void, Error, string>; // Use the mutation result type
}) {
  const profile =
    unlockResult?.unlocked_candidate_profile ?? submission.unlocked_candidate_profile ?? null;
  // const [savePoolState, setSavePoolState] = useState<'idle' | 'loading' | 'saved'>('idle'); // Removed local state

  const isSavingToPool = onSaveToTalentPoolMutation?.isPending; // Use mutation state
  const isSavedToPool = onSaveToTalentPoolMutation?.isSuccess; // Use mutation state

  const handleSaveToPool = () => {
    // Removed async
    if (!profile || isSavingToPool || isSavedToPool) return; // Prevent multiple clicks or if already saved

    if (onSaveToTalentPoolMutation) {
      onSaveToTalentPoolMutation.mutate(profile.user_id, {
        onSuccess: () => {
          // Toast message is handled by the hook itself.
          // Any additional local UI updates can go here if needed.
        },
        onError: (_error) => {
          // Handle error if necessary, e.g., show a toast.
          // For now, the hook handles the error toast.
        },
      });
    }
  };

  if (profile) {
    return (
      <div className="rounded-lg border-hairline border-[rgba(34,197,94,0.35)] bg-success-bg p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-success">Đã mở khóa ứng viên</p>
            <p className="mt-1 text-xs leading-5 text-foreground-secondary">
              Danh tính chỉ hiển thị sau khi unlock thành công.
            </p>
          </div>
          <Badge variant="open">Unlocked</Badge>
        </div>
        <div className="mt-4 grid gap-2 text-sm">
          <div className="rounded-md border-hairline border-[rgba(34,197,94,0.25)] bg-background px-3 py-2">
            <p className="text-2xs uppercase text-foreground-tertiary">Họ tên</p>
            <p className="mt-0.5 font-medium text-foreground">{profile.full_name}</p>
          </div>
          <div className="rounded-md border-hairline border-[rgba(34,197,94,0.25)] bg-background px-3 py-2">
            <p className="text-2xs uppercase text-foreground-tertiary">Email</p>
            <p className="mt-0.5 break-all font-medium text-foreground">{profile.email}</p>
          </div>
          <div className="rounded-md border-hairline border-[rgba(34,197,94,0.25)] bg-background px-3 py-2">
            <p className="text-2xs uppercase text-foreground-tertiary">User ID</p>
            <p className="mt-0.5 break-all font-mono text-xs text-foreground">{profile.user_id}</p>
          </div>
        </div>

        {/* Button Lưu vào Talent Pool với 3 trạng thái: Normal, Loading, Disabled ("Đã lưu vào Pool") */}
        <div className="mt-4">
          {isSavedToPool ? (
            <Button
              type="button"
              variant="default"
              size="md"
              className="w-full bg-background-tertiary text-foreground-secondary border-border-secondary cursor-not-allowed opacity-80"
              disabled
            >
              <span className="flex items-center justify-center gap-1.5 font-medium">
                <svg
                  className="h-4 w-4 text-success"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Đã lưu vào Pool
              </span>
            </Button>
          ) : (
            <Button
              type="button"
              variant="accent"
              size="md"
              className="w-full shadow-xs transition-all hover:opacity-95 active:scale-[0.99]"
              onClick={handleSaveToPool}
              disabled={!profile || isSavingToPool} // Disable if no profile or saving
            >
              <span className="flex items-center justify-center gap-1.5 font-medium">
                {isSavingToPool ? (
                  <svg
                    className="h-4 w-4 animate-spin text-accent"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="10" />
                  </svg>
                ) : (
                  <svg
                    className="h-4 w-4 text-accent"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                    <polyline points="17 21 17 13 7 13 7 21" />
                    <polyline points="7 3 7 8 15 8" />
                  </svg>
                )}
                {isSavingToPool ? 'Đang lưu...' : 'Lưu vào Talent Pool'}
              </span>
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (normalizeStatus(submission.status) === 'approved') {
    return (
      <div className="rounded-lg border-hairline border-[rgba(34,197,94,0.35)] bg-success-bg p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-success">Đã mở khóa ứng viên</p>
            <p className="mt-1 text-xs leading-5 text-foreground-secondary">
              Backend báo bài nộp đã unlock nhưng chưa trả profile trong response hiện tại.
            </p>
          </div>
          <Badge variant="open">Unlocked</Badge>
        </div>
      </div>
    );
  }

  if (!evaluationResult && normalizeStatus(submission.status) === 'pending') {
    return (
      <div className="rounded-lg border-hairline border-border-secondary bg-background p-4 text-xs leading-5 text-foreground-secondary">
        Submit điểm trước. Nếu bài đạt điều kiện, nút unlock sẽ xuất hiện tại đây.
      </div>
    );
  }

  return (
    <div className="rounded-lg border-hairline border-border-secondary bg-background p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground">Unlock thông tin ứng viên</p>
          <p className="mt-1 text-xs leading-5 text-foreground-secondary">
            Chỉ mở khóa khi bài nộp đã được chấm và đạt tiêu chí tuyển dụng.
          </p>
        </div>
        {evaluationResult && (
          <span className="shrink-0 rounded-md border-hairline border-border-secondary bg-background-tertiary px-2 py-1 font-mono text-xs text-success">
            {evaluationResult.total_score} điểm
          </span>
        )}
      </div>
      <Button
        type="button"
        variant="accent"
        size="lg"
        className="mt-4 w-full"
        disabled={!canUnlock || isUnlocking}
        onClick={onUnlock}
      >
        {isUnlocking ? 'Đang mở khóa...' : 'Unlock ứng viên'}
      </Button>
    </div>
  );
}

export default function GradeSubmissionPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const submissionId = getStringParam(params?.submission_id, '');
  const challengeId = searchParams.get('challengeId') ?? searchParams.get('challenge_id');

  const { data: submission, isLoading, isError } = useGradingSubmission(submissionId, challengeId);

  if (isLoading) {
    return <LoadingPanel />;
  }

  if (isError || !submission) {
    return (
      <EmptyState message="Không thể tải bài nộp để chấm. Vui lòng kiểm tra endpoint assessment hoặc thử lại sau." />
    );
  }

  return <GradeSubmissionWorkspace key={submission.submission_id} submission={submission} />;
}

function GradeSubmissionWorkspace({ submission }: { submission: GradingSubmission }) {
  const evaluateMutation = useEvaluateSubmission();
  const unlockMutation = useUnlockSubmission();
  const addToTalentPoolMutation = useAddToTalentPool(); // Instantiate hook
  const [activeDocIndex, setActiveDocIndex] = useState(0);
  const [evaluationResult, setEvaluationResult] = useState<EvaluateResponse | null>(null);
  const [unlockResult, setUnlockResult] = useState<UnlockResponse | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const safeActiveDocIndex =
    submission.documents.length > 0 ? Math.min(activeDocIndex, submission.documents.length - 1) : 0;
  const activeDoc = submission.documents[safeActiveDocIndex] ?? null;
  const submittedLabel = useMemo(
    () => formatSubmittedAt(submission.submitted_at),
    [submission.submitted_at]
  );
  const status = normalizeStatus(submission.status);
  const unlockedProfile =
    unlockResult?.unlocked_candidate_profile ?? submission.unlocked_candidate_profile ?? null;
  const isUnlocked = Boolean(unlockedProfile || submission.is_unlocked || status === 'approved');
  const canEvaluate = status === 'pending' && !evaluationResult && !isUnlocked;
  const canUnlock = !isUnlocked && Boolean(evaluationResult || status === 'evaluated');
  const formLockReason = getFormLockReason({ isUnlocked, status, evaluationResult });

  const handleEvaluate = async (payload: EvaluateRequest) => {
    if (!canEvaluate) return;

    setActionError(null);
    setNotice(null);

    try {
      const result = await evaluateMutation.mutateAsync({
        submissionId: submission.submission_id,
        payload,
      });
      setEvaluationResult(result);
      setNotice('Đã lưu điểm. Bạn có thể unlock nếu bài nộp đạt điều kiện.');
    } catch (error) {
      setActionError(getActionError(error, 'Không thể lưu điểm. Vui lòng thử lại.'));
    }
  };

  const handleUnlock = async () => {
    if (!canUnlock) return;

    setActionError(null);
    setNotice(null);

    try {
      const result = await unlockMutation.mutateAsync({
        submissionId: submission.submission_id,
      });
      setUnlockResult(result);
      setNotice('Đã unlock ứng viên và ghi nhận vào luồng Dynamic Profile.');
    } catch (error) {
      setActionError(getActionError(error, 'Không thể unlock ứng viên. Vui lòng thử lại.'));
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-4 overflow-visible lg:h-[calc(100vh-7rem)] lg:min-h-0 lg:overflow-hidden">
      <header className="shrink-0 rounded-lg border-hairline border-border-secondary bg-background-secondary px-4 py-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Badge variant={getStatusBadgeVariant(status)}>{getStatusLabel(status)}</Badge>
              <span className="rounded-pill border-hairline border-dashed border-border-secondary bg-background-tertiary px-3 py-1 text-2xs text-foreground-tertiary">
                Ứng viên #{getAnonymousCode(submission.hash_id)}
              </span>
              {submission.data_source === 'mock' && (
                <span className="rounded-pill border-hairline border-border-secondary bg-background px-3 py-1 text-2xs text-foreground-tertiary">
                  Demo fallback
                </span>
              )}
            </div>
            <h1 className="truncate text-lg font-semibold text-foreground">
              {submission.challenge_title}
            </h1>
            <p className="mt-1 text-xs text-foreground-tertiary">
              Submission {submission.submission_id} - Nộp lúc {submittedLabel}
            </p>
          </div>

          <div className="grid shrink-0 grid-cols-2 gap-2 text-xs sm:min-w-[360px]">
            <div className="rounded-md border-hairline border-border bg-background px-3 py-2">
              <p className="text-2xs uppercase text-foreground-tertiary">Rubric</p>
              <p className="mt-0.5 font-mono text-sm text-foreground">
                {submission.criteria.length}
              </p>
            </div>
            <div className="rounded-md border-hairline border-border bg-background px-3 py-2">
              <p className="text-2xs uppercase text-foreground-tertiary">Tài liệu</p>
              <p className="mt-0.5 font-mono text-sm text-foreground">
                {submission.documents.length}
              </p>
            </div>
          </div>
        </div>
      </header>

      {notice && (
        <p className="shrink-0 rounded-lg border-hairline border-[rgba(34,197,94,0.35)] bg-success-bg px-4 py-2 text-xs text-success">
          {notice}
        </p>
      )}

      {actionError && (
        <p className="shrink-0 rounded-lg border-hairline border-[rgba(248,113,113,0.35)] bg-error-bg px-4 py-2 text-xs text-error">
          {actionError}
        </p>
      )}

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-visible lg:grid-cols-[minmax(0,1.05fr)_minmax(390px,0.95fr)] lg:overflow-hidden">
        <section className="flex min-h-[560px] flex-col gap-3 lg:min-h-0">
          <div className="flex shrink-0 items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Bài làm ứng viên</h2>
              <p className="mt-0.5 text-2xs text-foreground-tertiary">
                Chỉ hiển thị mã ẩn danh trước khi unlock.
              </p>
            </div>
          </div>

          <DocumentsTabs
            documents={submission.documents}
            activeDocIndex={safeActiveDocIndex}
            onChange={setActiveDocIndex}
          />

          <div className="min-h-0 flex-1">
            <DocumentViewer document={activeDoc} />
          </div>
        </section>

        <aside className="flex min-h-[560px] flex-col gap-4 rounded-lg border-hairline border-border-secondary bg-background-secondary p-4 lg:min-h-0">
          <div className="shrink-0">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-md font-semibold text-foreground">Bảng chấm điểm</h2>
              {evaluationResult && (
                <span className="rounded-md border-hairline border-[rgba(34,197,94,0.35)] bg-success-bg px-2 py-1 font-mono text-xs text-success">
                  {evaluationResult.total_score}
                </span>
              )}
            </div>
          </div>

          <div className="min-h-0 flex-1">
            <RubricScoringForm
              criteria={submission.criteria}
              onSubmit={handleEvaluate}
              isSubmitting={evaluateMutation.isPending}
              readOnly={!canEvaluate}
              disabledReason={formLockReason}
            />
          </div>

          <UnlockPanel
            submission={submission}
            evaluationResult={evaluationResult}
            unlockResult={unlockResult}
            canUnlock={canUnlock}
            isUnlocking={unlockMutation.isPending}
            onUnlock={handleUnlock}
            onSaveToTalentPoolMutation={addToTalentPoolMutation} // Pass mutation
          />
        </aside>
      </div>
    </div>
  );
}
