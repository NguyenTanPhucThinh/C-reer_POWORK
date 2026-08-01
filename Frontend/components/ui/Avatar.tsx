import { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';

type AvatarSize = 'sm' | 'md' | 'lg';

interface AvatarProps extends HTMLAttributes<HTMLSpanElement> {
  initials: string;
  size?: AvatarSize;
}

const sizeStyles: Record<AvatarSize, string> = {
  sm: 'w-[30px] h-[30px] text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-11 h-11 text-md',
};

export function Avatar({ initials, size = 'md', className, ...props }: AvatarProps) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full font-semibold',
        'bg-accent-bg text-accent border border-accent',
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {initials}
    </span>
  );
}
