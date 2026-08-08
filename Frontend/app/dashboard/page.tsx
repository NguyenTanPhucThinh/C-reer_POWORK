'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';

export default function DashboardRedirectPage() {
  const router = useRouter();
  const { user, status } = useAuth();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
      return;
    }
    if (status !== 'authenticated' || !user) return;
    router.replace(user.role === 'Employer' ? '/employer/dashboard' : '/candidate/dashboard');
  }, [router, status, user]);

  return (
    <div className="flex h-screen items-center justify-center bg-background text-foreground-secondary">
      Đang tải...
    </div>
  );
}
