'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Avatar, Badge } from '@/components/ui';
import { useEmployerOverview } from '@/lib/hooks/useEmployerOverview';
import { useEmployerWorkspace } from '@/lib/hooks/useEmployerWorkspace';
import { useTheme } from '@/components/theme/ThemeProvider';
import {
  ACTIVITY_LABELS,
  EMPLOYER_COPY,
  METRIC_LABELS,
  SETTINGS_LABELS,
  TASK_LABELS,
} from '@/lib/constants/employerOverview';
import type {
  BookmarkFilter,
  OverviewMetricKey,
  SettingsSection,
} from '@/lib/types/employerOverview';
import type { User } from '@/lib/types';

const METRIC_KEYS: OverviewMetricKey[] = [
  'activeChallenges',
  'pendingReviews',
  'unlockedProfiles',
  'nextDeadline',
];
const SETTINGS_SECTIONS: SettingsSection[] = [
  'profile',
  'members',
  'notifications',
  'appearance',
  'privacy',
];
const BOOKMARK_FILTERS: { key: BookmarkFilter; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'active', label: 'Đang hoạt động' },
  { key: 'endingSoon', label: 'Sắp hết hạn' },
];
const SESSION_NOW = Date.now();

function formatDate(value?: string) {
  if (!value) return 'Chưa có';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Chưa có';
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

function formatRelativeTime(value?: string) {
  if (!value) return 'Không rõ thời gian';
  const minutes = Math.max(0, Math.round((SESSION_NOW - new Date(value).getTime()) / 60_000));
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  return `${Math.round(hours / 24)} ngày trước`;
}

function daysRemaining(value: string) {
  return Math.ceil((new Date(value).getTime() - SESSION_NOW) / 86_400_000);
}

function PlusIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-4 w-4"
    >
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  );
}

function MetricCard({
  metricKey,
  value,
  href,
}: {
  metricKey: OverviewMetricKey;
  value: string | number;
  href: string;
}) {
  const copy = METRIC_LABELS[metricKey];
  const tone =
    metricKey === 'activeChallenges'
      ? 'text-success'
      : metricKey === 'pendingReviews'
        ? 'text-warning'
        : metricKey === 'unlockedProfiles'
          ? 'text-info'
          : 'text-accent';
  return (
    <Link
      href={href}
      className="card flex min-h-[142px] flex-col transition-colors hover:border-border-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
    >
      <div className="flex items-center gap-3">
        <span aria-hidden="true" className={`h-3 w-3 rounded-sm border-2 border-current ${tone}`} />
        <p className="text-sm font-medium text-foreground">{copy.label}</p>
      </div>
      <p className={`mt-4 text-3xl font-semibold ${tone}`}>{value}</p>
      <p className="mt-auto pt-2 text-sm text-foreground-tertiary">{copy.description}</p>
    </Link>
  );
}

function SectionHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      {action}
    </div>
  );
}

function WorkspaceSettingsPanel() {
  const { settings, updateSettings } = useEmployerWorkspace();
  const { setTheme } = useTheme();
  const [section, setSection] = useState<SettingsSection>('profile');
  const [memberEmail, setMemberEmail] = useState('');
  const [saved, setSaved] = useState(false);

  const addMember = () => {
    const email = memberEmail.trim().toLowerCase();
    if (!email || settings.memberEmails.includes(email)) return;
    updateSettings({ memberEmails: [...settings.memberEmails, email] });
    setMemberEmail('');
  };

  return (
    <section id="settings" className="scroll-mt-20">
      <SectionHeader title={EMPLOYER_COPY.settings} />
      <div className="card p-0">
        <div className="flex overflow-x-auto border-b border-border px-2">
          {SETTINGS_SECTIONS.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setSection(key)}
              className={`h-11 shrink-0 border-b-2 px-3 text-sm font-medium ${section === key ? 'border-accent text-foreground' : 'border-transparent text-foreground-secondary hover:text-foreground'}`}
            >
              {SETTINGS_LABELS[key]}
            </button>
          ))}
        </div>
        <form
          className="space-y-4 p-5"
          onSubmit={(event) => {
            event.preventDefault();
            setSaved(true);
          }}
        >
          {section === 'profile' && (
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm text-foreground-secondary">
                Workspace name
                <input
                  value={settings.workspaceName}
                  onChange={(event) => updateSettings({ workspaceName: event.target.value })}
                  className="mt-1.5 h-10 w-full rounded-lg border border-border-secondary bg-input px-3 text-foreground outline-none focus:ring-2 focus:ring-focus"
                />
              </label>
              <label className="text-sm text-foreground-secondary">
                Company name
                <input
                  value={settings.companyName}
                  onChange={(event) => updateSettings({ companyName: event.target.value })}
                  className="mt-1.5 h-10 w-full rounded-lg border border-border-secondary bg-input px-3 text-foreground outline-none focus:ring-2 focus:ring-focus"
                />
              </label>
            </div>
          )}
          {section === 'members' && (
            <div>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={memberEmail}
                  onChange={(event) => setMemberEmail(event.target.value)}
                  placeholder="member@company.com"
                  className="h-10 min-w-0 flex-1 rounded-lg border border-border-secondary bg-input px-3 text-foreground outline-none focus:ring-2 focus:ring-focus"
                />
                <button
                  type="button"
                  onClick={addMember}
                  className="h-10 rounded-lg border border-border-secondary px-4 text-sm font-medium text-foreground hover:bg-background-tertiary"
                >
                  Thêm
                </button>
              </div>
              <div className="mt-3 divide-y divide-border">
                {settings.memberEmails.length === 0 ? (
                  <p className="py-3 text-sm text-foreground-tertiary">
                    Chưa có thành viên được thêm.
                  </p>
                ) : (
                  settings.memberEmails.map((email) => (
                    <div key={email} className="flex items-center gap-3 py-3">
                      <Avatar initials={email.slice(0, 2).toUpperCase()} size="sm" />
                      <span className="min-w-0 flex-1 truncate text-sm text-foreground-secondary">
                        {email}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          updateSettings({
                            memberEmails: settings.memberEmails.filter((item) => item !== email),
                          })
                        }
                        className="text-sm text-error"
                      >
                        Xóa
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
          {section === 'notifications' && (
            <div className="space-y-3">
              <SettingToggle
                label="Email notifications"
                checked={settings.emailNotifications}
                onChange={(checked) => updateSettings({ emailNotifications: checked })}
              />
              <SettingToggle
                label="Thông báo bài chờ chấm"
                checked={settings.reviewNotifications}
                onChange={(checked) => updateSettings({ reviewNotifications: checked })}
              />
            </div>
          )}
          {section === 'appearance' && (
            <fieldset>
              <legend className="mb-2 text-sm font-medium text-foreground">Theme</legend>
              <div className="flex gap-2">
                {(['dark', 'light'] as const).map((theme) => (
                  <button
                    key={theme}
                    type="button"
                    onClick={() => {
                      updateSettings({ theme });
                      setTheme(theme);
                    }}
                    className={`h-10 rounded-lg border px-4 text-sm font-medium ${settings.theme === theme ? 'border-accent bg-background-tertiary text-foreground' : 'border-border text-foreground-secondary'}`}
                  >
                    {theme === 'dark' ? 'Dark' : 'Light'}
                  </button>
                ))}
              </div>
            </fieldset>
          )}
          {section === 'privacy' && (
            <div className="space-y-3">
              <SettingToggle
                label="Ẩn danh ứng viên trước unlock"
                checked={settings.hideCandidateIdentity}
                onChange={(checked) => updateSettings({ hideCandidateIdentity: checked })}
              />
              <SettingToggle
                label="Workspace riêng tư"
                checked={settings.privateWorkspace}
                onChange={(checked) => updateSettings({ privateWorkspace: checked })}
              />
            </div>
          )}
          <div className="flex items-center gap-3 border-t border-border pt-4">
            <button
              type="submit"
              className="h-10 rounded-lg bg-accent px-4 text-sm font-medium text-white hover:bg-accent-hover"
            >
              Lưu thay đổi
            </button>
            {saved && (
              <span role="status" className="text-sm text-success">
                Đã lưu
              </span>
            )}
          </div>
        </form>
      </div>
    </section>
  );
}

function SettingToggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-4 rounded-lg border border-border px-4 py-3 text-sm text-foreground">
      <span>{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 accent-accent"
      />
    </label>
  );
}

export function EmployerOverview({ user }: { user: User }) {
  const {
    data,
    unlockedCount,
    isLoading,
    isError,
    error,
    isReviewQueueLoading,
    hasReviewQueueError,
    refetch,
  } = useEmployerOverview();
  const { bookmarkIds, toggleBookmark, settings } = useEmployerWorkspace();
  const [bookmarkQuery, setBookmarkQuery] = useState('');
  const [bookmarkFilter, setBookmarkFilter] = useState<BookmarkFilter>('all');
  const [challengeToAdd, setChallengeToAdd] = useState('');

  const reviewCountByChallenge = useMemo(
    () =>
      new Map(
        data.reviewQueue.map((item) => [
          item.challengeId,
          data.reviewQueue.filter((candidate) => candidate.challengeId === item.challengeId).length,
        ])
      ),
    [data.reviewQueue]
  );
  const bookmarkedChallenges = useMemo(
    () =>
      data.challenges
        .filter((challenge) => bookmarkIds.includes(challenge.challenge_id))
        .filter((challenge) => challenge.title.toLowerCase().includes(bookmarkQuery.toLowerCase()))
        .filter(
          (challenge) =>
            bookmarkFilter !== 'endingSoon' ||
            (daysRemaining(challenge.deadline) >= 0 && daysRemaining(challenge.deadline) <= 7)
        ),
    [bookmarkFilter, bookmarkIds, bookmarkQuery, data.challenges]
  );
  const availableBookmarks = data.challenges.filter(
    (challenge) => !bookmarkIds.includes(challenge.challenge_id)
  );
  const metricValues: Record<OverviewMetricKey, string | number> = isError
    ? { activeChallenges: '—', pendingReviews: '—', unlockedProfiles: '—', nextDeadline: '—' }
    : {
        activeChallenges: data.challenges.length,
        pendingReviews: data.reviewQueue.length,
        unlockedProfiles: unlockedCount,
        nextDeadline: formatDate(data.nextDeadline),
      };
  const metricHrefs: Record<OverviewMetricKey, string> = {
    activeChallenges: '#challenges',
    pendingReviews: '#review-queue',
    unlockedProfiles: '/talent-pool',
    nextDeadline: '#challenges',
  };
  const workspaceInitials = settings.companyName.trim().slice(0, 2).toUpperCase() || 'PW';

  if (user.role !== 'Employer')
    return (
      <div className="card mx-auto max-w-2xl text-center">
        <h2 className="text-lg font-semibold text-foreground">Không có quyền truy cập</h2>
        <Link href="/candidate/dashboard" className="mt-4 inline-flex text-accent">
          Về dashboard của tôi
        </Link>
      </div>
    );
  if (isLoading)
    return (
      <div className="mx-auto max-w-6xl space-y-4" aria-busy="true">
        <div className="h-20 animate-pulse rounded-xl bg-background-secondary" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {METRIC_KEYS.map((key) => (
            <div key={key} className="h-36 animate-pulse rounded-xl bg-background-secondary" />
          ))}
        </div>
      </div>
    );
  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <section className="flex items-center gap-4">
        <span className="flex h-12 w-12 items-center justify-center rounded-lg border border-border-secondary bg-background-secondary text-sm font-semibold text-foreground">
          {workspaceInitials}
        </span>
        <div>
          <h1 className="text-3xl font-semibold text-foreground">{EMPLOYER_COPY.pageTitle}</h1>
          <p className="mt-1 text-base text-foreground-secondary">
            {EMPLOYER_COPY.pageDescription}
          </p>
        </div>
      </section>

      {isError && (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-xl border border-warning bg-warning-bg px-4 py-3 sm:flex-row sm:items-center"
        >
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-warning">Backend hiện không khả dụng</p>
            <p className="mt-0.5 text-xs text-foreground-secondary">
              Không thể tải challenge và submission. Settings và dữ liệu lưu cục bộ vẫn có thể sử
              dụng.
            </p>
            {error instanceof Error && (
              <p className="mt-1 truncate text-xs text-foreground-tertiary">{error.message}</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => void refetch()}
            className="h-9 shrink-0 rounded-lg border border-warning px-3 text-sm font-medium text-warning hover:bg-background-tertiary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
          >
            Thử lại
          </button>
        </div>
      )}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {METRIC_KEYS.map((key) => (
          <MetricCard key={key} metricKey={key} value={metricValues[key]} href={metricHrefs[key]} />
        ))}
      </section>

      <section id="challenges" className="scroll-mt-20">
        <SectionHeader
          title={EMPLOYER_COPY.activeChallenges}
          action={
            <Link href="/challenges" className="text-sm font-medium text-accent hover:underline">
              {EMPLOYER_COPY.viewAll}
            </Link>
          }
        />
        {isError ? (
          <div className="card py-8 text-center text-sm text-warning">
            Challenge chưa thể tải vì Backend API đang offline.
          </div>
        ) : data.challenges.length === 0 ? (
          <div className="card py-10 text-center">
            <p className="font-medium text-foreground">{EMPLOYER_COPY.noChallenges}</p>
            <p className="mt-1 text-sm text-foreground-tertiary">
              Dùng nút “Tạo thử thách” trên topbar để bắt đầu.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-background-secondary">
            {data.challenges.map((challenge) => {
              const days = daysRemaining(challenge.deadline);
              return (
                <article
                  key={challenge.challenge_id}
                  className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="truncate font-semibold text-foreground">{challenge.title}</h4>
                      <Badge variant="open">Đang mở</Badge>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-foreground-tertiary">
                      <span>
                        {reviewCountByChallenge.get(challenge.challenge_id) ?? 0} bài chờ chấm
                      </span>
                      <span>
                        {days >= 0
                          ? `${days} ngày còn lại`
                          : `Hết hạn ${formatDate(challenge.deadline)}`}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => toggleBookmark(challenge.challenge_id)}
                      aria-label={
                        bookmarkIds.includes(challenge.challenge_id)
                          ? `Xóa bookmark ${challenge.title}`
                          : `Bookmark ${challenge.title}`
                      }
                      className="text-sm text-foreground-secondary hover:text-accent"
                    >
                      {bookmarkIds.includes(challenge.challenge_id) ? 'Đã lưu' : 'Lưu'}
                    </button>
                    <a
                      href="#review-queue"
                      className="inline-flex h-9 items-center rounded-lg border border-border-secondary px-3 text-sm font-medium text-foreground hover:bg-background-tertiary"
                    >
                      {EMPLOYER_COPY.viewSubmissions}
                    </a>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.9fr]">
        <section id="review-queue" className="scroll-mt-20">
          <SectionHeader title={EMPLOYER_COPY.reviewQueue} />
          {isError ? (
            <div className="card py-8 text-center text-sm text-warning">
              Review Queue chưa khả dụng.
            </div>
          ) : isReviewQueueLoading ? (
            <div
              className="card py-8 text-center text-sm text-foreground-tertiary"
              aria-busy="true"
            >
              Đang tải bài chờ chấm...
            </div>
          ) : hasReviewQueueError ? (
            <div className="card py-8 text-center">
              <p className="text-sm font-medium text-warning">Chưa thể tải Review Queue.</p>
              <p className="mt-1 text-xs text-foreground-tertiary">
                Dữ liệu challenge và các phần khác vẫn có thể sử dụng.
              </p>
            </div>
          ) : data.reviewQueue.length === 0 ? (
            <div className="card py-8 text-center text-sm text-foreground-tertiary">
              {EMPLOYER_COPY.noReviews}
            </div>
          ) : (
            <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-background-secondary">
              {data.reviewQueue.map((item) => (
                <div key={item.submissionId} className="flex items-center gap-3 px-4 py-4">
                  <Avatar
                    initials="••"
                    size="sm"
                    className="border-border-secondary bg-input text-foreground-tertiary"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      Candidate {item.candidateCode.slice(0, 8)}
                    </p>
                    <p className="truncate text-xs text-foreground-tertiary">
                      {item.challengeTitle} · {formatRelativeTime(item.submittedAt)}
                    </p>
                  </div>
                  <Link
                    href={`/employer/submissions/${item.submissionId}/grade?challengeId=${item.challengeId}`}
                    className="text-sm font-medium text-accent hover:underline"
                  >
                    Chấm bài
                  </Link>
                </div>
              ))}
            </div>
          )}
        </section>
        <section>
          <SectionHeader title={EMPLOYER_COPY.tasks} />
          {isError ? (
            <div className="card py-8 text-center text-sm text-warning">
              Việc cần làm sẽ xuất hiện khi kết nối lại Backend.
            </div>
          ) : data.tasks.length === 0 ? (
            <div className="card py-8 text-center text-sm text-foreground-tertiary">
              Không có việc cần xử lý.
            </div>
          ) : (
            <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-background-secondary">
              {data.tasks.map((task) => (
                <Link
                  key={task.key}
                  href={task.href}
                  className="flex gap-3 px-4 py-4 hover:bg-background-tertiary"
                >
                  <span
                    aria-hidden="true"
                    className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-warning"
                  />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {TASK_LABELS[task.key].title}
                      {task.count ? ` (${task.count})` : ''}
                    </p>
                    <p className="mt-1 text-xs text-foreground-tertiary">
                      {TASK_LABELS[task.key].description}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>

      <section>
        <SectionHeader title={EMPLOYER_COPY.recentActivity} />
        {isError ? (
          <div className="card py-8 text-center text-sm text-warning">
            Hoạt động gần đây chưa khả dụng.
          </div>
        ) : data.activities.length === 0 ? (
          <div className="card py-8 text-center text-sm text-foreground-tertiary">
            {EMPLOYER_COPY.noActivity}
          </div>
        ) : (
          <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-background-secondary">
            {data.activities.map((activity) => (
              <div key={activity.id} className="flex items-center gap-3 px-4 py-4">
                <Avatar
                  initials={activity.actorInitials}
                  size="sm"
                  className="border-border-secondary bg-input text-foreground-tertiary"
                />
                <div className="min-w-0 flex-1 text-sm">
                  <p className="truncate text-foreground">
                    <span className="font-medium">{activity.actorName}</span>{' '}
                    {ACTIVITY_LABELS[activity.action]}{' '}
                    <span className="font-medium">{activity.subject}</span>
                  </p>
                  <p className="mt-1 text-xs text-foreground-tertiary">
                    {formatRelativeTime(activity.occurredAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section id="bookmarks" className="scroll-mt-20">
        <SectionHeader title={EMPLOYER_COPY.bookmarks} />
        <div className="card space-y-4">
          <div className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
            <input
              type="search"
              value={bookmarkQuery}
              onChange={(event) => setBookmarkQuery(event.target.value)}
              placeholder="Tìm bookmark..."
              aria-label="Tìm bookmark"
              className="h-10 rounded-lg border border-border-secondary bg-input px-3 text-foreground outline-none focus:ring-2 focus:ring-focus"
            />
            <select
              value={bookmarkFilter}
              onChange={(event) => setBookmarkFilter(event.target.value as BookmarkFilter)}
              aria-label="Lọc bookmark"
              className="h-10 rounded-lg border border-border-secondary bg-input px-3 text-foreground"
            >
              {BOOKMARK_FILTERS.map((filter) => (
                <option key={filter.key} value={filter.key}>
                  {filter.label}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <select
                value={challengeToAdd}
                onChange={(event) => setChallengeToAdd(event.target.value)}
                aria-label="Chọn challenge để bookmark"
                className="h-10 min-w-0 rounded-lg border border-border-secondary bg-input px-3 text-foreground"
              >
                <option value="">Thêm challenge...</option>
                {availableBookmarks.map((challenge) => (
                  <option key={challenge.challenge_id} value={challenge.challenge_id}>
                    {challenge.title}
                  </option>
                ))}
              </select>
              <button
                type="button"
                disabled={!challengeToAdd}
                onClick={() => {
                  toggleBookmark(challengeToAdd);
                  setChallengeToAdd('');
                }}
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-border-secondary px-3 text-sm font-medium text-foreground hover:bg-background-tertiary disabled:opacity-50"
              >
                <PlusIcon />
                Thêm
              </button>
            </div>
          </div>
          {bookmarkedChallenges.length === 0 ? (
            <p className="py-6 text-center text-sm text-foreground-tertiary">
              Không có bookmark phù hợp.
            </p>
          ) : (
            <div className="divide-y divide-border">
              {bookmarkedChallenges.map((challenge) => (
                <div key={challenge.challenge_id} className="flex items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {challenge.title}
                    </p>
                    <p className="text-xs text-foreground-tertiary">
                      Deadline {formatDate(challenge.deadline)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleBookmark(challenge.challenge_id)}
                    className="text-sm text-error"
                  >
                    Xóa
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <WorkspaceSettingsPanel />
    </div>
  );
}
