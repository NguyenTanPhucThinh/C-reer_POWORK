'use client';

import type { RecentActivity } from '@/lib/types/talent-pool';
import {
  ChartIcon,
  InboxIcon,
  MailIcon,
  RefreshIcon,
  RocketIcon,
  TrophyIcon,
} from '@/components/layout/SidebarIcons';

interface RecentActivitiesCardProps {
  activities: RecentActivity[];
  onSuggestedActionClick?: (actionType: string) => void;
}

export function RecentActivitiesCard({
  activities,
  onSuggestedActionClick,
}: RecentActivitiesCardProps) {
  return (
    <div className="space-y-4">
      {/* Recent Activities Section */}
      <div className="rounded-xl bg-background-secondary p-4 shadow-sm">
        <h3 className="flex items-center gap-2 pb-3 text-base font-bold text-foreground">
          <span className="flex h-2 w-2 rounded-full bg-success animate-pulse" />
          Hoạt động gần đây
        </h3>

        <div className="mt-3 space-y-3">
          {activities.length === 0 ? (
            <p className="text-xs text-foreground-tertiary text-center py-2">
              Chưa có hoạt động gần đây.
            </p>
          ) : (
            activities.map((act) => (
              <div key={act.id} className="flex items-start gap-2.5 text-xs">
                <div className="mt-0.5 shrink-0">
                  {act.type === 'invited' && (
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-info-bg text-info">
                      <MailIcon className="h-3.5 w-3.5" />
                    </span>
                  )}
                  {act.type === 'added_to_pool' && (
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-success-bg text-success">
                      <InboxIcon className="h-3.5 w-3.5" />
                    </span>
                  )}
                  {act.type === 'challenge_completed' && (
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-warning-bg text-warning">
                      <TrophyIcon className="h-3.5 w-3.5" />
                    </span>
                  )}
                  {act.type === 'status_change' && (
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent-bg text-accent">
                      <RefreshIcon className="h-3.5 w-3.5" />
                    </span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-xs leading-snug text-foreground-secondary">
                    <span className="font-semibold text-foreground">{act.candidate_name}</span>{' '}
                    {act.action}
                  </p>
                  <span className="text-2xs text-foreground-tertiary">{act.timestamp}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Suggested Actions Card */}
      <div className="rounded-xl bg-accent-bg/60 p-4 shadow-sm">
        <h3 className="flex items-center gap-1.5 text-base font-bold text-accent">
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
          </svg>
          Gợi ý hành động
        </h3>

        <div className="mt-3 space-y-2">
          <button
            type="button"
            onClick={() => onSuggestedActionClick?.('invite_top')}
            className="group flex w-full items-center gap-2.5 rounded-lg bg-background-secondary p-2.5 text-left text-sm font-medium text-foreground transition-all hover:bg-background-tertiary hover:text-accent"
          >
            <RocketIcon className="h-4 w-4 shrink-0 text-accent" />
            Mời các ứng viên &gt; 90 điểm
          </button>

          <button
            type="button"
            onClick={() => onSuggestedActionClick?.('export')}
            className="group flex w-full items-center gap-2.5 rounded-lg bg-background-secondary p-2.5 text-left text-sm font-medium text-foreground transition-all hover:bg-background-tertiary hover:text-accent"
          >
            <ChartIcon className="h-4 w-4 shrink-0 text-accent" />
            Xuất báo cáo danh sách
          </button>
        </div>
      </div>
    </div>
  );
}
