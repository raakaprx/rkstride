import React, { useMemo } from 'react';
import { Flag, Compass, ArrowDownRight, Edit3 } from 'lucide-react';
import { RaceTargetConfig } from '@/types/productFeatures';
import { calculatePeriodizationPlan } from '@/lib/engine/periodization';

interface PeriodizationTaperCardProps {
  raceConfig: RaceTargetConfig;
  onEditRaceConfig: () => void;
}

export const PeriodizationTaperCard: React.FC<PeriodizationTaperCardProps> = ({
  raceConfig,
  onEditRaceConfig,
}) => {
  const plan = useMemo(() => {
    return calculatePeriodizationPlan(raceConfig);
  }, [raceConfig]);

  if (raceConfig.category === 'none') {
    return null;
  }

  // Phase badge styling
  const isTaperOrRaceWeek = plan.currentPhase === 'taper' || plan.currentPhase === 'race_week';

  return (
    <div
      className="card-mobile"
      style={{
        background: 'var(--bg-secondary)',
        border: isTaperOrRaceWeek ? '1px solid rgba(204, 255, 0, 0.4)' : '1px solid var(--border-default)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
        boxShadow: isTaperOrRaceWeek ? '0 0 20px rgba(204, 255, 0, 0.05)' : 'var(--shadow-elevation-1)',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-md)',
              background: isTaperOrRaceWeek ? 'rgba(204, 255, 0, 0.15)' : 'var(--bg-surface)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-neon)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <Flag size={18} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                {raceConfig.eventName || 'Target Kompetisi'}
              </h3>
              <span
                style={{
                  fontSize: '0.75rem',
                  padding: '0.15rem 0.45rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--accent-neon-subtle)',
                  color: 'var(--accent-neon)',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  border: '1px solid rgba(204, 255, 0, 0.2)',
                }}
              >
                {raceConfig.category.replace('_', ' ')}
              </span>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Hari-H: {raceConfig.raceDate} ({plan.daysToRace} hari lagi | {plan.weeksToRace} pekan)
            </span>
          </div>
        </div>

        <button
          onClick={onEditRaceConfig}
          title="Ubah Target Tanggal & Lomba"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '0.4rem 0.75rem',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-default)',
            color: 'var(--text-secondary)',
            fontSize: '0.75rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'var(--transition-fast)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--text-primary)';
            e.currentTarget.style.borderColor = 'var(--border-strong)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--text-secondary)';
            e.currentTarget.style.borderColor = 'var(--border-default)';
          }}
        >
          <Edit3 size={13} />
          <span>Ubah Target</span>
        </button>
      </div>

      {/* Periodization Progress Status Banner */}
      <div
        style={{
          background: isTaperOrRaceWeek ? 'rgba(204, 255, 0, 0.08)' : 'var(--bg-surface)',
          border: isTaperOrRaceWeek ? '1px solid rgba(204, 255, 0, 0.25)' : '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '1rem 1.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Compass size={16} style={{ color: 'var(--accent-neon)' }} />
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {plan.phaseName}
            </span>
          </div>

          {plan.isTaperActive && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.75rem',
                fontWeight: 800,
                color: 'var(--accent-neon)',
                background: 'rgba(0, 0, 0, 0.3)',
                padding: '0.25rem 0.6rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid rgba(204, 255, 0, 0.3)',
              }}
            >
              <ArrowDownRight size={14} />
              <span>Volume Tapering: {plan.volumeAdjustmentPercent}%</span>
            </div>
          )}
        </div>

        <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
          {plan.advice}
        </p>

        {/* Phase Breakdown Guidelines */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(240px, 100%), 1fr))', gap: '0.75rem', marginTop: '0.25rem' }}>
          <div style={{ background: 'var(--bg-secondary)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--accent-neon)', display: 'block', marginBottom: '0.2rem' }}>
              Panduan Kardio &amp; Lari
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-primary)', lineHeight: 1.35, display: 'block' }}>
              {plan.intensityGuideline}
            </span>
          </div>

          <div style={{ background: 'var(--bg-secondary)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-info)', display: 'block', marginBottom: '0.2rem' }}>
              Penyesuaian Angkat Beban (PPL)
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-primary)', lineHeight: 1.35, display: 'block' }}>
              {plan.strengthGuideline}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};



