'use client';

import { useMemo } from 'react';
import type { TalentPoolEntry, TalentPoolStatus } from '@/lib/types/talent-pool';
import { MailIcon, RefreshIcon, TargetIcon, ZapIcon } from '@/components/layout/SidebarIcons';

interface CandidateProfileModalProps {
  entry: TalentPoolEntry | null;
  onClose: () => void;
  onStatusChange?: (poolId: string, newStatus: TalentPoolStatus) => void;
}

export function CandidateProfileModal({
  entry,
  onClose,
  onStatusChange,
}: CandidateProfileModalProps) {
  const fullName = entry?.candidate.full_name ?? '';
  const addedAt = entry?.added_at ?? '';

  const initials = useMemo(() => {
    if (!fullName) return 'UV';
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }, [fullName]);

  const formattedDate = useMemo(() => {
    if (!addedAt) return 'Chưa rõ';
    const date = new Date(addedAt);
    if (Number.isNaN(date.getTime())) return addedAt;
    return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium' }).format(date);
  }, [addedAt]);

  if (!entry) return null;

  const { candidate, highest_score, challenges_taken, status, pool_id } = entry;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-2xl border border-border bg-background-secondary p-6 shadow-2xl transition-all">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1.5 text-foreground-tertiary transition-colors hover:bg-background-tertiary hover:text-foreground"
          title="Đóng"
        >
          <svg
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        {/* Modal Header */}
        <div className="flex items-start gap-4 pr-6">
          <span className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-accent-bg text-xl font-bold text-accent">
            {initials}
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold text-foreground">{candidate.full_name}</h2>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-2xs font-semibold ${
                  status === 'INVITED' ? 'bg-info-bg text-info' : 'bg-success-bg text-success'
                }`}
              >
                {status === 'INVITED' ? 'Invited' : 'In Pool'}
              </span>
            </div>

            <p className="mt-1 text-xs text-foreground-tertiary">
              🎓 {candidate.university || 'Đại học'} {candidate.year ? `• ${candidate.year}` : ''}
            </p>
            <p className="mt-0.5 text-2xs text-foreground-tertiary">
              📅 Thêm vào pool ngày: {formattedDate}
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-4 border-t border-border pt-4">
          {/* Highest Score Banner */}
          <div className="flex items-center justify-between rounded-xl bg-success-bg/60 p-3.5">
            <span className="text-sm font-semibold text-success">Điểm đánh giá cao nhất</span>
            <span className="text-2xl font-bold text-success">{highest_score.toFixed(1)}/100</span>
          </div>

          {/* Bio / Summary */}
          {candidate.bio && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground-tertiary">
                Giới thiệu bản thân
              </h3>
              <p className="mt-1 rounded-lg bg-background p-3 text-xs leading-relaxed text-foreground-secondary">
                {candidate.bio}
              </p>
            </div>
          )}

          {/* Contact Details */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-lg bg-background p-3">
              <span className="text-2xs font-semibold uppercase text-foreground-tertiary">
                Email liên hệ
              </span>
              <p className="mt-0.5 truncate font-medium text-foreground">
                {candidate.email || 'Chưa cập nhật'}
              </p>
            </div>
            <div className="rounded-lg bg-background p-3">
              <span className="text-2xs font-semibold uppercase text-foreground-tertiary">
                Địa điểm
              </span>
              <p className="mt-0.5 truncate font-medium text-foreground">
                {candidate.location || 'Việt Nam'}
              </p>
            </div>
          </div>

          {/* Completed Challenges */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground-tertiary mb-2">
              Thử thách đã hoàn thành ({challenges_taken.length})
            </h3>
            <div className="space-y-1.5">
              {challenges_taken.map((challenge, idx) => (
                <div
                  key={`${challenge}-${idx}`}
                  className="flex items-center justify-between rounded-lg bg-background px-3 py-2 text-xs"
                >
                  <span className="flex items-center gap-1.5 font-medium text-foreground">
                    <TargetIcon className="h-3.5 w-3.5 shrink-0 text-accent" />
                    {challenge}
                  </span>
                  <span className="rounded-md bg-success-bg px-2 py-0.5 text-2xs font-semibold text-success">
                    Đã chấm
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Primary Skills */}
          {candidate.primary_skills && candidate.primary_skills.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground-tertiary mb-2">
                Kỹ năng chuyên môn
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {candidate.primary_skills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1.5 rounded-full bg-accent-bg px-3 py-1 text-xs font-medium text-accent"
                  >
                    <ZapIcon className="h-3.5 w-3.5 shrink-0" />
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer / Actions */}
        <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
          <button
            type="button"
            onClick={() => onStatusChange?.(pool_id, status === 'INVITED' ? 'IN_POOL' : 'INVITED')}
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-accent-hover active:scale-95"
          >
            {status === 'INVITED' ? (
              <>
                <RefreshIcon className="h-4 w-4" />
                Chuyển về In Pool
              </>
            ) : (
              <>
                <MailIcon className="h-4 w-4" />
                Gửi lời mời
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-elevated px-4 py-2 text-xs font-medium text-foreground hover:bg-background-tertiary"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
