'use client';

import Link from 'next/link';

function InfoTile({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div
      className="rounded-lg border p-4"
      style={{
        borderColor: 'var(--color-border-subtle)',
        background: 'var(--color-bg-surface)',
      }}
    >
      <div className="text-2xl mb-2">{icon}</div>
      <div className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
        {label}
      </div>
      <div className="text-sm font-semibold mt-1" style={{ color: 'var(--color-text-primary)' }}>
        {value}
      </div>
    </div>
  );
}

export default function ContactPage() {
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
          Liên hệ với chúng tôi
        </h1>
        <p className="mt-2 text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Có câu hỏi hoặc đề xuất? Hãy gửi tin nhắn, đội ngũ POWORK sẽ phản hồi trong 1–2 ngày làm
          việc.
        </p>
        <hr className="my-4" style={{ borderColor: 'var(--color-border-subtle)' }} />

        <div className="grid gap-4 md:grid-cols-2">
          <InfoTile icon="✉️" label="Email" value="support@powork.vn" />
          <InfoTile icon="📞" label="Hotline" value="1900 8888 (giờ hành chính)" />
          <InfoTile icon="💬" label="Zalo OA" value="@powork" />
          <InfoTile icon="📍" label="Địa chỉ" value="TP. Hồ Chí Minh, Việt Nam" />
        </div>

        <hr className="my-6" style={{ borderColor: 'var(--color-border-subtle)' }} />

        <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
          Gửi tin nhắn cho chúng tôi
        </h2>
        <p className="mt-1 text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Điền thông tin bên dưới, chúng tôi sẽ liên hệ lại sớm nhất.
        </p>

        <form className="mt-4 space-y-4" onSubmit={(e) => e.preventDefault()}>
          <div>
            <label
              className="block text-sm font-medium mb-1"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Họ và tên
            </label>
            <input
              type="text"
              placeholder="Nguyễn Văn A"
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors"
              style={{
                borderColor: 'var(--color-border-subtle)',
                background: 'var(--color-bg-canvas)',
                color: 'var(--color-text-primary)',
              }}
            />
          </div>
          <div>
            <label
              className="block text-sm font-medium mb-1"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Email
            </label>
            <input
              type="email"
              placeholder="email@example.com"
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors"
              style={{
                borderColor: 'var(--color-border-subtle)',
                background: 'var(--color-bg-canvas)',
                color: 'var(--color-text-primary)',
              }}
            />
          </div>
          <div>
            <label
              className="block text-sm font-medium mb-1"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Nội dung
            </label>
            <textarea
              rows={4}
              placeholder="Nhập nội dung tin nhắn..."
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors resize-none"
              style={{
                borderColor: 'var(--color-border-subtle)',
                background: 'var(--color-bg-canvas)',
                color: 'var(--color-text-primary)',
              }}
            />
          </div>
          <button
            type="submit"
            className="rounded-lg px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: 'var(--color-brand-primary)' }}
          >
            Gửi tin nhắn
          </button>
        </form>
      </div>
    </div>
  );
}
