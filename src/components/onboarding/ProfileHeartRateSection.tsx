import React from 'react';
import { estimateMaxHeartRate } from '@/lib/engine/workload';

interface ProfileHeartRateSectionProps {
  age: number;
  restingHrBaseline: number;
  maxHr: number;
  hrMaxFormula: 'tanaka' | 'gellish' | 'custom';
  calculatedMaxHr: number;
  onChange: (fields: Partial<{
    restingHrBaseline: number;
    maxHr: number;
    hrMaxFormula: 'tanaka' | 'gellish' | 'custom';
  }>) => void;
}

export const ProfileHeartRateSection: React.FC<ProfileHeartRateSectionProps> = ({
  age,
  restingHrBaseline,
  maxHr,
  hrMaxFormula,
  calculatedMaxHr,
  onChange,
}) => {
  return (
    <div>
      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-neon)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        2. Kalibrasi Denyut Jantung (HRR Karvonen)
      </span>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(180px, 100%), 1fr))', gap: '0.75rem', marginTop: '0.5rem' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
            Resting Heart Rate (RHR Baseline)
          </label>
          <input
            type="number"
            min="30"
            max="120"
            required
            value={restingHrBaseline}
            onChange={(e) => onChange({ restingHrBaseline: Number(e.target.value) })}
            style={{
              width: '100%',
              padding: '0.5rem 0.75rem',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-primary)',
              fontSize: '0.85rem',
              boxSizing: 'border-box',
            }}
          />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Detak saat bangun pagi saat istirahat tenang
          </span>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
            Formula Max HR
          </label>
          <select
            value={hrMaxFormula || 'tanaka'}
            onChange={(e) => {
              const formula = e.target.value as 'tanaka' | 'gellish' | 'custom';
              onChange({
                hrMaxFormula: formula,
                maxHr: formula !== 'custom' ? estimateMaxHeartRate(age, formula) : maxHr,
              });
            }}
            style={{
              width: '100%',
              padding: '0.5rem 0.75rem',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-primary)',
              fontSize: '0.85rem',
              boxSizing: 'border-box',
            }}
          >
            <option value="tanaka">Tanaka (208 - 0.7 x usia) [Standar]</option>
            <option value="gellish">Gellish (207 - 0.7 x usia)</option>
            <option value="custom">Input Hasil Tes Lab Manual</option>
          </select>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {hrMaxFormula === 'custom' ? 'Max HR Lab Manual:' : 'Estimasi Max HR:'}{' '}
            <strong style={{ color: 'var(--accent-neon)' }}>{calculatedMaxHr} bpm</strong>
          </span>
        </div>

        {hrMaxFormula === 'custom' && (
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
              Max HR Lab Manual (bpm)
            </label>
            <input
              type="number"
              min="120"
              max="230"
              required
              value={maxHr}
              onChange={(e) => onChange({ maxHr: Number(e.target.value) })}
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-primary)',
                fontSize: '0.85rem',
                boxSizing: 'border-box',
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};
