import { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils/cn';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          'w-full rounded-lg border bg-input px-[11px] py-[7px] text-sm text-foreground',
          'placeholder:text-foreground-tertiary',
          'focus:outline-none focus:border-accent focus-visible:ring-2 focus-visible:ring-focus transition-colors',
          error ? 'border-error' : 'border-border-secondary',
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';
