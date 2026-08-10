import type {
  VerificationScanStatus,
  VerificationSummary,
  VerificationSummaryStatus,
} from '@/lib/types';

interface VerificationSummaryCardProps {
  summary?: VerificationSummary;
  isLoading: boolean;
  isError: boolean;
  isUnlocked: boolean;
  onRetry: () => void;
}

const statusDetails: Record<
  VerificationSummaryStatus,
  { label: string; description: string; tone: string; dot: string }
> = {
  NotStarted: {
    label: 'Chưa bắt đầu',
    description: 'Candidate chưa bắt đầu phiên xác minh sau khi nộp bài.',
    tone: 'border-border-secondary bg-background-tertiary',
    dot: 'bg-foreground-tertiary',
  },
  PendingCamera: {
    label: 'Đang chuẩn bị',
    description: 'Candidate đang chuẩn bị camera và microphone cho phiên xác minh.',
    tone: 'border-info/35 bg-info-bg',
    dot: 'bg-info',
  },
  CameraActive: {
    label: 'Đang trình bày',
    description: 'Candidate đang thực hiện phần trình bày qua camera.',
    tone: 'border-info/35 bg-info-bg',
    dot: 'bg-info',
  },
  GeneratingQuestions: {
    label: 'Đang tạo câu hỏi',
    description: 'Hệ thống đang chuẩn bị bộ câu hỏi tự luận cho Candidate.',
    tone: 'border-info/35 bg-info-bg',
    dot: 'bg-info',
  },
  Answering: {
    label: 'Đang trả lời',
    description: 'Candidate đang hoàn thiện phần trả lời tự luận.',
    tone: 'border-info/35 bg-info-bg',
    dot: 'bg-info',
  },
  PendingUpload: {
    label: 'Chờ tải video',
    description: 'Phiên xác minh đang chờ video được tải lên hoàn tất.',
    tone: 'border-warning/35 bg-warning-bg',
    dot: 'bg-warning',
  },
  PendingScan: {
    label: 'Đang kiểm tra video',
    description: 'Video đã được tiếp nhận và đang trải qua bước kiểm tra an toàn.',
    tone: 'border-warning/35 bg-warning-bg',
    dot: 'bg-warning',
  },
  Ready: {
    label: 'Xác minh sẵn sàng',
    description: 'Phiên xác minh đã hoàn tất và video đã vượt qua kiểm tra an toàn.',
    tone: 'border-success/35 bg-success-bg',
    dot: 'bg-success',
  },
  Rejected: {
    label: 'Video không được chấp nhận',
    description: 'Video xác minh không vượt qua bước kiểm tra an toàn.',
    tone: 'border-error/35 bg-error-bg',
    dot: 'bg-error',
  },
  ScanFailed: {
    label: 'Kiểm tra video gặp lỗi',
    description: 'Hệ thống chưa thể kết luận trạng thái an toàn của video xác minh.',
    tone: 'border-error/35 bg-error-bg',
    dot: 'bg-error',
  },
  Expired: {
    label: 'Phiên đã hết hạn',
    description: 'Candidate chưa hoàn tất xác minh trong thời gian cho phép.',
    tone: 'border-border-secondary bg-background-tertiary',
    dot: 'bg-foreground-tertiary',
  },
};

const scanLabels: Record<VerificationScanStatus, string> = {
  NOT_STARTED: 'Chưa bắt đầu',
  PENDING: 'Đang kiểm tra',
  SAFE: 'An toàn',
  REJECTED: 'Bị từ chối',
  SCAN_FAILED: 'Kiểm tra lỗi',
};

const formatCompletedAt = (value: string | null) => {
  if (!value) return 'Chưa hoàn tất';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Không xác định';
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
};

export function VerificationSummaryCard({
  summary,
  isLoading,
  isError,
  isUnlocked,
  onRetry,
}: VerificationSummaryCardProps) {
  if (isLoading) {
    return (
      <div
        className="h-28 shrink-0 animate-pulse rounded-xl border border-border-secondary bg-background-secondary"
        aria-label="Đang tải trạng thái xác minh"
      />
    );
  }

  if (isError || !summary) {
    return (
      <div
        className="flex shrink-0 flex-col gap-3 rounded-xl border border-error/35 bg-error-bg px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between"
        role="alert"
      >
        <div>
          <p className="font-semibold text-error">Không thể tải trạng thái xác minh</p>
          <p className="mt-1 text-xs text-foreground-secondary">
            Bài làm vẫn có thể được xem; hãy thử tải lại phần xác minh.
          </p>
        </div>
        <button
          type="button"
          onClick={onRetry}
          className="text-xs font-semibold text-error underline underline-offset-4"
        >
          Thử lại
        </button>
      </div>
    );
  }

  const details = statusDetails[summary.status];
  const description =
    summary.status === 'Ready' && !isUnlocked
      ? 'Xác minh đã sẵn sàng. Nội dung chi tiết chỉ xuất hiện sau khi Submission được mở khóa.'
      : details.description;

  return (
    <section
      className={`shrink-0 rounded-xl border px-4 py-4 ${details.tone}`}
      aria-labelledby="verification-summary-title"
    >
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={`h-2.5 w-2.5 shrink-0 rounded-full ${details.dot}`}
              aria-hidden="true"
            />
            <h2 id="verification-summary-title" className="text-sm font-semibold text-foreground">
              Xác minh sau nộp bài · {details.label}
            </h2>
          </div>
          <p className="mt-1.5 text-xs leading-5 text-foreground-secondary">{description}</p>
        </div>

        <dl className="grid shrink-0 grid-cols-3 gap-2 text-xs xl:min-w-[480px]">
          <div className="rounded-lg border border-border/80 bg-background/65 px-3 py-2">
            <dt className="text-2xs uppercase tracking-wide text-foreground-tertiary">Câu hỏi</dt>
            <dd className="mt-1 font-semibold text-foreground">{summary.questionCount}</dd>
          </div>
          <div className="rounded-lg border border-border/80 bg-background/65 px-3 py-2">
            <dt className="text-2xs uppercase tracking-wide text-foreground-tertiary">Video</dt>
            <dd className="mt-1 font-semibold text-foreground">{scanLabels[summary.scanStatus]}</dd>
          </div>
          <div className="rounded-lg border border-border/80 bg-background/65 px-3 py-2">
            <dt className="text-2xs uppercase tracking-wide text-foreground-tertiary">Hoàn tất</dt>
            <dd
              className="mt-1 truncate font-semibold text-foreground"
              title={formatCompletedAt(summary.completedAt)}
            >
              {formatCompletedAt(summary.completedAt)}
            </dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
