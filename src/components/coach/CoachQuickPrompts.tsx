import React from 'react';

interface CoachQuickPromptsProps {
  prompts: string[];
  onSelectPrompt: (prompt: string) => void;
  isLoading: boolean;
}

export const CoachQuickPrompts: React.FC<CoachQuickPromptsProps> = ({
  prompts,
  onSelectPrompt,
  isLoading,
}) => {
  return (
    <div
      style={{
        padding: '0.5rem 0.75rem',
        background: 'var(--bg-surface)',
        borderTop: '1px solid var(--border-subtle)',
        display: 'flex',
        gap: '0.4rem',
        overflowX: 'auto',
        whiteSpace: 'nowrap',
      }}
    >
      {prompts.map((p, idx) => (
        <button
          key={idx}
          onClick={() => onSelectPrompt(p)}
          disabled={isLoading}
          style={{
            fontSize: '0.75rem',
            padding: '0.3rem 0.75rem',
            borderRadius: 'var(--radius-full)',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-default)',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            flexShrink: 0,
            transition: 'var(--transition-fast)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--accent-neon)';
            e.currentTarget.style.color = 'var(--text-primary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-default)';
            e.currentTarget.style.color = 'var(--text-secondary)';
          }}
        >
          {p}
        </button>
      ))}
    </div>
  );
};
