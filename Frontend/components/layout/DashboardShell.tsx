'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { status, user } = useAuth();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
    }
  }, [status, router]);

  // Retint toàn workspace theo vai trò: candidate = xanh lá, employer = vàng cam tối
  useEffect(() => {
    if (!user) return;
    const role = user.role === 'Employer' ? 'employer' : 'candidate';
    document.documentElement.setAttribute('data-role', role);
    return () => {
      document.documentElement.removeAttribute('data-role');
    };
  }, [user]);

  if (status !== 'authenticated') {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-foreground-secondary">
        Đang tải...
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
