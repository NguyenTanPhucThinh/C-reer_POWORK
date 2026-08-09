'use client';

import Link from 'next/link';

export default function TermsPage() {
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
          Điều khoản Sử dụng
        </h1>
        <p className="mt-2 text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Cập nhật lần cuối: 01/08/2026
        </p>
        <hr className="my-4" style={{ borderColor: 'var(--color-border-subtle)' }} />

        <div className="space-y-4 leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
          <section>
            <h2
              className="text-lg font-semibold pt-2"
              style={{ color: 'var(--color-text-primary)' }}
            >
              1. Chấp nhận điều khoản
            </h2>
            <p>
              Bằng việc truy cập hoặc sử dụng POWORK, bạn đồng ý tuân thủ các điều khoản được nêu
              trong tài liệu này. Nếu không đồng ý, vui lòng ngừng sử dụng nền tảng.
            </p>
          </section>

          <section>
            <h2
              className="text-lg font-semibold pt-2"
              style={{ color: 'var(--color-text-primary)' }}
            >
              2. Tài khoản người dùng
            </h2>
            <ul className="list-inside list-disc space-y-1 pl-2">
              <li>Bạn phải cung cấp thông tin chính xác khi đăng ký tài khoản.</li>
              <li>Bạn chịu trách nhiệm bảo mật thông tin đăng nhập của mình.</li>
              <li>POWORK có quyền tạm khóa hoặc xóa tài khoản vi phạm điều khoản.</li>
            </ul>
          </section>

          <section>
            <h2
              className="text-lg font-semibold pt-2"
              style={{ color: 'var(--color-text-primary)' }}
            >
              3. Quy tắc sử dụng
            </h2>
            <p>Khi sử dụng POWORK, bạn cam kết:</p>
            <ul className="list-inside list-disc space-y-1 pl-2 mt-1">
              <li>Không đăng nội dung vi phạm pháp luật, gian lận hoặc gây hiểu lầm.</li>
              <li>
                Không sao chép, phân phối hoặc khai thác nội dung của nền tảng mà không được phép.
              </li>
              <li>Không cố gắng can thiệp vào hệ thống hoặc truy cập trái phép.</li>
              <li>Tôn trọng quyền riêng tư và thông tin của người dùng khác.</li>
            </ul>
          </section>

          <section>
            <h2
              className="text-lg font-semibold pt-2"
              style={{ color: 'var(--color-text-primary)' }}
            >
              4. Sở hữu trí tuệ
            </h2>
            <p>
              Tất cả nội dung trên POWORK (bao gồm logo, giao diện, mã nguồn và tài liệu) thuộc
              quyền sở hữu của POWORK hoặc bên cấp phép. Bài nộp thử thách do ứng viên tạo ra vẫn
              thuộc quyền sở hữu của ứng viên, trừ khi có thỏa thuận riêng với nhà tuyển dụng.
            </p>
          </section>

          <section>
            <h2
              className="text-lg font-semibold pt-2"
              style={{ color: 'var(--color-text-primary)' }}
            >
              5. Giới hạn trách nhiệm
            </h2>
            <p>
              POWORK cung cấp nền tảng &quot;nguyên trạng&quot; (as-is). Chúng tôi không đảm bảo nền
              tảng luôn hoạt động liên tục hoặc không có lỗi. POWORK không chịu trách nhiệm về bất
              kỳ thiệt hại gián tiếp nào phát sinh từ việc sử dụng dịch vụ.
            </p>
          </section>

          <section>
            <h2
              className="text-lg font-semibold pt-2"
              style={{ color: 'var(--color-text-primary)' }}
            >
              6. Chấm dứt
            </h2>
            <p>
              Bạn có thể ngừng sử dụng POWORK và xóa tài khoản bất cứ lúc nào. POWORK có quyền chấm
              dứt hoặc tạm ngưng quyền truy cập của bạn nếu phát hiện hành vi vi phạm điều khoản.
            </p>
          </section>

          <section>
            <h2
              className="text-lg font-semibold pt-2"
              style={{ color: 'var(--color-text-primary)' }}
            >
              7. Liên hệ
            </h2>
            <p>
              Mọi thắc mắc về điều khoản sử dụng, vui lòng liên hệ{' '}
              <span className="font-medium" style={{ color: 'var(--color-brand-primary)' }}>
                legal@powork.vn
              </span>{' '}
              hoặc truy cập trang{' '}
              <Link
                href="/public-page/contact"
                className="underline"
                style={{ color: 'var(--color-brand-primary)' }}
              >
                Liên hệ
              </Link>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
