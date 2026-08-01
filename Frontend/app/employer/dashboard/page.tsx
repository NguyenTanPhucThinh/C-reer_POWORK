'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/hooks/useAuth';
import { useChallenges } from '@/lib/hooks/useChallenges';
import { Badge } from '@/components/ui';
import {
  ClipboardIcon,
  CreateIcon,
  SubmissionIcon,
  UsersIcon,
} from '@/components/layout/SidebarIcons';

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Chưa có hạn';
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

export default function EmployerDashboardPage() {
  const { user } = useAuth();
  const { data: challenges = [], isLoading, isError, error } = useChallenges();

  const nextDeadline = useMemo(() => {
    if (challenges.length === 0) return 'Chưa có';
    const sorted = [...challenges].sort(
      (a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
    );
    return formatDate(sorted[0].deadline);
  }, [challenges]);

  if (user && user.role !== 'Employer') {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="card text-center">
          <h2 className="text-lg font-semibold text-foreground">Không có quyền truy cập</h2>
          <p className="mt-2 text-sm text-foreground-secondary">
            Dashboard tuyển dụng chỉ dành cho tài khoản Nhà tuyển dụng.
          </p>
          <Link
            href="/candidate/dashboard"
            className="mt-4 inline-flex items-center justify-center rounded-lg border-hairline border-[rgba(124,111,247,0.35)] bg-accent-bg px-[13px] py-1.5 text-xs font-medium text-accent transition-colors hover:opacity-90"
          >
            Về dashboard của tôi
          </Link>
        </div>
      </div>
    );
  }

  const stats = [
    { label: 'Challenge đang mở', value: challenges.length, tone: 'text-success' },
    { label: 'Bài nộp chờ chấm', value: 0, tone: 'text-warning' },
    { label: 'Hồ sơ đã unlock', value: 0, tone: 'text-info' },
    { label: 'Hạn gần nhất', value: nextDeadline, tone: 'text-accent' },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h2 className="text-3xl font-semibold text-foreground">
            Xin chào, {user?.full_name ?? 'Nhà tuyển dụng'}
          </h2>
          <p className="mt-1 text-base text-foreground-secondary">
            Quản lý challenge, đánh giá bài nộp và xây dựng talent pool từ bằng chứng thực chiến.
          </p>
        </div>
        <Link
          href="/employer/challenges/create"
          className="inline-flex items-center justify-center rounded-lg border-hairline border-[rgba(124,111,247,0.35)] bg-accent-bg px-[18px] py-2 text-sm font-medium text-accent transition-colors hover:opacity-90"
        >
          + Tạo challenge
        </Link>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="card-outer-shell relative overflow-hidden">
            <div className="card-base h-full w-full">
              <p className="text-sm font-medium text-foreground-secondary">{stat.label}</p>
              <p className={`mt-3 text-3xl font-semibold ${stat.tone}`}>{stat.value}</p>
            </div>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.45fr_0.9fr]">
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-foreground">Challenge đang hoạt động</h3>
            <Link
              href="/employer/challenges/create"
              className="text-sm font-medium text-accent hover:underline"
            >
              Tạo mới
            </Link>
          </div>

          {isLoading && (
            <div className="card text-sm text-foreground-secondary">Đang tải thử thách...</div>
          )}

          {isError && (
            <div className="card text-sm text-error">
              {error?.message || 'Không thể tải danh sách thử thách.'}
            </div>
          )}

          {!isLoading && !isError && challenges.length === 0 && (
            <div className="card text-sm text-foreground-secondary">
              Chưa có thử thách nào được tạo.
            </div>
          )}

          {!isLoading &&
            !isError &&
            challenges.map((challenge) => (
              <article key={challenge.challenge_id} className="card">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="truncate text-md font-semibold text-foreground">
                        {challenge.title}
                      </h4>
                      <Badge variant="open">Đang mở</Badge>
                    </div>
                    <p className="mt-1 text-sm text-foreground-secondary">
                      {challenge.industry} · {challenge.company_name}
                    </p>
                  </div>
                  <div className="shrink-0 text-left sm:text-right">
                    <p className="text-2xs font-medium uppercase text-foreground-tertiary">
                      Hạn chót
                    </p>
                    <p className="text-sm text-foreground">{formatDate(challenge.deadline)}</p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-foreground-secondary">
                  <span>ID: {challenge.challenge_id.slice(0, 8)}</span>
                  <span>0 bài nộp mới</span>
                  <span>0 hồ sơ chờ unlock</span>
                </div>
              </article>
            ))}
        </div>

        <aside className="space-y-6">
          <div>
            <h3 className="mb-3 text-lg font-semibold text-foreground">Truy cập nhanh</h3>
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { label: 'Tạo challenge', href: '/employer/challenges/create', Icon: CreateIcon },
                { label: 'Talent Pool', href: '/talent-pool', Icon: UsersIcon },
                { label: 'Tất cả challenge', href: '/challenges', Icon: ClipboardIcon },
                { label: 'Bài nộp', href: '/employer/submissions', Icon: SubmissionIcon },
              ].map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="card flex flex-col gap-2 py-3.5 transition-all hover:-translate-y-0.5 hover:border-accent hover:shadow-md"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-bg text-accent">
                    <action.Icon className="h-5 w-5" />
                  </span>
                  <span className="text-xs font-medium text-foreground">{action.label}</span>
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-lg font-semibold text-foreground">Việc cần làm</h3>
            <div className="space-y-2">
              {[
                'Tạo challenge đầu tiên cho vị trí đang tuyển.',
                'Kiểm tra rubric để bảo đảm tổng trọng số bằng 100%.',
                'Theo dõi bài nộp mới và mở hồ sơ ứng viên phù hợp.',
              ].map((item) => (
                <div key={item} className="card py-4 text-sm text-foreground-secondary">
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-lg font-semibold text-foreground">Hoạt động gần đây</h3>
            <div className="card text-sm text-foreground-secondary">Chưa có hoạt động gần đây.</div>
          </div>
        </aside>
      </section>
    </div>
  );
}
