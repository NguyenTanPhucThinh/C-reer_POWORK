'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/hooks/useAuth';

export default function MySubmissionsPage() {
  const { user, status } = useAuth();

  if (status === 'loading') {
    return <p className="text-center text-foreground-secondary">Đang tải...</p>;
  }
  if (!user) return null;

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-4xl font-semibold tracking-tight text-foreground">Bài nộp của tôi</h1>
      <div className="card-base mt-8 text-center">
        <h2 className="text-xl font-semibold text-foreground">Lịch sử bài nộp chưa khả dụng</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm text-foreground-secondary">
          Backend hiện chưa cung cấp lịch sử bài nộp cho Candidate. Bạn vẫn có thể mở một thử
          thách và nộp bài mới bình thường.
        </p>
        <Link href="/challenges" className="btn-base mt-5 inline-flex">
          Xem danh sách thử thách
        </Link>
      </div>
    </div>
  );
}
