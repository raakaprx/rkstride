import React from 'react';

type CardAccent = 'none' | 'neon' | 'success' | 'warning' | 'danger';

interface CardProps {
  children: React.ReactNode;
  accent?: CardAccent;
  style?: React.CSSProperties;
}

const accentBorder: Record<CardAccent, string> = {
  none: '1px solid var(--border-default)',
  neon: '1px solid var(--border-default)',
  success: '1px solid var(--border-default)',
  warning: '1px solid rgba(245, 158, 11, 0.4)',
  danger: '1px solid rgba(239, 68, 68, 0.35)',
};

const accentEdge: Record<CardAccent, string | undefined> = {
  none: undefined,
  neon: '3px solid var(--accent-neon)',
  success: '3px solid var(--color-success)',
  warning: '3px solid var(--color-warning)',
  danger: '3px solid var(--color-danger)',
};

/**
 * Shared card shell (DESIGN.md). The left edge color marks REAL state
 * (danger/warning/success), never decoration.
 */
export const Card: React.FC<CardProps> = ({ children, accent = 'none', style }) => (
  <div
    style={{
      background: 'var(--bg-surface)',
      borderRadius: 'var(--radius-lg)',
      border: accentBorder[accent],
      ...(accentEdge[accent] ? { borderLeft: accentEdge[accent] } : {}),
      padding: '1.75rem',
      boxShadow: 'var(--shadow-elevation-2)',
      ...style,
    }}
  >
    {children}
  </div>
);
