import { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';

type BadgeVariant = 'open' | 'blind' | 'done' | 'fail' | 'invited';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantStyles: Record<BadgeVariant, string> = {
  open: 'bg-success-bg text-success border-success',
  blind: 'bg-warning-bg text-warning border-warning',
  done: 'bg-info-bg text-info border-info',
  fail: 'bg-background-tertiary text-foreground-secondary border-border-secondary',
  invited: 'bg-accent-bg text-accent border-accent',
};

export function Badge({ variant = 'open', className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-block rounded-pill border-hairline px-[9px] py-0.5 text-2xs font-medium',
        variantStyles[variant],
        className
      )}
      {...props}
    />
  );
}
