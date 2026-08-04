import { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';

type Role = 'employer' | 'candidate' | 'system';

interface RolePillProps extends HTMLAttributes<HTMLSpanElement> {
  role: Role;
}

const roleStyles: Record<Role, string> = {
  employer: 'border-warning/40 bg-warning-bg text-warning',
  candidate: 'border-success/40 bg-success-bg text-success',
  system: 'bg-background-tertiary text-foreground-secondary border-border-secondary',
};

const roleLabels: Record<Role, string> = {
  employer: 'Nhà tuyển dụng',
  candidate: 'Ứng viên',
  system: 'Hệ thống',
};

export function RolePill({ role, className, children, ...props }: RolePillProps) {
  return (
    <span
      className={cn(
        'inline-block rounded-pill border-hairline px-[9px] py-0.5 text-2xs font-medium',
        roleStyles[role],
        className
      )}
      {...props}
    >
      {children ?? roleLabels[role]}
    </span>
  );
}
