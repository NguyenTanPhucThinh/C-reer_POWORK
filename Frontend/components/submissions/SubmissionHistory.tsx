'use client';

import { Button, Badge } from '@/components/ui';
import { cn } from '@/lib/utils/cn';
import { formatFileSize, getFileExtension } from '@/lib/utils/file';

export type SubmissionStatus = 'pending' | 'processing' | 'accepted' | 'rejected' | 'failed';

export interface SubmissionItem {
  id: string;
  fileName: string;
  submittedAt: string | Date;
  status: SubmissionStatus;
  version?: number;
  fileSize?: number;
  note?: string;
  originalFileName?: string;
  downloadUrl?: string;
}

export interface SubmissionHistoryProps {
  submissions?: SubmissionItem[];
  isLoading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  onCreateFirstSubmission?: () => void;
  className?: string;
}

type BadgeVariant = 'open' | 'blind' | 'done' | 'fail' | 'invited';

const STATUS_META: Record<
  SubmissionStatus,
  {
    label: string;
    badgeVariant: BadgeVariant;
    badgeClassName?: string;
    dotColor: string;
  }
> = {
  pending: {
    label: 'Đang chờ xử lý',
    badgeVariant: 'blind',
    dotColor: '#f59e0b',
  },
  processing: {
    label: 'Đang kiểm tra',
    badgeVariant: 'done',
    dotColor: '#60a5fa',
  },
  accepted: {
    label: 'Đã ghi nhận',
    badgeVariant: 'open',
    dotColor: '#22c55e',
  },
  rejected: {
    label: 'Bị từ chối',
    badgeVariant: 'fail',
    dotColor: '#9c9a92',
  },
  failed: {
    label: 'Bị chặn bảo mật',
    badgeVariant: 'fail',
    badgeClassName: 'bg-error-bg text-error border-[rgba(248,113,113,0.3)]',
    dotColor: '#f87171',
  },
};

function formatSubmittedAt(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function getSubmissionTime(value: string | Date): number {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

function SubmissionSkeleton() {
  return (
    <div className="space-y-4">
      {[0, 1, 2].map((item) => (
        <div key={item} className="grid grid-cols-[28px_1fr] gap-4">
          <div className="flex justify-center">
            <span className="mt-2 h-3 w-3 animate-pulse rounded-full bg-background-tertiary" />
          </div>
          <div className="h-24 animate-pulse rounded-lg border-hairline border-border bg-background-tertiary" />
        </div>
      ))}
    </div>
  );
}

export function SubmissionHistory({
  submissions = [],
  isLoading = false,
  error = null,
  onRefresh,
  onCreateFirstSubmission,
  className,
}: SubmissionHistoryProps) {
  const sortedSubmissions = [...submissions].sort(
    (left, right) => getSubmissionTime(right.submittedAt) - getSubmissionTime(left.submittedAt)
  );
  const hasSubmissions = sortedSubmissions.length > 0;

  return (
    <section className={cn('flex min-h-0 flex-1 flex-col', className)}>
      <div className="mb-4 flex shrink-0 flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="sec-label mb-0">Dòng thời gian</span>
          <h2 className="text-2xl font-semibold text-foreground">Lịch sử nộp bài</h2>
        </div>
        <span className="text-xs text-foreground-secondary">
          {hasSubmissions ? `${sortedSubmissions.length} phiên bản` : 'Chưa có phiên bản'}
        </span>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        {isLoading && <SubmissionSkeleton />}

        {!isLoading && error && (
          <div className="rounded-lg border-hairline border-[rgba(248,113,113,0.35)] bg-error-bg p-4">
            <p className="text-sm font-medium text-error">{error}</p>
            {onRefresh && (
              <Button type="button" variant="danger" size="sm" className="mt-3" onClick={onRefresh}>
                Thử lại
              </Button>
            )}
          </div>
        )}

        {!isLoading && !error && !hasSubmissions && (
          <div className="flex min-h-52 flex-col items-center justify-center rounded-lg border-hairline border-dashed border-border-secondary bg-background-secondary px-4 py-8 text-center">
            <h3 className="text-lg font-semibold text-foreground">Bạn chưa có bài nộp nào</h3>
            <p className="mt-2 max-w-md text-sm text-foreground-secondary">
              Hãy nộp phiên bản đầu tiên để bắt đầu quá trình đánh giá ẩn danh.
            </p>
            {onCreateFirstSubmission && (
              <Button
                type="button"
                variant="primary"
                size="lg"
                className="mt-5"
                onClick={onCreateFirstSubmission}
              >
                Nộp bài đầu tiên
              </Button>
            )}
          </div>
        )}

        {!isLoading && !error && hasSubmissions && (
          <ol className="pb-2">
            {sortedSubmissions.map((submission, index) => {
              const statusMeta = STATUS_META[submission.status];
              const nextStatusMeta = sortedSubmissions[index + 1]
                ? STATUS_META[sortedSubmissions[index + 1].status]
                : null;
              const extension = getFileExtension(submission.fileName) || 'file';
              const isLast = index === sortedSubmissions.length - 1;

              return (
                <li
                  key={submission.id}
                  className="relative grid grid-cols-[28px_1fr] gap-4 pb-5 last:pb-0"
                >
                  <div className="relative flex justify-center">
                    <span
                      className="relative z-10 mt-2 h-3 w-3 rounded-full border-2 border-background-secondary"
                      style={{
                        backgroundColor: statusMeta.dotColor,
                        boxShadow: `0 0 0 4px ${statusMeta.dotColor}26`,
                      }}
                    />
                    {!isLast && nextStatusMeta && (
                      <span
                        className="absolute left-1/2 top-6 h-[calc(100%-10px)] w-0.5 -translate-x-1/2 rounded-full"
                        style={{
                          background: `linear-gradient(180deg, ${statusMeta.dotColor} 0%, ${nextStatusMeta.dotColor} 100%)`,
                          opacity: 0.72,
                        }}
                      />
                    )}
                  </div>

                  <article className="rounded-lg border-hairline border-border bg-background-secondary p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="max-w-full truncate text-md font-semibold text-foreground">
                            {submission.fileName}
                          </h3>
                          {typeof submission.version === 'number' && (
                            <span className="tag">Lần {submission.version}</span>
                          )}
                        </div>
                        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-foreground-secondary">
                          <span>{extension.toUpperCase()}</span>
                          {typeof submission.fileSize === 'number' && (
                            <span>{formatFileSize(submission.fileSize)}</span>
                          )}
                          <span>{formatSubmittedAt(submission.submittedAt)}</span>
                          <span className="font-mono text-foreground-tertiary">
                            {submission.id}
                          </span>
                        </div>
                        {submission.originalFileName &&
                          submission.originalFileName !== submission.fileName && (
                            <p className="mt-2 text-xs text-foreground-tertiary">
                              File gốc: {submission.originalFileName}
                            </p>
                          )}
                        {submission.note && (
                          <p className="mt-3 rounded-md border-hairline border-border bg-background px-3 py-2 text-sm text-foreground-secondary">
                            {submission.note}
                          </p>
                        )}
                      </div>

                      <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
                        <Badge
                          variant={statusMeta.badgeVariant}
                          className={cn('whitespace-nowrap', statusMeta.badgeClassName)}
                        >
                          {statusMeta.label}
                        </Badge>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2 border-t-hairline border-border pt-3">
                      {submission.downloadUrl && (
                        <a
                          href={submission.downloadUrl}
                          download={submission.fileName}
                          className="btn-base text-xs"
                        >
                          Tải xuống
                        </a>
                      )}
                      <button type="button" className="btn-base text-xs">
                        Xem chi tiết
                      </button>
                      <button
                        type="button"
                        className="btn-base text-xs"
                        onClick={() => navigator.clipboard?.writeText(submission.id)}
                      >
                        Sao chép mã
                      </button>
                    </div>
                  </article>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </section>
  );
}
