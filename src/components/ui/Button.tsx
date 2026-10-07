import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger-outline' | 'info';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const variantStyles: Record<ButtonVariant, React.CSSProperties> = {
  primary: {
    background: 'var(--accent-neon)',
    color: 'var(--text-inverse)',
    border: 'none',
    fontWeight: 800,
  },
  secondary: {
    background: 'var(--bg-surface)',
    color: 'var(--text-secondary)',
    border: '1px solid var(--border-default)',
    fontWeight: 600,
  },
  ghost: {
    background: 'transparent',
    color: 'var(--text-secondary)',
    border: 'none',
    fontWeight: 600,
  },
  'danger-outline': {
    background: 'transparent',
    color: 'var(--color-danger)',
    border: '1px solid var(--color-danger)',
    fontWeight: 700,
  },
  info: {
    background: 'var(--color-info-bg)',
    color: 'var(--color-info)',
    border: '1px solid var(--color-info)',
    fontWeight: 700,
  },
};

/**
 * Shared button primitive (DESIGN.md). Minimum 44px target comes from the
 * global button rule in tokens.css; variants only define color treatment.
 */
export const Button: React.FC<ButtonProps> = ({
  variant = 'secondary',
  style,
  children,
  ...rest
}) => (
  <button
    style={{
      padding: '0.6rem 1.25rem',
      borderRadius: 'var(--radius-md)',
      fontSize: '0.85rem',
      cursor: 'pointer',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.5rem',
      ...variantStyles[variant],
      ...style,
    }}
    {...rest}
  >
    {children}
  </button>
);
