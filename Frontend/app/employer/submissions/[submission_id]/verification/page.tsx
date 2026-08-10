'use client';

import axios from 'axios';
import { useParams, useRouter } from 'next/navigation';
import {
  VerificationOverview,
  VerificationQuestionAnswersSection,
  VerificationStatisticsSection,
  VerificationTimelineSection,
  VerificationVideoStatusSection,
} from '@/components/assessment';
import { Button } from '@/components/ui';
import { useVerificationDashboard } from '@/lib/hooks';

const getSubmissionId = (value: string | string[] | undefined) =>
  Array.isArray(value) ? (value[0] ?? '') : (value ?? '');

const getErrorMessage = (error: unknown) => {
  if (!axios.isAxiosError(error)) return 'Không thể tải evidence xác minh lúc này.';
  if (error.response?.status === 403)
    return 'Evidence chỉ được xem sau khi Submission đã được mở khóa.';
  if (error.response?.status === 404) return 'Submission chưa có evidence xác minh.';
  if (error.response?.status === 409) return 'Phiên xác minh chưa sẵn sàng để xem.';
  return 'Không thể tải evidence xác minh lúc này.';
};

export default function EmployerVerificationDashboardPage() {
  const router = useRouter();
  const submissionId = getSubmissionId(useParams()?.submission_id);
  const dashboard = useVerificationDashboard(submissionId);

  if (dashboard.isLoading) {
    return (
      <div
        className="mx-auto w-full max-w-[1440px] space-y-4"
        aria-label="Đang tải verification dashboard"
      >
        <div className="h-24 animate-pulse rounded-2xl bg-background-secondary" />
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="h-96 animate-pulse rounded-2xl bg-background-secondary" />
          <div className="h-96 animate-pulse rounded-2xl bg-background-secondary" />
        </div>
      </div>
    );
  }

  if (dashboard.isError || !dashboard.data) {
    return (
      <div className="mx-auto flex min-h-[480px] w-full max-w-2xl items-center justify-center">
        <div
          className="w-full rounded-2xl border border-error/35 bg-error-bg p-7 text-center"
          role="alert"
        >
          <h1 className="text-xl font-semibold text-error">Chưa thể mở verification dashboard</h1>
          <p className="mt-2 text-sm leading-6 text-foreground-secondary">
            {getErrorMessage(dashboard.error)}
          </p>
          <div className="mt-5 flex justify-center gap-3">
            <Button type="button" onClick={() => router.back()}>
              Quay lại
            </Button>
            <Button type="button" variant="primary" onClick={() => void dashboard.refetch()}>
              Thử lại
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="mx-auto w-full max-w-[1440px] space-y-5 pb-8">
      <header className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <button type="button" onClick={() => router.back()} className="back-link hover:underline">
            &larr; Quay lại Submission
          </button>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground">
            Verification evidence
          </h1>
          <p className="mt-2 text-sm text-foreground-secondary">
            Tổng hợp bằng chứng xác minh đã mở khóa cho Submission {submissionId}.
          </p>
        </div>
      </header>

      <VerificationOverview dashboard={dashboard.data} />
      <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <VerificationTimelineSection timeline={dashboard.data.timeline} />
        <VerificationStatisticsSection statistics={dashboard.data.statistics} />
      </div>
      <VerificationQuestionAnswersSection
        questions={dashboard.data.questions}
        answers={dashboard.data.answers}
      />
      <VerificationVideoStatusSection video={dashboard.data.video} />
    </main>
  );
}
