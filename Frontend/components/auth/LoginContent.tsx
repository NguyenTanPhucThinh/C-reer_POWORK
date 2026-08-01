'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/lib/hooks/useAuth';
import { loginSchema, type LoginFormValues } from '@/lib/validations/auth';
import type { UserRole } from '@/lib/types';

function getSafeRedirect(value: string | null) {
  if (!value || !value.startsWith('/') || value.startsWith('//')) {
    return null;
  }

  if (value === '/login' || value === '/register') {
    return null;
  }

  return value;
}

function getRoleFromParam(roleParam: string | null): UserRole | null {
  const normalizedRole = roleParam?.toLowerCase();

  if (normalizedRole === 'employer') {
    return 'Employer';
  }

  if (normalizedRole === 'candidate') {
    return 'Candidate';
  }

  return null;
}

function getInitialRole(roleParam: string | null, redirectPath: string | null): UserRole {
  const explicitRole = getRoleFromParam(roleParam);
  if (explicitRole) {
    return explicitRole;
  }

  if (redirectPath?.startsWith('/employer')) {
    return 'Employer';
  }

  if (redirectPath?.startsWith('/candidate')) {
    return 'Candidate';
  }

  return 'Candidate';
}

function getDashboardForRole(role: UserRole) {
  return role === 'Employer' ? '/employer/dashboard' : '/candidate/dashboard';
}

export default function LoginContent() {
  const router = useRouter();
  const { login } = useAuth();
  const searchParams = useSearchParams();
  const redirectPath = getSafeRedirect(searchParams.get('redirect'));
  const roleParam = searchParams.get('role');
  const initialRoleFromUrl = getInitialRole(roleParam, redirectPath);

  const [selectedRole, setSelectedRole] = useState<UserRole>(initialRoleFromUrl);
  const [prevRoleParam, setPrevRoleParam] = useState<string | null>(roleParam);

  // Sync state during render when URL params change (React recommended pattern)
  if (roleParam !== prevRoleParam) {
    setPrevRoleParam(roleParam);
    setSelectedRole(initialRoleFromUrl);
  }

  const roleSlug = selectedRole === 'Employer' ? 'employer' : 'candidate';

  // Đổi màu nhấn xung quanh theo role đang chọn: candidate xanh lá, employer vàng cam
  useEffect(() => {
    document.documentElement.setAttribute('data-role', roleSlug);
    return () => {
      document.documentElement.removeAttribute('data-role');
    };
  }, [roleSlug]);

  const {
    register: registerField,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const selectRole = (role: UserRole) => {
    setSelectedRole(role);
    setError('');
    const params = new URLSearchParams(searchParams.toString());
    params.set('role', role === 'Employer' ? 'employer' : 'candidate');
    router.replace(`/login?${params.toString()}`, { scroll: false });
  };

  const onSubmit = async (data: LoginFormValues) => {
    setError('');

    try {
      await login({ ...data, role: selectedRole });
      router.replace(getDashboardForRole(selectedRole));
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr?.response?.data?.message || 'Email hoặc mật khẩu không đúng.');
    }
  };

  const loginTitle = selectedRole === 'Employer' ? 'Đăng nhập doanh nghiệp' : 'Chào mừng trở lại';
  const loginSubtitle =
    selectedRole === 'Employer'
      ? 'Quản lý Challenge và tìm kiếm nhân tài'
      : 'Đăng nhập để tiếp tục hành trình của bạn';

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <div className="flex w-full flex-1 flex-col">
        <div
          className="topbar"
          style={{
            background: 'var(--bg3)',
            borderBottom: '0.5px solid var(--border)',
            padding: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            flexShrink: 0,
          }}
        >
          <Link
            href="/"
            className="text-lg text-foreground-secondary no-underline transition-colors hover:text-foreground"
          >
            ← Chọn vai trò
          </Link>
          <span
            className="logo"
            style={{
              fontSize: '28px',
              letterSpacing: '1.5px',
              fontWeight: '700',
              color: 'var(--text)',
            }}
          >
            POWORK
          </span>
          <span
            className={`inline-block rounded-pill border px-4 py-1.5 text-base font-bold ${
              selectedRole === 'Candidate'
                ? 'border-success/40 bg-success-bg text-success'
                : 'border-warning/40 bg-warning-bg text-warning'
            }`}
          >
            {selectedRole === 'Candidate' ? 'Candidate' : 'Employer'}
          </span>
        </div>

        <div className="flex flex-1 items-center border-b border-border-secondary bg-background-secondary p-12 md:p-20">
          <div className="mx-auto grid h-full w-full max-w-[1600px] grid-cols-1 items-start gap-x-20 gap-y-16 md:grid-cols-2">
            <div className="space-y-2">
              <p className="mb-2 text-4xl font-extrabold tracking-tight">{loginTitle}</p>
              <p className="mb-8 text-base text-foreground-tertiary">{loginSubtitle}</p>

              <form onSubmit={handleSubmit(onSubmit)} className="mb-6 flex flex-col gap-6">
                <div>
                  <label className="mb-3 block text-base font-semibold text-foreground-secondary">
                    Bạn là
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => selectRole('Candidate')}
                      className={`rounded-lg border px-4 py-3 text-sm font-medium transition-colors ${
                        selectedRole === 'Candidate'
                          ? 'border-accent bg-accent/10 text-accent'
                          : 'border-border-secondary bg-background-secondary text-foreground-secondary hover:border-accent/50'
                      }`}
                    >
                      🎓 Ứng viên
                    </button>
                    <button
                      type="button"
                      onClick={() => selectRole('Employer')}
                      className={`rounded-lg border px-4 py-3 text-sm font-medium transition-colors ${
                        selectedRole === 'Employer'
                          ? 'border-accent bg-accent/10 text-accent'
                          : 'border-border-secondary bg-background-secondary text-foreground-secondary hover:border-accent/50'
                      }`}
                    >
                      🏢 Nhà tuyển dụng
                    </button>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="mb-3 block text-base font-semibold text-foreground-secondary"
                  >
                    Email {selectedRole === 'Employer' && 'doanh nghiệp'}
                  </label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    {...registerField('email')}
                    placeholder={selectedRole === 'Employer' ? 'hr@company.com' : 'you@email.com'}
                    className="input-base w-full rounded-xl border-2 !px-5 !py-4.5 !text-base font-medium"
                  />
                  {errors.email && (
                    <p className="mt-2 text-sm text-red-400">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="mb-3 block text-base font-semibold text-foreground-secondary"
                  >
                    Mật khẩu
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      placeholder="••••••••"
                      {...registerField('password')}
                      className="input-base w-full rounded-xl border-2 pr-14 !px-5 !py-4.5 !text-base font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((current) => !current)}
                      className="absolute right-5 top-1/2 -translate-y-1/2 text-xl text-foreground-tertiary"
                      aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    >
                      {showPassword ? '🙈' : '👁'}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-2 text-sm text-red-400">{errors.password.message}</p>
                  )}
                </div>

                {error && (
                  <div className="rounded-xl border-2 border-red-500/30 bg-error-bg px-5 py-4 text-base text-red-400">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`btn-base mt-4 w-full rounded-xl py-4.5 text-center text-base font-bold transition-all ${
                    selectedRole === 'Candidate'
                      ? 'border-none bg-success text-black'
                      : 'border-none bg-warning text-black'
                  } disabled:cursor-not-allowed disabled:opacity-60`}
                >
                  {isSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
                </button>
              </form>

              <div className="mb-6 flex items-center gap-4">
                <div className="h-0.5 flex-1 bg-border-secondary" />
                <span className="text-base font-medium text-foreground-tertiary">hoặc</span>
                <div className="h-0.5 flex-1 bg-border-secondary" />
              </div>

              {selectedRole === 'Candidate' ? (
                <button
                  type="button"
                  className="btn-secondary mb-6 w-full rounded-xl border-2 py-4 text-center text-base font-semibold"
                >
                  🔗 Tiếp tục với Google
                </button>
              ) : (
                <button
                  type="button"
                  className="btn-secondary mb-6 w-full rounded-xl border-2 py-4 text-center text-base font-semibold"
                >
                  🏢 Đăng nhập qua SSO
                </button>
              )}

              <div className="flex justify-between pt-2 text-base font-medium">
                <p>
                  <a href="#" className="cursor-pointer text-accent no-underline hover:underline">
                    Quên mật khẩu?
                  </a>
                </p>
                <p className="text-foreground-tertiary">
                  Chưa có tài khoản?{' '}
                  <Link
                    href={`/register?role=${roleSlug}`}
                    className="cursor-pointer font-bold text-accent no-underline hover:underline"
                  >
                    Đăng ký
                  </Link>
                </p>
              </div>
            </div>

            <div>
              {selectedRole === 'Candidate' ? (
                <div className="space-y-6 rounded-2xl border-2 border-success/25 bg-background-tertiary p-8">
                  <div>
                    <p className="mb-2 text-xl font-bold text-success">🔑 Có mã Challenge?</p>
                    <p className="text-base leading-relaxed text-foreground-tertiary">
                      Employer có thể gửi mã riêng để mời bạn tham gia Challenge nội bộ của họ.
                    </p>
                  </div>

                  <div>
                    <p className="mb-3 text-base font-semibold text-foreground-secondary">
                      Mã Challenge
                    </p>
                    <div className="flex gap-3">
                      <input
                        className="input-base flex-1 rounded-xl border-2 !px-5 !py-4 !text-base font-mono tracking-wider"
                        placeholder="VD: VNG-2026-CACHE"
                      />
                      <button
                        type="button"
                        className="btn-secondary whitespace-nowrap rounded-xl border-2 px-6 py-4 !text-base font-bold"
                      >
                        Tham gia
                      </button>
                    </div>
                  </div>

                  <div className="rounded-xl border-2 border-border bg-background p-5">
                    <p className="text-sm leading-relaxed text-foreground-tertiary">
                      Mã Challenge có dạng{' '}
                      <code className="rounded-md bg-success/10 px-2 py-0.5 font-mono font-black text-success">
                        ABC-YYYY-XXXX
                      </code>{' '}
                      thường được gửi qua email hoặc Slack nội bộ của công ty.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 rounded-2xl border-2 border-warning/25 bg-background-tertiary p-8">
                  <p className="mb-6 text-xl font-bold text-warning">
                    🏅 Sau khi đăng nhập, bạn có thể
                  </p>

                  <div className="mb-6 flex flex-col gap-6">
                    <div className="flex items-start gap-6">
                      <span className="shrink-0 text-2xl">📝</span>
                      <div>
                        <p className="mb-1.5 text-base font-bold">Tạo Challenge + sinh mã invite</p>
                        <p className="text-sm leading-relaxed text-foreground-tertiary">
                          Mỗi Challenge có mã riêng để share nội bộ hoặc công khai.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-6">
                      <span className="shrink-0 text-2xl">🎯</span>
                      <div>
                        <p className="mb-1.5 text-base font-bold">Chấm điểm Blind Audition</p>
                        <p className="text-sm leading-relaxed text-foreground-tertiary">
                          Đánh giá khách quan, không nhìn thấy CV.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-6">
                      <span className="shrink-0 text-2xl">👥</span>
                      <div>
                        <p className="mb-1.5 text-base font-bold">Xây dựng Talent Pool</p>
                        <p className="text-sm leading-relaxed text-foreground-tertiary">
                          Lưu hồ sơ ứng viên đã xác thực năng lực.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border-2 border-border bg-background p-5">
                    <p className="text-sm leading-relaxed text-foreground-tertiary">
                      🔒 Dùng email công ty để được xác minh tự động, tăng độ tin cậy với Candidate.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
