'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/hooks/useAuth';
import { NAV_BY_ROLE } from '@/lib/constants/nav';
import { RepeatIcon, SidebarNavIcon, TargetIcon, ZapIcon } from '@/components/layout/SidebarIcons';
import type { ComponentType, SVGProps } from 'react';

// Việc cần làm gợi ý cho ứng viên — tĩnh, dựa trên hành trình chinh phục thử thách
const CHECKLIST = [
  'Hoàn thiện Dynamic Profile để nhà tuyển dụng dễ tìm thấy bạn.',
  'Chọn một challenge phù hợp với kỹ năng và bắt đầu làm.',
  'Nộp bài đúng hạn để nhận đánh giá theo rubric thực chiến.',
];

const TIPS: { Icon: ComponentType<SVGProps<SVGSVGElement>>; text: string }[] = [
  { Icon: TargetIcon, text: 'Ưu tiên challenge đúng ngành bạn muốn ứng tuyển.' },
  { Icon: ZapIcon, text: 'Điểm cao mở khóa hồ sơ cho nhà tuyển dụng chủ động.' },
  { Icon: RepeatIcon, text: 'Làm nhiều thử thách để xây dựng hồ sơ bằng chứng.' },
];

export default function DashboardPage() {
  const { user } = useAuth();
  if (!user) return null;

  const shortcuts = NAV_BY_ROLE[user.role].filter((item) => item.href !== '/candidate/dashboard');

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Xin chào, {user.full_name} 👋</h1>
          <p className="mt-1 text-base text-foreground-secondary">
            Chinh phục thử thách để chứng minh năng lực thực chiến của bạn.
          </p>
        </div>
        <Link
          href="/challenges"
          className="inline-flex items-center justify-center rounded-lg bg-accent px-[18px] py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-accent-hover active:scale-95"
        >
          Khám phá challenge
        </Link>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.45fr_0.9fr]">
        {/* Truy cập nhanh */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Truy cập nhanh</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {shortcuts.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="card flex flex-col gap-3 transition-all hover:-translate-y-0.5 hover:border-accent hover:shadow-md"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-bg text-accent">
                  <SidebarNavIcon name={item.icon} className="h-5 w-5" />
                </span>
                <span className="text-md font-medium text-foreground">{item.label}</span>
              </Link>
            ))}
          </div>

          {/* Mẹo chinh phục */}
          <div className="pt-2">
            <h2 className="mb-3 text-lg font-semibold text-foreground">Mẹo cho bạn</h2>
            <div className="space-y-2.5">
              {TIPS.map((tip) => (
                <div key={tip.text} className="card flex items-center gap-3 py-3.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-bg text-accent">
                    <tip.Icon className="h-[18px] w-[18px]" />
                  </span>
                  <span className="text-sm text-foreground-secondary">{tip.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Việc cần làm */}
        <aside className="space-y-6">
          <div>
            <h2 className="mb-3 text-lg font-semibold text-foreground">Việc cần làm</h2>
            <div className="space-y-2">
              {CHECKLIST.map((item, idx) => (
                <div key={item} className="card flex items-start gap-3 py-4">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-bg text-2xs font-bold text-accent">
                    {idx + 1}
                  </span>
                  <span className="text-sm text-foreground-secondary">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="mb-3 text-lg font-semibold text-foreground">Hoạt động gần đây</h2>
            <div className="card text-sm text-foreground-secondary">Chưa có hoạt động gần đây.</div>
          </div>
        </aside>
      </section>
    </div>
  );
}
