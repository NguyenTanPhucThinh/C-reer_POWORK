'use client';

import { useMemo } from 'react';
import type { TalentPoolEntry, TalentPoolStatus } from '@/lib/types/talent-pool';

interface CandidateCardProps {
  entry: TalentPoolEntry;
  onStatusChange?: (poolId: string, newStatus: TalentPoolStatus) => void;
  onViewProfile?: (entry: TalentPoolEntry) => void;
}

// Vòng cung điểm dạng đồng hồ: tô theo tỉ lệ điểm/100
function ScoreGauge({ score }: { score: number }) {
  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.max(0, Math.min(100, score)) / 100;
  const offset = circumference * (1 - pct);

  const stroke =
    score >= 90
      ? 'var(--color-success)'
      : score >= 80
        ? 'var(--color-info)'
        : 'var(--color-warning)';

  return (
    <div className="relative h-16 w-16 shrink-0" title="Điểm thử thách cao nhất">
      <svg viewBox="0 0 64 64" className="h-16 w-16 -rotate-90">
        <circle
          cx="32"
          cy="32"
          r={radius}
          fill="none"
          stroke="var(--color-border-subtle)"
          strokeWidth="6"
        />
        <circle
          cx="32"
          cy="32"
          r={radius}
          fill="none"
          stroke={stroke}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
        <span className="text-base font-bold text-foreground">{score.toFixed(0)}</span>
        <span className="text-[9px] font-medium text-foreground-tertiary">/100</span>
      </div>
    </div>
  );
}

export function CandidateCard({ entry, onStatusChange, onViewProfile }: CandidateCardProps) {
  const { candidate, highest_score, challenges_taken, status, pool_id } = entry;
  const invited = status === 'INVITED';

  const initials = useMemo(() => {
    if (!candidate.full_name) return 'UV';
    const parts = candidate.full_name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }, [candidate.full_name]);

  const toggleStatus = () => {
    onStatusChange?.(pool_id, invited ? 'IN_POOL' : 'INVITED');
  };

  return (
    <article className="card group transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-md">
      {/* Header: Avatar + tên + vòng điểm */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3.5">
          <div className="relative shrink-0">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-accent-bg text-base font-semibold text-accent">
              {initials}
            </span>
            <span
              className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background-secondary ${
                invited ? 'bg-info' : 'bg-success'
              }`}
              title={invited ? 'Đã gửi lời mời' : 'Đang trong pool'}
            />
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="truncate text-lg font-bold text-foreground transition-colors group-hover:text-accent">
              {candidate.full_name}
            </h3>
            <p className="mt-0.5 truncate text-xs text-foreground-tertiary">
              {candidate.university || 'Chưa cập nhật trường'}
              {candidate.year ? ` · ${candidate.year}` : ''}
            </p>
          </div>
        </div>

        <ScoreGauge score={highest_score} />
      </div>

      {/* Thử thách + kỹ năng: chip phẳng, không viền */}
      <div className="mt-4 flex flex-wrap gap-1.5">
        {challenges_taken?.map((challenge) => (
          <span
            key={challenge}
            className="inline-flex items-center rounded-md bg-background-tertiary px-2 py-0.5 text-xs text-foreground-secondary"
          >
            {challenge}
          </span>
        ))}
        {candidate.primary_skills?.map((skill) => (
          <span
            key={skill}
            className="inline-flex items-center rounded-md bg-accent-bg px-2 py-0.5 text-xs font-medium text-accent"
          >
            {skill}
          </span>
        ))}
      </div>

      {/* Footer: tag trạng thái bấm được (toggle) + View Profile */}
      <div className="mt-5 flex items-center justify-between gap-3 border-t border-border/60 pt-3.5">
        <button
          type="button"
          onClick={toggleStatus}
          title="Bấm để đổi trạng thái"
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
            invited
              ? 'bg-info-bg text-info hover:bg-info/20'
              : 'bg-success-bg text-success hover:bg-success/20'
          }`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${invited ? 'bg-info' : 'bg-success'}`} />
          {invited ? 'Invited' : 'In Pool'}
        </button>

        <button
          type="button"
          onClick={() => onViewProfile?.(entry)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition-all duration-150 hover:bg-accent-hover active:scale-95"
        >
          <span>View Profile</span>
          <svg
            className="h-3.5 w-3.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </article>
  );
}
