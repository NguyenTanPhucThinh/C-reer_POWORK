import { DashboardShell } from '@/components/layout';

export default function CandidateLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell allowedRole="Candidate">{children}</DashboardShell>;
}
