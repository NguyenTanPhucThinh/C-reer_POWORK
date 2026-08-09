'use client';

import Link from 'next/link';

interface PlanCardProps {
  name: string;
  price: string;
  period: string;
  features: string[];
  highlighted?: boolean;
}

function PlanCard({ name, price, period, features, highlighted }: PlanCardProps) {
  return (
    <div
      className="rounded-xl border p-5 flex flex-col"
      style={{
        borderColor: highlighted ? 'var(--color-brand-primary)' : 'var(--color-border-subtle)',
        background: 'var(--color-bg-surface)',
        boxShadow: highlighted ? '0 0 0 2px var(--color-brand-primary)' : undefined,
      }}
    >
      <h3 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>
        {name}
      </h3>
      <div className="mt-2">
        <span className="text-2xl font-extrabold" style={{ color: 'var(--color-text-primary)' }}>
          {price}
        </span>
        <span className="text-sm ml-1" style={{ color: 'var(--color-text-muted)' }}>
          {period}
        </span>
      </div>
      <hr className="my-4" style={{ borderColor: 'var(--color-border-subtle)' }} />
      <ul className="space-y-2 flex-1">
        {features.map((f) => (
          <li
            key={f}
            className="flex items-start gap-2 text-sm"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            <span style={{ color: 'var(--color-brand-primary)' }}>✓</span>
            {f}
          </li>
        ))}
      </ul>
      <button
        className="mt-5 w-full rounded-lg py-2 text-sm font-semibold transition-opacity hover:opacity-90"
        style={{
          background: highlighted ? 'var(--color-brand-primary)' : 'transparent',
          color: highlighted ? '#fff' : 'var(--color-brand-primary)',
          border: highlighted ? 'none' : '1px solid var(--color-brand-primary)',
        }}
      >
        {highlighted ? 'Bắt đầu ngay' : 'Chọn gói'}
      </button>
    </div>
  );
}

export default function SubscriptionPage() {
  return (
    <div
      className="min-h-screen"
      style={{ background: 'var(--color-bg-canvas)', color: 'var(--color-text-primary)' }}
    >
      <div
        className="mx-auto max-w-3xl rounded-xl border p-6 shadow-[var(--shadow-surface)]"
        style={{
          borderColor: 'var(--color-border-subtle)',
          background: 'var(--color-bg-surface)',
        }}
      >
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs transition-colors"
            style={{ color: 'var(--color-text-muted)' }}
          >
            <span>←</span>
            Quay về trang chủ
          </Link>
        </div>

        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
          Gói dịch vụ
        </h1>
        <p className="mt-2 text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Chọn gói phù hợp với nhu cầu tuyển dụng của bạn. Nâng cấp hoặc hủy bất cứ lúc nào.
        </p>
        <hr className="my-4" style={{ borderColor: 'var(--color-border-subtle)' }} />

        <div className="grid gap-4 md:grid-cols-3">
          <PlanCard
            name="Miễn phí"
            price="0₫"
            period="/tháng"
            features={[
              'Đăng 3 thử thách / tháng',
              'Xem tối đa 10 bài nộp',
              'Bảng xếp hạng cơ bản',
              'Hỗ trợ qua email',
            ]}
          />
          <PlanCard
            name="Pro"
            price="499.000₫"
            period="/tháng"
            highlighted
            features={[
              'Đăng không giới hạn thử thách',
              'Xem toàn bộ bài nộp',
              'AI gợi ý ứng viên phù hợp',
              'Báo cáo chi tiết & xuất CSV',
              'Hỗ trợ ưu tiên 24/7',
            ]}
          />
          <PlanCard
            name="Doanh nghiệp"
            price="Liên hệ"
            period=""
            features={[
              'Tất cả tính năng Pro',
              'SSO & quản lý nhóm',
              'API tích hợp ATS',
              'Account Manager riêng',
              'SLA cam kết uptime 99.9%',
            ]}
          />
        </div>

        <hr className="my-6" style={{ borderColor: 'var(--color-border-subtle)' }} />

        <div className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
          <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
            Câu hỏi thường gặp
          </h2>
          <div className="space-y-3">
            <div>
              <p className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
                Tôi có thể hủy gói bất cứ lúc nào không?
              </p>
              <p>Có, bạn có thể hủy hoặc thay đổi gói bất kỳ lúc nào từ trang cài đặt tài khoản.</p>
            </div>
            <div>
              <p className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
                Thanh toán có an toàn không?
              </p>
              <p>
                POWORK sử dụng cổng thanh toán đạt chuẩn PCI-DSS. Thông tin thẻ của bạn được mã hóa
                và không lưu trên hệ thống của chúng tôi.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
