'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, type RegisterFormValues } from '@/lib/validations/auth';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const {
    register: registerField,
    handleSubmit,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      full_name: '',
      email: '',
      password: '',
      role: 'Candidate',
      company_name: '',
      accepted_terms: false,
    },
  });

  const selectedRole = useWatch({ control, name: 'role' });

  const [error, setError] = useState('');

  const onSubmit = async (data: RegisterFormValues) => {
    setError('');
    try {
      const user = await register(data);
      router.replace(user.role === 'Employer' ? '/employer/dashboard' : '/candidate/dashboard');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr?.response?.data?.message || 'Đăng ký thất bại. Vui lòng thử lại.');
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="card max-w-md w-full">
        <div className="text-center mb-8">
          {/* Tăng kích cỡ chữ POWORK và dòng thông điệp bên dưới */}
          <h1 className="text-5xl font-extrabold text-foreground mb-2">POWORK</h1>
          <p className="text-foreground-secondary text-lg font-medium">Tạo tài khoản mới</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
          <div>
            {/* Tăng kích cỡ nhãn (label) và chữ thông báo lỗi */}
            <label
              htmlFor="fullName"
              className="block text-base font-semibold text-foreground mb-1.5"
            >
              Họ và tên
            </label>
            <input
              id="fullName"
              type="text"
              autoComplete="name"
              {...registerField('full_name')}
              placeholder="Nguyễn Văn A"
              className="input-base !text-base h-11" // Tăng size chữ và chiều cao input
            />
            {errors.full_name && (
              <p className="text-red-400 text-base mt-1">{errors.full_name.message}</p>
            )}
          </div>

          {selectedRole === 'Employer' && (
            <div>
              <label
                htmlFor="companyName"
                className="block text-base font-semibold text-foreground mb-1.5"
              >
                Tên công ty
              </label>
              <input
                id="companyName"
                type="text"
                autoComplete="organization"
                {...registerField('company_name')}
                placeholder="Công ty TNHH ABC"
                className="input-base !text-base h-11"
              />
              {errors.company_name && (
                <p className="text-red-400 text-base mt-1">{errors.company_name.message}</p>
              )}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-base font-semibold text-foreground mb-1.5">
              Email
            </label>
            <input
              id="email"
              type="text"
              autoComplete="email"
              {...registerField('email')}
              placeholder="ban@email.com"
              className="input-base !text-base h-11"
            />
            {errors.email && <p className="text-red-400 text-base mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-base font-semibold text-foreground mb-1.5"
            >
              Mật khẩu
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              {...registerField('password')}
              placeholder="Tối thiểu 8 ký tự"
              className="input-base !text-base h-11"
            />
            {errors.password && (
              <p className="text-red-400 text-base mt-1">{errors.password.message}</p>
            )}
          </div>

          <div>
            <label className="block text-base font-semibold text-foreground mb-2">Bạn là</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setValue('role', 'Candidate', { shouldValidate: true })}
                className={`py-3 px-4 rounded-lg border text-base font-semibold transition-colors ${
                  selectedRole === 'Candidate'
                    ? 'border-accent bg-accent/10 text-accent'
                    : 'border-border-secondary bg-background-secondary text-foreground-secondary hover:border-accent/50'
                }`}
              >
                🎓 Ứng viên
              </button>
              <button
                type="button"
                onClick={() => setValue('role', 'Employer', { shouldValidate: true })}
                className={`py-3 px-4 rounded-lg border text-base font-semibold transition-colors ${
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
            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border-secondary bg-background-secondary px-4 py-3 text-sm leading-6 text-foreground-secondary">
              <input
                type="checkbox"
                {...registerField('accepted_terms')}
                className="mt-1 h-4 w-4 shrink-0 accent-[var(--color-accent)]"
              />
              <span>
                Tôi đã đọc và đồng ý với{' '}
                <Link
                  href="/public-page/terms"
                  target="_blank"
                  className="font-semibold text-accent hover:underline"
                >
                  Điều khoản sử dụng
                </Link>{' '}
                và{' '}
                <Link
                  href="/public-page/security"
                  target="_blank"
                  className="font-semibold text-accent hover:underline"
                >
                  Chính sách bảo mật
                </Link>
                .
              </span>
            </label>
            {errors.accepted_terms && (
              <p className="mt-1 text-sm text-red-400">{errors.accepted_terms.message}</p>
            )}
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-base rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          {/* Thay đổi tại đây: Thêm rounded-full để bo tròn hoàn toàn, text-lg và font-bold để tăng cỡ chữ */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary w-full py-3.5 mt-2 rounded-lg text-lg font-bold tracking-wide disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Đang tạo tài khoản...' : 'Tạo tài khoản'}
          </button>
        </form>

        {/* Tăng cỡ chữ dòng điều hướng ở cuối */}
        <p className="text-center text-foreground-secondary text-base mt-6">
          Đã có tài khoản?{' '}
          <Link href="/login" className="text-accent hover:underline font-semibold">
            Đăng nhập
          </Link>
        </p>
      </div>
    </div>
  );
}
