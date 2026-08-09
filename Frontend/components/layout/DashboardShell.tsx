'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import type { UserRole } from '@/lib/types';

export function DashboardShell({
  children,
  allowedRole,
  showNavigation = true,
}: {
  children: React.ReactNode;
  allowedRole?: UserRole;
  showNavigation?: boolean;
}) {
  const router = useRouter();
  const { status, user } = useAuth();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
    } else if (status === 'authenticated' && user && allowedRole && user.role !== allowedRole) {
      router.replace(user.role === 'Employer' ? '/employer/dashboard' : '/candidate/dashboard');
    }
  }, [allowedRole, status, router, user]);

  // Retint toàn workspace theo vai trò: candidate = xanh lá, employer = vàng cam tối
  useEffect(() => {
    if (!user) return;
    const role = user.role === 'Employer' ? 'employer' : 'candidate';
    document.documentElement.setAttribute('data-role', role);
    return () => {
      document.documentElement.removeAttribute('data-role');
    };
  }, [user]);

  if (status !== 'authenticated' || (allowedRole && user?.role !== allowedRole)) {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-foreground-secondary">
        Đang tải...
      </div>
    );
  }

  if (!showNavigation) {
    return <main className="h-screen overflow-y-auto bg-background">{children}</main>;
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
