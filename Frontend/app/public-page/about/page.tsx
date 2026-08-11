'use client';

import Link from 'next/link';

export default function AboutPage() {
  return (
    <div
      className="min-h-screen"
      style={{ background: 'var(--color-bg-canvas)', color: 'var(--color-text-primary)' }}
    >
      <div className="mx-auto max-w-3xl rounded-xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-bg-surface)] p-6 shadow-[var(--shadow-surface)]">
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
          Giới thiệu về POWORK
        </h1>
        <hr className="my-4" style={{ borderColor: 'var(--color-border-subtle)' }} />

        <div className="space-y-4 leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
          <p>
            <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              POWORK
            </span>{' '}
            là nền tảng tuyển dụng dựa trên bằng chứng thực chiến được phát triển nhằm thay đổi cách
            doanh nghiệp tìm kiếm và đánh giá nhân tài. Thay vì dựa vào CV hay lý thuyết, POWORK cho
            phép nhà tuyển dụng tạo ra các thử thách thực tế, từ đó đánh giá chi tiết năng lực ứng
            viên qua bài làm cụ thể.
          </p>

          <h2 className="text-lg font-semibold pt-2" style={{ color: 'var(--color-text-primary)' }}>
            Sứ mệnh
          </h2>
          <p>
            Chúng tôi tin rằng nhân tài thực sự được chứng minh qua chất lượng công việc. POWORK kết
            nối những ứng viên năng động với các cơ hội việc làm phù hợp nhất, đồng thời giúp nhà
            tuyển dụng ra quyết định tuyển chính xác hơn thông qua dữ liệu thực tế.
          </p>

          <h2 className="text-lg font-semibold pt-2" style={{ color: 'var(--color-text-primary)' }}>
            Tầm nhìn
          </h2>
          <p>
            Trở thành nền tảng tuyển dụng thông minh hàng đầu tại Việt Nam, nơi mọi tuyển dụng đều
            minh bạch, hiệu quả và dựa trên năng lực thật của mỗi cá nhân.
          </p>

          <h2 className="text-lg font-semibold pt-2" style={{ color: 'var(--color-text-primary)' }}>
            Giá trị cốt lõi
          </h2>
          <ul className="list-inside list-disc space-y-1 pl-2">
            <li>
              <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
                Đồng nhất
              </span>{' '}
              – Đánh giá theo bằng chứng thực tế, không dựa trên cảm tính.
            </li>
            <li>
              <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
                Minh bạch
              </span>{' '}
              – Quy trình đánh giá rõ ràng, công bằng cho cả hai phía.
            </li>
            <li>
              <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
                Liên tục cải tiến
              </span>{' '}
              – Không ngừng tối ưu trải nghiệm dựa trên phản hồi người dùng.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
