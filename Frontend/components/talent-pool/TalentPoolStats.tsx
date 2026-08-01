'use client';

interface TalentPoolStatsProps {
  totalCandidates: number;
  invitedCount: number;
  inPoolCount: number;
  highScorerCount: number;
}

export function TalentPoolStats({
  totalCandidates,
  invitedCount,
  inPoolCount,
  highScorerCount,
}: TalentPoolStatsProps) {
  return (
    <div className="space-y-4">
      {/* Title Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">Thống kê</h2>
        <span className="inline-flex items-center rounded-full bg-accent-bg px-2 py-0.5 text-2xs font-semibold text-accent">
          Realtime
        </span>
      </div>

      {/* Main KPI Stats Cards */}
      <div className="grid grid-cols-2 gap-3">
        {/* Total Candidates */}
        <div className="rounded-xl bg-background-secondary p-4 shadow-sm transition-all hover:bg-background-tertiary">
          <div className="flex items-center justify-between text-foreground-tertiary">
            <span className="text-xs font-medium">Tổng ứng viên</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-bg text-accent">
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-foreground">{totalCandidates}</span>
            <span className="text-2xs text-foreground-tertiary">ứng viên</span>
          </div>
          <p className="mt-1 text-2xs text-foreground-tertiary">
            {inPoolCount} sẵn sàng trong pool
          </p>
        </div>

        {/* Invited Candidates */}
        <div className="rounded-xl bg-background-secondary p-4 shadow-sm transition-all hover:bg-background-tertiary">
          <div className="flex items-center justify-between text-foreground-tertiary">
            <span className="text-xs font-medium">Đã Invite</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-info-bg text-info">
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M22 2L11 13" />
                <path d="M22 2l-7 20-4-9-9-4 20-7z" />
              </svg>
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-info">{invitedCount}</span>
            <span className="text-2xs text-foreground-tertiary">lời mời</span>
          </div>
          <p className="mt-1 text-2xs text-foreground-tertiary">
            {totalCandidates > 0 ? Math.round((invitedCount / totalCandidates) * 100) : 0}% tỉ lệ
            chuyển đổi
          </p>
        </div>
      </div>

      {/* Top Performers Card */}
      <div className="rounded-xl bg-background-secondary p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-warning-bg text-warning">
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                <path d="M4 22h16" />
                <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
                <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
                <path d="M18 2H6v7a6 6 0 0 0 12 0V2z" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-foreground">Ứng viên xuất sắc</h3>
          </div>
          <span className="text-lg font-bold text-warning">{highScorerCount}</span>
        </div>
      </div>
    </div>
  );
}
