'use client';

import Link from 'next/link';

interface StepProps {
  number: number;
  title: string;
  description: string;
}

function Step({ number, title, description }: StepProps) {
  return (
    <div className="flex gap-4">
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
        style={{ background: 'var(--color-brand-primary)' }}
      >
        {number}
      </div>
      <div>
        <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
          {title}
        </h3>
        <p className="mt-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          {description}
        </p>
      </div>
    </div>
  );
}

export default function GuidesPage() {
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
          Hướng dẫn sử dụng
        </h1>
        <p className="mt-2 text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Bắt đầu sử dụng POWORK chỉ trong vài phút với hướng dẫn dưới đây.
        </p>
        <hr className="my-4" style={{ borderColor: 'var(--color-border-subtle)' }} />

        <div className="space-y-6">
          {/* Ứng viên */}
          <section>
            <h2
              className="text-lg font-semibold mb-4"
              style={{ color: 'var(--color-text-primary)' }}
            >
              🎯 Dành cho Ứng viên
            </h2>
            <div className="space-y-4">
              <Step
                number={1}
                title="Tạo tài khoản"
                description="Đăng ký bằng email hoặc tài khoản Google. Hoàn thiện hồ sơ cá nhân bao gồm kỹ năng, kinh nghiệm và lĩnh vực quan tâm."
              />
              <Step
                number={2}
                title="Khám phá thử thách"
                description="Duyệt danh sách thử thách từ các nhà tuyển dụng. Lọc theo ngành nghề, vị trí và mức độ khó để tìm thử thách phù hợp."
              />
              <Step
                number={3}
                title="Nộp bài làm"
                description="Hoàn thành thử thách và nộp bài trước hạn. Bạn có thể đính kèm file, link GitHub hoặc bất kỳ tài liệu nào thể hiện năng lực."
              />
              <Step
                number={4}
                title="Nhận kết quả & kết nối"
                description="Theo dõi kết quả đánh giá, so sánh với ứng viên khác trên bảng xếp hạng và nhận lời mời phỏng vấn từ nhà tuyển dụng."
              />
            </div>
          </section>

          <hr style={{ borderColor: 'var(--color-border-subtle)' }} />

          {/* Nhà tuyển dụng */}
          <section>
            <h2
              className="text-lg font-semibold mb-4"
              style={{ color: 'var(--color-text-primary)' }}
            >
              🏢 Dành cho Nhà tuyển dụng
            </h2>
            <div className="space-y-4">
              <Step
                number={1}
                title="Đăng ký tài khoản doanh nghiệp"
                description="Tạo tài khoản doanh nghiệp, thêm thông tin công ty và xác minh để tăng độ tin cậy với ứng viên."
              />
              <Step
                number={2}
                title="Tạo thử thách"
                description="Thiết kế thử thách phản ánh công việc thực tế. Đặt tiêu chí đánh giá rõ ràng, thời hạn nộp bài và yêu cầu kỹ năng."
              />
              <Step
                number={3}
                title="Xem & đánh giá bài nộp"
                description="Xem danh sách bài nộp, chấm điểm theo tiêu chí đã đặt. Hệ thống AI hỗ trợ phân tích và xếp hạng ứng viên tự động."
              />
              <Step
                number={4}
                title="Kết nối ứng viên"
                description="Gửi lời mời phỏng vấn hoặc đề nghị việc làm cho những ứng viên xuất sắc nhất trực tiếp trên nền tảng."
              />
            </div>
          </section>
        </div>

        <hr className="my-6" style={{ borderColor: 'var(--color-border-subtle)' }} />

        <div
          className="rounded-lg border p-4 text-sm"
          style={{
            borderColor: 'var(--color-border-subtle)',
            background: 'var(--color-bg-canvas)',
            color: 'var(--color-text-secondary)',
          }}
        >
          <p className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
            💡 Cần hỗ trợ thêm?
          </p>
          <p className="mt-1">
            Liên hệ đội ngũ POWORK qua trang{' '}
            <Link
              href="/public-page/contact"
              className="underline"
              style={{ color: 'var(--color-brand-primary)' }}
            >
              Liên hệ
            </Link>{' '}
            hoặc gửi email tới{' '}
            <span className="font-medium" style={{ color: 'var(--color-brand-primary)' }}>
              support@powork.vn
            </span>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
