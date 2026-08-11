'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { isCandidateVerificationPath } from '@/lib/utils/helpers';

type FooterVariant = 'full' | 'compact';

interface FooterProps {
  variant?: FooterVariant;
}

const linkGroups = [
  {
    title: 'Sản phẩm',
    links: [
      { label: 'Gói dịch vụ', href: '/public-page/subscription' },
      { label: 'Hướng dẫn sử dụng', href: '/public-page/guides' },
    ],
  },
  {
    title: 'Công ty',
    links: [
      { label: 'Giới thiệu', href: '/public-page/about' },
      { label: 'Liên hệ', href: '/public-page/contact' },
    ],
  },
  {
    title: 'Pháp lý',
    links: [
      { label: 'Điều khoản sử dụng', href: '/public-page/terms' },
      { label: 'Chính sách bảo mật', href: '/public-page/security' },
    ],
  },
];

export function Footer({ variant = 'full' }: FooterProps) {
  const pathname = usePathname();

  if (isCandidateVerificationPath(pathname)) return null;

  if (variant === 'compact') {
    return (
      <footer
        className="border-t py-4 text-center text-xs"
        style={{
          borderColor: 'var(--color-border-subtle)',
          background: 'var(--color-bg-surface)',
          color: 'var(--color-text-muted)',
        }}
      >
        © {new Date().getFullYear()} POWORK. Tất cả quyền được bảo lưu.
      </footer>
    );
  }

  return (
    <footer
      className="border-t"
      style={{
        borderColor: 'var(--color-border-subtle)',
        background: 'var(--color-bg-surface)',
      }}
    >
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Brand */}
          <div>
            <Link
              href="/"
              className="text-lg font-bold"
              style={{ color: 'var(--color-text-primary)' }}
            >
              POWORK
            </Link>
            <p
              className="mt-2 text-sm leading-relaxed"
              style={{ color: 'var(--color-text-muted)' }}
            >
              Nền tảng tuyển dụng dựa trên bằng chứng thực chiến. Kết nối nhân tài với cơ hội phù
              hợp.
            </p>
          </div>

          {/* Link groups */}
          {linkGroups.map((group) => (
            <div key={group.title}>
              <h4
                className="text-sm font-semibold mb-3"
                style={{ color: 'var(--color-text-primary)' }}
              >
                {group.title}
              </h4>
              <ul className="space-y-2">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm transition-colors hover:underline"
                      style={{ color: 'var(--color-text-muted)' }}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <hr className="my-6" style={{ borderColor: 'var(--color-border-subtle)' }} />

        <div className="flex flex-col items-center justify-between gap-2 md:flex-row">
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            © {new Date().getFullYear()} POWORK. Tất cả quyền được bảo lưu.
          </p>
          <div className="flex gap-4 text-xs" style={{ color: 'var(--color-text-muted)' }}>
            <Link href="/public-page/terms" className="transition-colors hover:underline">
              Điều khoản
            </Link>
            <Link href="/public-page/security" className="transition-colors hover:underline">
              Bảo mật
            </Link>
            <Link href="/public-page/contact" className="transition-colors hover:underline">
              Liên hệ
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
