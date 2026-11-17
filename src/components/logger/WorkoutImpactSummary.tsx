import React from 'react';
import { AlertTriangle, Sparkles } from 'lucide-react';
import { ACWRStatus } from '@/types/workout';

interface WorkoutImpactSummaryProps {
  projectedImpact: {
    draftLoad: number;
    projectedACWR: number;
    projectedStatus: ACWRStatus;
    isOverloaded: boolean;
    legConflict: boolean;
    advice: string;
  };
  lastLegsHoursAgo: number;
  onOpenOverrideModal: () => void;
}

export const WorkoutImpactSummary: React.FC<WorkoutImpactSummaryProps> = ({
  projectedImpact,
  lastLegsHoursAgo,
  onOpenOverrideModal,
}) => {
  const isColdStart = projectedImpact.projectedStatus === 'insufficient_data';

  return (
    <div
      style={{
        background: 'var(--bg-secondary)',
        borderRadius: 'var(--radius-md)',
        padding: '1.25rem',
        border: '1px solid var(--border-default)',
        borderLeft: projectedImpact.isOverloaded
          ? '3px solid var(--color-danger)'
          : projectedImpact.legConflict
          ? '3px solid var(--color-warning)'
          : '3px solid var(--accent-neon)',
        marginBottom: '1.5rem',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.5rem',
          marginBottom: '0.75rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Sparkles
            size={17}
            style={{ color: projectedImpact.isOverloaded ? 'var(--color-danger)' : 'var(--accent-neon)' }}
          />
          <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            Planned Workout Evaluation (Live Safety &amp; ACWR Check)
          </h4>
        </div>

        <span
          style={{
            fontSize: '0.7rem',
            fontWeight: 700,
            padding: '0.2rem 0.6rem',
            borderRadius: 'var(--radius-full)',
            background: projectedImpact.isOverloaded
              ? 'var(--color-danger-bg)'
              : projectedImpact.legConflict
              ? 'var(--color-warning-bg)'
              : 'var(--accent-neon-subtle)',
            color: projectedImpact.isOverloaded
              ? 'var(--color-danger)'
              : projectedImpact.legConflict
              ? 'var(--color-warning)'
              : 'var(--accent-neon)',
            border: projectedImpact.isOverloaded
              ? '1px solid rgba(239, 68, 68, 0.3)'
              : projectedImpact.legConflict
              ? '1px solid rgba(245, 158, 11, 0.3)'
              : '1px solid rgba(204, 255, 0, 0.25)',
            letterSpacing: '0.04em',
          }}
        >
          {isColdStart
            ? 'BASELINE (<21 HARI)'
            : projectedImpact.isOverloaded
            ? 'WORKLOAD OVERLOAD'
            : projectedImpact.legConflict
            ? 'LEG RECOVERY CAUTION'
            : 'OPTIMAL (BALANCED)'}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Planned Session Load</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {projectedImpact.draftLoad}{' '}
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>pts</span>
          </div>
        </div>

        <div style={{ width: '1px', height: '35px', background: 'var(--border-subtle)' }} />

        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Projected ACWR Post-Workout</div>
          <div
            style={{
              fontSize: '1.4rem',
              fontWeight: 800,
              color: projectedImpact.isOverloaded ? 'var(--color-danger)' : 'var(--accent-neon)',
            }}
          >
            {isColdStart ? 'Provisional' : projectedImpact.projectedACWR}
          </div>
        </div>

        <div style={{ width: '1px', height: '35px', background: 'var(--border-subtle)' }} />

        <div style={{ flex: 1, minWidth: '220px' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Engine Diagnostic</div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-primary)', lineHeight: 1.4 }}>
            {projectedImpact.advice}
          </div>
        </div>
      </div>

      {projectedImpact.legConflict && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'var(--bg-surface)',
            padding: '0.75rem 0.85rem',
            borderRadius: 'var(--radius-sm)',
            borderLeft: '3px solid var(--color-warning)',
            fontSize: '0.78rem',
            color: 'var(--color-warning)',
            flexWrap: 'wrap',
          }}
        >
          <AlertTriangle size={16} />
          <span style={{ flex: 1, minWidth: '220px' }}>
            Caution: Previous leg day completed only {lastLegsHoursAgo}h ago. Avoid heavy quadriceps loading or
            high-speed intervals today to safeguard knee tendons and hamstrings.
          </span>
          <button
            type="button"
            onClick={onOpenOverrideModal}
            style={{
              padding: '0.35rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
              background: 'transparent',
              border: '1px solid var(--color-warning)',
              color: 'var(--color-warning)',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            Lanjutkan tetap
          </button>
        </div>
      )}
    </div>
  );
};
