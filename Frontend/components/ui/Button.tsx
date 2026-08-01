import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils/cn';

type ButtonVariant = 'default' | 'primary' | 'accent' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantStyles: Record<ButtonVariant, string> = {
  default: 'bg-background-tertiary text-foreground border-hairline border-border-secondary',
  primary:
    'bg-accent text-white border border-accent hover:bg-accent-hover active:bg-accent-pressed',
  accent: 'bg-accent-bg text-accent border border-accent',
  danger: 'bg-error-bg text-error border border-error',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'text-2xs px-2.5 py-[3px]',
  md: 'text-xs px-[13px] py-1.5',
  lg: 'text-sm px-[18px] py-2',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'default', size = 'md', className, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center whitespace-nowrap rounded-lg font-medium transition-colors',
          'hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-1 focus-visible:ring-offset-background',
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';
