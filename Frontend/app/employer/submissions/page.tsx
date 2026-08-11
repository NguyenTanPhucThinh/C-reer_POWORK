'use client';

import Link from 'next/link';
import { useEmployerOverview } from '@/lib/hooks/useEmployerOverview';

function formatSubmittedAt(value?: string) {
  if (!value) return 'Chưa rõ thời gian';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export default function EmployerSubmissionsPage() {
  const { data, isLoading, isError, isReviewQueueLoading, hasReviewQueueError, refetch } =
    useEmployerOverview();
  const loading = isLoading || isReviewQueueLoading;
  const failed = isError || hasReviewQueueError;

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
          Review Queue
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-foreground">Bài nộp chờ chấm</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-foreground-secondary">
          Bài làm được hiển thị bằng mã ẩn danh cho đến khi bạn hoàn tất đánh giá và unlock
          Candidate.
        </p>
      </header>

      {loading && (
        <div className="card py-10 text-center text-sm text-foreground-secondary" aria-busy="true">
          Đang tải bài nộp...
        </div>
      )}

      {!loading && failed && (
        <div className="card py-10 text-center">
          <p className="text-sm text-error">Không thể tải danh sách bài nộp.</p>
          <button
            type="button"
            onClick={() => void refetch()}
            className="mt-4 text-sm font-medium text-accent hover:underline"
          >
            Thử lại
          </button>
        </div>
      )}

      {!loading && !failed && data.reviewQueue.length === 0 && (
        <div className="card py-10 text-center text-sm text-foreground-secondary">
          Hiện chưa có bài nộp nào chờ chấm.
        </div>
      )}

      {!loading && !failed && data.reviewQueue.length > 0 && (
        <section className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-background-secondary">
          {data.reviewQueue.map((submission) => (
            <article
              key={submission.submissionId}
              className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="truncate text-base font-semibold text-foreground">
                  {submission.challengeTitle}
                </p>
                <p className="mt-1 text-sm text-foreground-secondary">
                  Candidate {submission.candidateCode.slice(0, 12)} ·{' '}
                  {formatSubmittedAt(submission.submittedAt)}
                </p>
              </div>
              <Link
                href={`/employer/submissions/${submission.submissionId}/grade?challengeId=${submission.challengeId}`}
                className="inline-flex h-10 shrink-0 items-center justify-center rounded-lg bg-accent px-4 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              >
                Mở bài chấm
              </Link>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
