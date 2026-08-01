'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { useUIStore } from '@/lib/store/uiStore';
import { Avatar, RolePill } from '@/components/ui';
import { getInitials } from '@/lib/utils/helpers';
import type { User } from '@/lib/types';
import { NOTIFICATIONS, toneDot } from '@/lib/data/notifications';
import { BellIcon, CreateIcon } from './SidebarIcons';

type ThemeMode = 'dark' | 'light';

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      className={className}
    >
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" />
    </svg>
  );
}

function SunIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function CopyIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function MenuLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex h-9 items-center rounded-lg px-2.5 text-xs font-medium text-foreground transition-colors hover:bg-background-tertiary hover:text-accent"
    >
      {label}
    </Link>
  );
}

function MenuButton({
  label,
  onClick,
  danger,
  disabled,
  icon,
}: {
  label: string;
  onClick?: () => void;
  danger?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex h-9 w-full items-center gap-2 rounded-lg px-2.5 text-left text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
        danger
          ? 'text-error hover:bg-error-bg'
          : 'text-foreground hover:bg-background-tertiary hover:text-accent'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function AccountControlCenter({
  user,
  loggingOut,
  onLogout,
  theme,
  onToggleTheme,
}: {
  user: User;
  loggingOut: boolean;
  onLogout: () => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(user.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard không khả dụng — bỏ qua, không làm gián đoạn người dùng
    }
  };

  return (
    <div className="absolute right-0 top-12 z-50 w-[264px] rounded-xl border border-border bg-background-secondary p-3 shadow-2xl animate-in fade-in duration-150">
      {/* User Header Info */}
      <div className="flex items-center gap-3 border-b border-border pb-3">
        <Avatar
          initials={getInitials(user.full_name)}
          size="md"
          className="h-10 w-10 text-sm font-semibold shrink-0"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-foreground">{user.full_name}</p>
          <p className="truncate text-2xs text-foreground-tertiary">{user.email}</p>
          <div className="mt-1">
            <RolePill role={user.role === 'Employer' ? 'employer' : 'candidate'} />
          </div>
        </div>
      </div>

      {/* Quick account actions */}
      <div className="py-2 border-b border-border space-y-0.5">
        <MenuButton
          label={copied ? 'Đã sao chép email' : 'Sao chép email'}
          onClick={handleCopyEmail}
          icon={
            copied ? (
              <CheckIcon className="h-4 w-4 text-success" />
            ) : (
              <CopyIcon className="h-4 w-4 text-foreground-tertiary" />
            )
          }
        />
        <MenuButton
          label={theme === 'dark' ? 'Chuyển giao diện Sáng' : 'Chuyển giao diện Tối'}
          onClick={onToggleTheme}
          icon={
            theme === 'dark' ? (
              <SunIcon className="h-4 w-4 text-warning" />
            ) : (
              <MoonIcon className="h-4 w-4 text-info" />
            )
          }
        />
      </div>

      {/* Navigation Links — chỉ giữ lại mục cần thiết */}
      <div className="py-2 border-b border-border space-y-0.5">
        {user.role === 'Employer' ? (
          <>
            <MenuLink href="/employer/dashboard" label="Dashboard" />
            <MenuLink href="/talent-pool" label="Talent Pool" />
          </>
        ) : (
          <>
            <MenuLink href="/candidate/dashboard" label="Dashboard" />
            <MenuLink href="/candidate/profile" label="Hồ sơ của tôi" />
          </>
        )}
      </div>

      {/* Logout Action */}
      <div className="pt-1.5">
        <MenuButton
          label={loggingOut ? 'Đang đăng xuất...' : 'Đăng xuất'}
          onClick={onLogout}
          danger
          disabled={loggingOut}
        />
      </div>
    </div>
  );
}

function NotificationCenter({ onClose }: { onClose: () => void }) {
  return (
    <div className="absolute right-0 top-12 z-50 w-[360px] rounded-xl border border-border bg-background-secondary text-foreground shadow-2xl animate-in fade-in duration-150">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <p className="text-md font-bold text-foreground">Thông báo</p>
        <button
          type="button"
          className="text-xs font-medium text-accent transition-colors hover:opacity-80"
        >
          Đánh dấu đã đọc
        </button>
      </div>
      <div className="max-h-[420px] overflow-y-auto py-1.5">
        {NOTIFICATIONS.map((n) => (
          <div
            key={n.id}
            className={`relative flex gap-3 px-4 py-3 transition-colors hover:bg-background-tertiary ${
              n.unread ? 'bg-accent-bg/30' : ''
            }`}
          >
            <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${toneDot[n.tone]}`} />
            <div className="min-w-0 flex-1">
              {/* Thời gian đặt ở góc trên bên phải, cỡ chữ vừa phải */}
              <div className="flex items-start justify-between gap-2">
                <p className="min-w-0 text-sm font-semibold text-foreground">{n.title}</p>
                <span className="shrink-0 whitespace-nowrap text-2xs font-medium text-foreground-tertiary">
                  {n.time}
                </span>
              </div>
              <p className="mt-0.5 text-xs leading-snug text-foreground-secondary">{n.detail}</p>
              {n.actions && n.actions.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {n.actions.map((action, idx) =>
                    action.href ? (
                      <Link
                        key={action.label}
                        href={action.href}
                        onClick={onClose}
                        className={`rounded-md px-2.5 py-1 text-2xs font-semibold transition-colors ${
                          idx === 0
                            ? 'bg-accent text-white hover:bg-accent-hover'
                            : 'bg-background-tertiary text-foreground-secondary hover:text-foreground'
                        }`}
                      >
                        {action.label}
                      </Link>
                    ) : (
                      <button
                        key={action.label}
                        type="button"
                        className={`rounded-md px-2.5 py-1 text-2xs font-semibold transition-colors ${
                          idx === 0
                            ? 'bg-accent text-white hover:bg-accent-hover'
                            : 'bg-background-tertiary text-foreground-secondary hover:text-foreground'
                        }`}
                      >
                        {action.label}
                      </button>
                    )
                  )}
                </div>
              )}
            </div>
            {n.unread && (
              <span className="absolute right-3 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-accent" />
            )}
          </div>
        ))}
      </div>
      <div className="border-t border-border px-4 py-2.5">
        <button
          type="button"
          className="w-full rounded-lg py-1.5 text-center text-xs font-medium text-accent transition-colors hover:bg-background-tertiary"
        >
          Xem tất cả thông báo
        </button>
      </div>
    </div>
  );
}

export function Header() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const notifOpen = useUIStore((s) => s.notificationsOpen);
  const setNotifOpen = useUIStore((s) => s.setNotificationsOpen);
  const toggleNotifOpen = useUIStore((s) => s.toggleNotifications);
  const unreadCount = NOTIFICATIONS.filter((n) => n.unread).length;
  const [theme, setTheme] = useState<ThemeMode>(() => {
    if (typeof window === 'undefined') return 'dark';
    const stored = window.localStorage.getItem('powork-theme');
    return stored === 'light' || stored === 'dark' ? stored : 'dark';
  });

  // Đồng bộ giao diện đã chọn xuống thẻ <html> để CSS data-theme áp dụng
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme((prev) => {
      const next: ThemeMode = prev === 'dark' ? 'light' : 'dark';
      window.localStorage.setItem('powork-theme', next);
      return next;
    });
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
    router.replace('/login');
  };

  return (
    <header className="relative flex h-16 shrink-0 items-center gap-3 bg-[var(--color-header-bg)] px-4 sm:px-5 shadow-md text-white transition-colors duration-300">
      {(notifOpen || accountOpen) && (
        <button
          type="button"
          aria-hidden="true"
          tabIndex={-1}
          onClick={() => {
            setNotifOpen(false);
            setAccountOpen(false);
          }}
          className="fixed inset-0 z-40 cursor-default"
        />
      )}
      {/* Search Input Bar */}
      <form
        role="search"
        onSubmit={(e) => e.preventDefault()}
        className="group relative min-w-0 max-w-[560px] flex-1"
      >
        <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-white/60 transition-colors group-focus-within:text-white" />
        <input
          type="search"
          aria-label="Search workspace"
          placeholder="Tìm challenge, submission, ứng viên..."
          className="h-10 w-full rounded-xl border border-white/15 bg-black/15 pl-11 pr-4 text-sm font-medium text-white shadow-inner outline-none transition-all placeholder:text-white/55 hover:border-white/25 hover:bg-black/20 focus:border-white/50 focus:bg-black/25 focus:ring-2 focus:ring-white/15"
        />
      </form>

      {/* Right Controls */}
      <div className="ml-auto flex shrink-0 items-center gap-2">
        {user?.role === 'Employer' && (
          <Link
            href="/employer/challenges/create"
            className="hidden h-10 items-center gap-2 rounded-lg bg-white/15 px-3.5 text-xs font-semibold text-white shadow-xs transition-all hover:bg-white/25 active:scale-95 md:inline-flex border border-white/20"
          >
            <CreateIcon className="h-[18px] w-[18px]" />
            Create Challenge
          </Link>
        )}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              toggleNotifOpen();
              setAccountOpen(false);
            }}
            aria-label="Thông báo"
            aria-haspopup="menu"
            aria-expanded={notifOpen}
            title="Thông báo"
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-white transition-colors hover:bg-white/20 focus-visible:outline-none"
          >
            <BellIcon className="h-[22px] w-[22px]" />
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-400 px-1 text-[10px] font-bold text-black">
                {unreadCount}
              </span>
            )}
          </button>
          {notifOpen && <NotificationCenter onClose={() => setNotifOpen(false)} />}
        </div>

        {user && (
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setAccountOpen((open) => !open);
                setNotifOpen(false);
              }}
              aria-haspopup="menu"
              aria-expanded={accountOpen}
              className="flex h-11 items-center gap-2.5 rounded-lg px-2 text-left transition-colors hover:bg-white/10 focus-visible:outline-none"
            >
              <div className="hidden flex-col items-end sm:flex">
                <span className="max-w-[170px] truncate text-base font-bold text-white">
                  {user.full_name}
                </span>
                <RolePill
                  role={user.role === 'Employer' ? 'employer' : 'candidate'}
                  className="mt-0.5 px-2.5 py-0.5 text-xs leading-4"
                />
              </div>
              <Avatar
                initials={getInitials(user.full_name)}
                size="sm"
                className="h-9 w-9 border-2 border-white/30 bg-white/20 text-white text-sm shadow-xs"
              />
            </button>

            {accountOpen && (
              <AccountControlCenter
                user={user}
                loggingOut={loggingOut}
                onLogout={handleLogout}
                theme={theme}
                onToggleTheme={handleToggleTheme}
              />
            )}
          </div>
        )}
      </div>
    </header>
  );
}
