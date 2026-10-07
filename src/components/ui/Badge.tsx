import React from 'react';

type BadgeTone = 'neon' | 'success' | 'warning' | 'danger' | 'info' | 'muted';

interface BadgeProps {
  tone?: BadgeTone;
  children: React.ReactNode;
  style?: React.CSSProperties;
}

const toneStyles: Record<BadgeTone, { background: string; color: string; border: string }> = {
  neon: {
    background: 'var(--accent-neon-subtle)',
    color: 'var(--accent-neon)',
    border: '1px solid rgba(204, 255, 0, 0.25)',
  },
  success: {
    background: 'var(--color-success-bg)',
    color: 'var(--color-success)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
  },
  warning: {
    background: 'var(--color-warning-bg)',
    color: 'var(--color-warning)',
    border: '1px solid rgba(245, 158, 11, 0.3)',
  },
  danger: {
    background: 'var(--color-danger-bg)',
    color: 'var(--color-danger)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
  },
  info: {
    background: 'var(--color-info-bg)',
    color: 'var(--color-info)',
    border: '1px solid rgba(56, 189, 248, 0.35)',
  },
  muted: {
    background: 'var(--bg-surface)',
    color: 'var(--text-muted)',
    border: '1px solid var(--border-subtle)',
  },
};

/**
 * Shared status badge (DESIGN.md). Badges mark real state only (R-09).
 */
export const Badge: React.FC<BadgeProps> = ({ tone = 'muted', children, style }) => (
  <span
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      fontSize: '0.75rem',
      fontWeight: 700,
      padding: '0.2rem 0.6rem',
      borderRadius: 'var(--radius-full)',
      letterSpacing: '0.04em',
      ...toneStyles[tone],
      ...style,
    }}
  >
    {children}
  </span>
);
