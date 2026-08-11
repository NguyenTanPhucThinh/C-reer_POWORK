'use client';

import Link from 'next/link';

export default function SecurityPage() {
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
          Chính sách Bảo mật
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
              1. Thu thập dữ liệu
            </h2>
            <p>
              POWORK chỉ thu thập các thông tin cần thiết khi bạn tạo tài khoản hoặc sử dụng dịch
              vụ, bao gồm: họ tên, email, thông tin hồ sơ nghề nghiệp và kết quả bài thử thách.
              Chúng tôi không thu thập dữ liệu ngoài phạm vi cần thiết để vận hành nền tảng.
            </p>
          </section>

          <section>
            <h2
              className="text-lg font-semibold pt-2"
              style={{ color: 'var(--color-text-primary)' }}
            >
              2. Sử dụng dữ liệu
            </h2>
            <p>
              Dữ liệu của bạn được sử dụng để: cá nhân hóa trải nghiệm tuyển dụng, đánh giá bài thử
              thách, kết nối ứng viên với nhà tuyển dụng phù hợp, và cải thiện chất lượng dịch vụ.
              Chúng tôi không bán hoặc chia sẻ dữ liệu cá nhân cho bên thứ ba vì mục đích quảng cáo.
            </p>
          </section>

          <section>
            <h2
              className="text-lg font-semibold pt-2"
              style={{ color: 'var(--color-text-primary)' }}
            >
              3. Bảo vệ dữ liệu
            </h2>
            <ul className="list-inside list-disc space-y-1 pl-2">
              <li>Mã hóa dữ liệu truyền tải bằng TLS/SSL.</li>
              <li>Mã hóa dữ liệu lưu trữ (encryption at rest) cho các thông tin nhạy cảm.</li>
              <li>Kiểm soát quyền truy cập theo nguyên tắc tối thiểu (least privilege).</li>
              <li>Kiểm tra bảo mật định kỳ và cập nhật hệ thống liên tục.</li>
            </ul>
          </section>

          <section>
            <h2
              className="text-lg font-semibold pt-2"
              style={{ color: 'var(--color-text-primary)' }}
            >
              4. Quyền của người dùng
            </h2>
            <p>
              Bạn có quyền truy cập, chỉnh sửa, hoặc yêu cầu xóa dữ liệu cá nhân bất cứ lúc nào
              thông qua cài đặt tài khoản hoặc liên hệ đội ngũ hỗ trợ tại{' '}
              <span className="font-medium" style={{ color: 'var(--color-brand-primary)' }}>
                support@powork.vn
              </span>
              .
            </p>
          </section>

          <section>
            <h2
              className="text-lg font-semibold pt-2"
              style={{ color: 'var(--color-text-primary)' }}
            >
              5. Cookie
            </h2>
            <p>
              POWORK sử dụng cookie phiên để duy trì trạng thái đăng nhập và cookie phân tích để cải
              thiện trải nghiệm người dùng. Bạn có thể tắt cookie trong trình duyệt, tuy nhiên một
              số tính năng có thể bị hạn chế.
            </p>
          </section>

          <section>
            <h2
              className="text-lg font-semibold pt-2"
              style={{ color: 'var(--color-text-primary)' }}
            >
              6. Liên hệ
            </h2>
            <p>
              Nếu có thắc mắc về chính sách bảo mật, vui lòng liên hệ qua email{' '}
              <span className="font-medium" style={{ color: 'var(--color-brand-primary)' }}>
                privacy@powork.vn
              </span>{' '}
              hoặc trang{' '}
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
