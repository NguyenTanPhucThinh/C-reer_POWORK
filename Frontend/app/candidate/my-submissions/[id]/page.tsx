'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/hooks/useAuth';

export default function SubmissionDetailsPage() {
  const { user, status } = useAuth();

  if (status === 'loading') {
    return <p className="text-center text-foreground-secondary">Đang tải...</p>;
  }
  if (!user) return null;

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/candidate/my-submissions" className="back-link hover:underline">
        &larr; Quay lại bài nộp của tôi
      </Link>
      <div className="card-base mt-6 text-center">
        <h1 className="text-2xl font-semibold text-foreground">Chi tiết bài nộp chưa khả dụng</h1>
        <p className="mt-2 text-sm text-foreground-secondary">
          Backend chưa có endpoint cho Candidate đọc chi tiết bài nộp. Trang này không hiển thị dữ
          liệu mẫu để tránh gây hiểu nhầm là dữ liệu thật.
        </p>
      </div>
    </div>
  );
}
