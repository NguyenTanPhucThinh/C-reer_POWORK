'use client';

import { usePathname } from 'next/navigation';
import { DashboardShell } from '@/components/layout';
import { isCandidateVerificationPath } from '@/lib/utils/helpers';

export default function CandidateLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <DashboardShell allowedRole="Candidate" showNavigation={!isCandidateVerificationPath(pathname)}>
      {children}
    </DashboardShell>
  );
}
