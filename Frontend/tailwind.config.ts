import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        background: 'var(--color-bg-canvas)',
        'background-secondary': 'var(--color-bg-surface)',
        'background-tertiary': 'var(--color-bg-surface-hover)',
        elevated: 'var(--color-bg-surface-elevated)',
        input: 'var(--color-bg-input)',
        sidebar: 'var(--color-bg-sidebar)',
        foreground: 'var(--color-text-primary)',
        'foreground-secondary': 'var(--color-text-secondary)',
        'foreground-tertiary': 'var(--color-text-muted)',
        'foreground-disabled': 'var(--color-text-disabled)',
        accent: 'var(--color-brand-primary)',
        'accent-hover': 'var(--color-brand-hover)',
        'accent-pressed': 'var(--color-brand-pressed)',
        'accent-bg': 'var(--color-brand-subtle)',
        success: 'var(--color-success)',
        'success-bg': 'var(--color-success-subtle)',
        warning: 'var(--color-warning)',
        'warning-bg': 'var(--color-warning-subtle)',
        error: 'var(--color-danger)',
        'error-bg': 'var(--color-danger-subtle)',
        info: 'var(--color-info)',
        'info-bg': 'var(--color-info-subtle)',
        focus: 'var(--color-focus-ring)',
      },
      borderColor: {
        border: 'var(--color-border-subtle)',
        'border-secondary': 'var(--color-border-strong)',
      },
      borderRadius: {
        sm: '4px',
        md: 'var(--radius-sm)',
        lg: 'var(--radius-md)',
        xl: 'var(--radius-lg)',
        pill: '20px',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        '2xs': ['10px', { lineHeight: '14px' }],
        xs: ['11px', { lineHeight: '15px' }],
        sm: ['12px', { lineHeight: '16px' }],
        base: ['13px', { lineHeight: '19px' }],
        md: ['15px', { lineHeight: '22px' }],
        lg: ['16px', { lineHeight: '24px' }],
        xl: ['16px', { lineHeight: '24px' }],
        '2xl': ['18px', { lineHeight: '27px' }],
        '3xl': ['20px', { lineHeight: '30px' }],
        '4xl': ['28px', { lineHeight: '36px' }],
      },
      borderWidth: {
        hairline: '0.5px',
      },
    },
  },
  plugins: [],
};

export default config;
